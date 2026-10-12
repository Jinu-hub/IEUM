import { init } from "@flue/runtime";
import { createAgentRouter } from "@flue/runtime/routing";
import { Hono, type MiddlewareHandler } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import * as v from "valibot";
import { CORE_INTERPRETER_PROMPT, CoreInterpreter } from "./agents/core-interpreter.ts";
import { CORE_STRUCTURER_PROMPT, CoreStructurer } from "./agents/core-structurer.ts";
import { DAILY_REPORT_FINALIZER_PROMPT, DailyReportFinalizer } from "./agents/daily-report-finalizer.ts";
import { DAILY_REPORT_WRITER_PROMPT, DailyReportWriter } from "./agents/daily-report-writer.ts";
import {
  SIGNAL_EXTRACTOR_PROMPT,
  refTimes,
  type Signal,
  SignalExtractor,
  signalsBody,
  splitInterpreterInstructions,
} from "./agents/signal-extractor.ts";
import { TestAgent } from "./agents/test-agent.ts";
import {
  buildAgentInput,
  buildCoreJson,
  CORE_SCHEMA_VERSION,
  type CoreMeta,
  coreStats,
  evidenceProblems,
  type Interpretation,
  interpretationStats,
  resolveStructuring,
  type SourceRow,
  type Structuring,
  structurerInput,
} from "./daily-core.ts";
import {
  type DailyCoreJson,
  draftEvidence,
  draftProblems,
  draftStats,
  finalizerInput,
  REPORT_FORMAT_VERSION,
  ReportDraft,
  renderDailyReport,
  revisionStats,
  writerInput,
} from "./daily-report.ts";
import { type PromptEnv, promptData, resolvePrompts } from "./prompts.ts";

// v2: both calls at thinkingLevel "low" (v1 used the default "medium").
// v3: Call 1 may revise once after code lists uncited lines and duplicate candidates.
// "+signals" is appended when SignalExtractor ran before Call 1 (target pipeline_options).
const PIPELINE_VERSION = "flue-two-call-v3";
const MAX_REJECTIONS = 2;
// "none": core items carry empty tags, classifications, and entities (before core-interpreter-v11: "free-text").
const TAXONOMY_VERSION = "none";

type Env = {
  Bindings: PromptEnv & {
    FLUE_API_TOKEN?: string;
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  };
};

type Usage = { [key: string]: number | Usage };
const sumUsage = (a: Usage = {}, b: Usage = {}): Usage =>
  Object.fromEntries(
    [...new Set([...Object.keys(a), ...Object.keys(b)])].map((key) => {
      const [x, y] = [a[key], b[key]];
      return [
        key,
        typeof x === "object" || typeof y === "object"
          ? sumUsage(x as Usage, y as Usage)
          : ((x as number | undefined) ?? 0) + ((y as number | undefined) ?? 0),
      ];
    }),
  );

// Runs one agent in a fresh conversation and returns what it wrote under `key`.
async function runAgent<T>(
  agent: Parameters<typeof init>[0],
  key: string,
  body: string,
  initialData: Record<string, unknown> & { model: string },
  conversations: string[],
) {
  const handle = init(agent);
  conversations.push(handle.id);
  const startedAt = Date.now();
  // Tool call metadata keeps only isError; the stream carries why a submission was rejected.
  const rejections: string[] = [];
  // Writes as they stream: an aborted read returns nothing, yet a write accepted before the abort
  // (CoreInterpreter's first submission, before a failing revision) is still a valid output.
  const streamed: Record<string, unknown[]> = {};
  const receipt = await handle.dispatch({ message: { kind: "user", body }, initialData });
  const reply = await handle
    .read(receipt, {
      onEvent: (chunk) => {
        if (chunk.type.startsWith("data-")) (streamed[chunk.type.slice(5)] ??= []).push((chunk as { data: unknown }).data);
        if (chunk.type !== "tool-output-error") return;
        // ponytail: the text echoes the whole submission, so the failing value stays visible;
        // keep only the error lines if generation rows grow too large.
        rejections.push(chunk.errorText.slice(0, 100_000));
        // Each retry re-emits the whole submission, so stop a model that keeps failing.
        if (rejections.length >= MAX_REJECTIONS) void handle.abort();
      },
    })
    .catch((error) => {
      if (rejections.length < MAX_REJECTIONS) throw error;
      if (streamed[key]?.length) return null;
      throw new Error(`${key}: stopped after ${rejections.length} rejections: ${rejections.at(-1)}`);
    });
  const data = reply?.data ?? streamed;
  const output = data[key]?.at(-1) as T | undefined;
  if (!output) throw new Error(`${key}: agent finished without output: ${reply?.text.slice(0, 500)}`);
  return {
    output,
    data,
    // ponytail: an aborted run reports no usage; read it from the conversation if cost tracking needs it.
    usage: (reply?.metadata?.usage ?? {}) as Usage,
    metrics: {
      conversation_id: handle.id,
      model: initialData.model,
      elapsed_ms: Date.now() - startedAt,
      tool_calls: reply?.metadata?.toolCalls ?? [],
      rejections,
    },
  };
}

// A row has one model_provider/model_name; calls on different models join with "+" like prompt_version.
function modelColumns(models: string[]) {
  const unique = [...new Set(models)].map((model) => model.split("/"));
  if (!unique.length) return { model_provider: null, model_name: null };
  return {
    model_provider: unique.map(([provider]) => provider).join("+"),
    model_name: unique.map(([, ...name]) => name.join("/")).join("+"),
  };
}

// ponytail: sequential REST writes, no transaction. A crash mid-way leaves a row `processing`;
// move the writes into one Postgres function (RPC) when projections are added.
function supabase({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }: Env["Bindings"]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return async <T,>(path: string, init: { method?: string; body?: unknown } = {}) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: init.method ?? "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return (await res.json()) as T[];
  };
}

const isUuid = (id: unknown): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);

type Db = NonNullable<ReturnType<typeof supabase>>;

// One day's saved source rows as the interpreter's message. Null when the daily core does not exist.
async function loadDay(db: Db, dailyCoreId: string) {
  const coreRow = `daily_core_data?daily_core_id=eq.${dailyCoreId}`;
  const [core] = await db<CoreMeta & { workspace_id: string; last_generation_no: number }>(coreRow);
  if (!core) return null;
  const rows = await db<SourceRow & { source_data_id: string }>(
    `daily_core_source_data?daily_core_id=eq.${dailyCoreId}&select=source_data_id,source_type,source_ident,collection_status,normalized_json&order=source_type,source_ident`,
  );
  // select=* rather than the column, so a database without the pipeline_options migration still runs.
  const [target] = await db<{ pipeline_options?: { signals?: unknown } | null }>(`targets?target_id=eq.${core.target_id}`);
  const input = buildAgentInput(rows, core.timezone);
  const body = [
    `Target: ${core.target_display_name} (${core.target_category})`,
    `Date: ${core.core_date} (${core.timezone}, ${core.window_start_at} to ${core.window_end_at})`,
    `People who wrote today: ${input.people.join(", ")}`,
    "",
    input.text,
  ].join("\n");
  return { coreRow, core, rows, input, body, signals: target?.pipeline_options?.signals === true };
}

type Day = NonNullable<Awaited<ReturnType<typeof loadDay>>>;
type PromptData = ReturnType<typeof promptData>;

const runInterpreter = ({ core, input, body }: Day, interpreter: PromptData, conversations: string[], message = body) =>
  runAgent<Interpretation>(
    CoreInterpreter,
    "interpretation",
    message,
    {
      refs: input.refs,
      contextRefs: input.contextRefs,
      botRefs: input.botRefs,
      authors: input.authors,
      texts: input.texts,
      language: core.language,
      ...interpreter,
    },
    conversations,
  );

// Call 1. Given an extractor prompt, SignalExtractor runs first and CoreInterpreter reads its signals
// grouped by subject instead of the raw lines.
async function interpret(day: Day, interpreter: PromptData, extractor: PromptData | null, conversations: string[]) {
  if (!extractor) return { call1: await runInterpreter(day, interpreter, conversations), call0: null };
  const { input, core, body } = day;
  const call0 = await runAgent<Signal[]>(
    SignalExtractor,
    "signals",
    body,
    {
      refs: input.refs,
      contextRefs: input.contextRefs,
      botRefs: input.botRefs,
      authors: input.authors,
      texts: input.texts,
      language: core.language,
      ...extractor,
    },
    conversations,
  );
  const header = body.split("\n").slice(0, 3).join("\n");
  const message = signalsBody(header, call0.output, input.authors, refTimes(body));
  const call1 = await runInterpreter(
    day,
    { ...interpreter, instructions: splitInterpreterInstructions(interpreter.instructions) },
    conversations,
    message,
  );
  return { call1, call0: { ...call0, message } };
}

const app = new Hono<Env>();

const requireToken: MiddlewareHandler<Env> = async (c, next) => {
  const token = c.env.FLUE_API_TOKEN;
  if (!token) return c.text("FLUE_API_TOKEN is not set", 500);
  return bearerAuth<Env>({ token })(c, next);
};

app.get("/", (c) => c.text("hello"));

app.use("/agents/*", requireToken);
app.use("/core/*", requireToken);
app.use("/report/*", requireToken);

app.route("/agents/test", createAgentRouter(TestAgent));

// Generates a Daily Core and saves it as the next generation. `model` overrides each agent's model.
// Call 1 (CoreInterpreter) merges the day into core items, Call 2 (CoreStructurer) places them.
// Targets with pipeline_options.signals run SignalExtractor before Call 1.
app.post("/core/generate", async (c) => {
  const { dailyCoreId, model } = await c.req.json<{ dailyCoreId?: string; model?: string }>();
  if (!isUuid(dailyCoreId)) return c.json({ error: "dailyCoreId must be a uuid" }, 400);
  const db = supabase(c.env);
  if (!db) return c.text("Supabase secrets are not set", 500);
  const day = await loadDay(db, dailyCoreId);
  if (!day) return c.json({ error: "daily core not found" }, 404);
  const { coreRow, core, rows, input, body } = day;
  const inputStats = { ...input.counts, chars: body.length };

  const generationNo = core.last_generation_no + 1;
  const startedAt = new Date();
  const [interpreterPrompt, structurerPrompt, extractorPrompt] = await resolvePrompts(c.env, [
    CORE_INTERPRETER_PROMPT,
    CORE_STRUCTURER_PROMPT,
    SIGNAL_EXTRACTOR_PROMPT,
  ]);
  const interpreter = promptData(interpreterPrompt, model);
  const structurer = promptData(structurerPrompt, model);
  const extractor = day.signals ? promptData(extractorPrompt, model) : null;
  const [generation] = await db<{ generation_id: string }>("daily_core_generations", {
    method: "POST",
    body: {
      daily_core_id: dailyCoreId,
      workspace_id: core.workspace_id,
      target_id: core.target_id,
      generation_no: generationNo,
      trigger: "manual",
      generation_status: "processing",
      input_source_data_ids: rows.map((row) => row.source_data_id),
      schema_version: CORE_SCHEMA_VERSION,
      taxonomy_version: TAXONOMY_VERSION,
      prompt_version: [...(extractor ? [extractorPrompt.version] : []), interpreterPrompt.version, structurerPrompt.version].join(
        "+",
      ),
      pipeline_version: extractor ? `${PIPELINE_VERSION}+signals` : PIPELINE_VERSION,
      ...modelColumns([...(extractor ? [extractor.model] : []), interpreter.model, structurer.model]),
      input_stats_json: inputStats,
      started_at: startedAt.toISOString(),
    },
  });
  const generationRow = `daily_core_generations?generation_id=eq.${generation.generation_id}`;
  await db(coreRow, {
    method: "PATCH",
    body: { last_generation_no: generationNo, last_attempt_at: startedAt.toISOString(), updated_at: startedAt.toISOString() },
  });

  const conversations: string[] = [];
  try {
    const { call0, call1 } = await interpret(day, interpreter, extractor, conversations);
    const interpretation = call1.output;
    const call2 = await runAgent<Structuring>(
      CoreStructurer,
      "structuring",
      structurerInput(interpretation, input.people),
      {
        coreRefs: Object.fromEntries(interpretation.core_items.map((item) => [item.concept_key, item.evidence_refs])),
        authors: input.authors,
        people: input.people,
        language: core.language,
        ...structurer,
      },
      conversations,
    );
    const structuring = call2.output;

    const output = resolveStructuring(structuring, interpretation, input.authors);
    const coreJson = buildCoreJson(core, rows, output, input.people, input);
    const placed = new Set(
      [...structuring.highlights, ...structuring.topics, ...structuring.progress_roadmap, ...structuring.member_activity].flatMap(
        (item) => item.core_item_ids,
      ),
    );
    const stats = {
      ...coreStats(output, input),
      interpretation: interpretationStats(interpretation, input),
      unplaced_core_items: interpretation.core_items.map((item) => item.concept_key).filter((key) => !placed.has(key)),
    };
    const usage = {
      ...sumUsage(sumUsage(call0?.usage, call1.usage), call2.usage),
      calls: { ...(call0 && { extractor: call0.usage }), interpretation: call1.usage, structuring: call2.usage },
    };
    const calls = { ...(call0 && { extractor: call0.metrics }), interpretation: call1.metrics, structuring: call2.metrics };
    const finishedAt = new Date().toISOString();
    await db(generationRow, {
      method: "PATCH",
      body: {
        generation_status: "succeeded",
        quality_status: coreJson.quality.status,
        agent_conversation_id: conversations[0],
        agent_output_json: {
          ...(call0 && { signals: call0.output }),
          interpretation,
          structuring,
          dropped_actors: call1.data.droppedActors?.at(-1) ?? [],
        },
        core_json: coreJson,
        token_usage_json: usage,
        processing_metrics_json: { elapsed_ms: Date.now() - startedAt.getTime(), calls },
        validation_json: { evidence_problems: evidenceProblems(output, input), stats },
        finished_at: finishedAt,
      },
    });
    await db(coreRow, {
      method: "PATCH",
      body: {
        current_generation_no: generationNo,
        quality_status: coreJson.quality.status,
        last_generated_at: finishedAt,
        last_error_code: null,
        last_error_message: null,
        updated_at: finishedAt,
      },
    });
    return c.json({
      dailyCoreId,
      generationNo,
      status: "succeeded",
      elapsedMs: Date.now() - startedAt.getTime(),
      usage,
      calls,
      stats,
      coreJson,
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
    const finishedAt = new Date().toISOString();
    await db(generationRow, {
      method: "PATCH",
      body: {
        generation_status: "failed",
        agent_conversation_id: conversations[0] ?? null,
        error_code: "generation_failed",
        error_message: message,
        processing_metrics_json: { elapsed_ms: Date.now() - startedAt.getTime(), conversations },
        finished_at: finishedAt,
      },
    });
    await db(coreRow, {
      method: "PATCH",
      body: { last_error_code: "generation_failed", last_error_message: message, updated_at: finishedAt },
    });
    return c.json({ dailyCoreId, generationNo, status: "failed", error: message }, 500);
  }
});

// Test only (interpreter quality work, flue/src/interpreter.run.ts): runs Call 1 on a saved day and
// returns its output with the input it read. Writes nothing to the DB. `signals` overrides the
// target's pipeline_options.signals.
app.post("/core/interpret", async (c) => {
  const { dailyCoreId, model, signals } = await c.req.json<{ dailyCoreId?: string; model?: string; signals?: boolean }>();
  if (!isUuid(dailyCoreId)) return c.json({ error: "dailyCoreId must be a uuid" }, 400);
  const db = supabase(c.env);
  if (!db) return c.text("Supabase secrets are not set", 500);
  const day = await loadDay(db, dailyCoreId);
  if (!day) return c.json({ error: "daily core not found" }, 404);
  const [prompt, extractorPrompt] = await resolvePrompts(c.env, [CORE_INTERPRETER_PROMPT, SIGNAL_EXTRACTOR_PROMPT]);
  const interpreter = promptData(prompt, model);
  const extractor = (signals ?? day.signals) ? promptData(extractorPrompt, model) : null;
  const promptVersion = [...(extractor ? [extractorPrompt.version] : []), prompt.version].join("+");
  const startedAt = Date.now();
  try {
    const { call0, call1 } = await interpret(day, interpreter, extractor, []);
    return c.json({
      status: "succeeded",
      coreDate: day.core.core_date,
      promptVersion,
      model: interpreter.model,
      thinkingLevel: interpreter.thinkingLevel,
      elapsedMs: Date.now() - startedAt,
      usage: sumUsage(call0?.usage, call1.usage),
      metrics: { ...call1.metrics, rejections: [...(call0?.metrics.rejections ?? []), ...call1.metrics.rejections] },
      ...(call0 && {
        calls: {
          extractor: { ...call0.metrics, usage: call0.usage },
          interpretation: { ...call1.metrics, usage: call1.usage },
        },
        signals: call0.output,
        signalsBody: call0.message,
      }),
      stats: interpretationStats(call1.output, day.input),
      interpretation: call1.output,
      droppedActors: call1.data.droppedActors?.at(-1) ?? [],
      review: call1.data.review?.at(-1) ?? null,
      input: { body: day.body, authors: day.input.authors },
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
    return c.json({ status: "failed", promptVersion, error: message }, 500);
  }
});

// Writes the Daily Report from the current Daily Core generation and saves it as the next
// daily_reports row. Days without activity get the code-rendered report and no model call.
// DailyReportFinalizer rewrites the writer's draft unless `finalize: false`; it is where later
// editing (tone and the like) goes. A given `draft` (a saved writer output for the same
// generation) replaces the writer call.
app.post("/report/generate", async (c) => {
  const { dailyCoreId, model, finalize = true, draft } = await c.req.json<{
    dailyCoreId?: string;
    model?: string;
    finalize?: boolean;
    draft?: unknown;
  }>();
  if (!isUuid(dailyCoreId)) return c.json({ error: "dailyCoreId must be a uuid" }, 400);
  const given = draft === undefined ? undefined : v.safeParse(ReportDraft, draft);
  if (given && !given.success) return c.json({ error: "draft does not match ReportDraft", issues: v.flatten(given.issues) }, 400);
  const db = supabase(c.env);
  if (!db) return c.text("Supabase secrets are not set", 500);

  const [core] = await db<{ workspace_id: string; target_id: string; current_generation_no: number | null }>(
    `daily_core_data?daily_core_id=eq.${dailyCoreId}&select=workspace_id,target_id,current_generation_no`,
  );
  if (!core) return c.json({ error: "daily core not found" }, 404);
  if (core.current_generation_no === null) return c.json({ error: "daily core has no current generation" }, 409);
  const generationNo = core.current_generation_no;
  const [generation] = await db<{ core_json: DailyCoreJson }>(
    `daily_core_generations?daily_core_id=eq.${dailyCoreId}&generation_no=eq.${generationNo}&select=core_json`,
  );
  if (!generation?.core_json) return c.json({ error: `generation ${generationNo} has no core_json` }, 409);
  const coreJson = generation.core_json;
  const empty = coreJson.quality.status === "empty";

  const evidence = draftEvidence(coreJson);
  const language = coreJson.meta.language;
  if (given && !empty) {
    const problems = draftProblems(given.output, evidence);
    if (problems.length) return c.json({ error: "draft does not fit this generation", problems }, 400);
  }

  // ponytail: report_no is max + 1 without a lock; a concurrent request fails on the unique index.
  const [last] = await db<{ report_no: number }>(
    `daily_reports?daily_core_id=eq.${dailyCoreId}&select=report_no&order=report_no.desc&limit=1`,
  );
  const reportNo = (last?.report_no ?? 0) + 1;
  const startedAt = new Date();
  const [report] = await db<{ report_id: string }>("daily_reports", {
    method: "POST",
    body: {
      daily_core_id: dailyCoreId,
      workspace_id: core.workspace_id,
      target_id: core.target_id,
      report_no: reportNo,
      core_generation_no: generationNo,
      report_status: "processing",
      language,
      format_version: REPORT_FORMAT_VERSION,
      started_at: startedAt.toISOString(),
    },
  });
  const reportRow = `daily_reports?report_id=eq.${report.report_id}`;
  const saved = { dailyCoreId, reportId: report.report_id, reportNo, generationNo };

  if (empty) {
    const rendered = renderDailyReport(coreJson);
    const finishedAt = new Date();
    await db(reportRow, {
      method: "PATCH",
      body: {
        report_status: "succeeded",
        ...rendered,
        processing_metrics_json: { elapsed_ms: finishedAt.getTime() - startedAt.getTime() },
        finished_at: finishedAt.toISOString(),
      },
    });
    return c.json({ ...saved, status: "succeeded", formatVersion: REPORT_FORMAT_VERSION, ...rendered });
  }

  const conversations: string[] = [];
  const [writerPrompt, finalizerPrompt] = await resolvePrompts(c.env, [DAILY_REPORT_WRITER_PROMPT, DAILY_REPORT_FINALIZER_PROMPT]);
  const writerData = promptData(writerPrompt, model);
  const finalizerData = promptData(finalizerPrompt, model);
  const models = [...(given ? [] : [writerData.model]), ...(finalize ? [finalizerData.model] : [])];
  try {
    const writer = given
      ? null
      : await runAgent<ReportDraft>(
          DailyReportWriter,
          "draft",
          writerInput(coreJson),
          { ...evidence, language, ...writerData },
          conversations,
        );
    const written = given?.output ?? writer!.output;
    const finalizer = finalize
      ? await runAgent<ReportDraft>(
          DailyReportFinalizer,
          "draft",
          finalizerInput(coreJson, written),
          { before: written, ...evidence, language, ...finalizerData },
          conversations,
        )
      : null;
    const final = finalizer?.output ?? written;
    const rendered = renderDailyReport(coreJson, final);
    const promptVersion = [
      writer ? writerPrompt.version : "given-draft",
      ...(finalizer ? [finalizerPrompt.version] : []),
    ].join("+");
    const usage = {
      ...sumUsage(writer?.usage, finalizer?.usage),
      calls: { ...(writer && { writer: writer.usage }), ...(finalizer && { finalizer: finalizer.usage }) },
    };
    const calls = { ...(writer && { writer: writer.metrics }), ...(finalizer && { finalizer: finalizer.metrics }) };
    const stats = { ...draftStats(final, evidence), ...(finalizer && { revision: revisionStats(written, final) }) };
    const finishedAt = new Date();
    const elapsedMs = finishedAt.getTime() - startedAt.getTime();
    await db(reportRow, {
      method: "PATCH",
      body: {
        report_status: "succeeded",
        ...rendered,
        agent_conversation_id: conversations[0] ?? null,
        agent_output_json: { draft: final, ...(finalizer && { writer_draft: written }) },
        prompt_version: promptVersion,
        ...modelColumns(models),
        token_usage_json: usage,
        processing_metrics_json: { elapsed_ms: elapsedMs, calls },
        validation_json: { stats },
        finished_at: finishedAt.toISOString(),
      },
    });
    return c.json({
      ...saved,
      status: "succeeded",
      formatVersion: REPORT_FORMAT_VERSION,
      promptVersion,
      models,
      elapsedMs,
      usage,
      calls,
      stats,
      ...(finalizer && { writerDraft: written }),
      draft: final,
      ...rendered,
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
    const finishedAt = new Date();
    await db(reportRow, {
      method: "PATCH",
      body: {
        report_status: "failed",
        agent_conversation_id: conversations[0] ?? null,
        ...modelColumns(models),
        error_code: "report_failed",
        error_message: message,
        processing_metrics_json: { elapsed_ms: finishedAt.getTime() - startedAt.getTime(), conversations },
        finished_at: finishedAt.toISOString(),
      },
    });
    return c.json({ ...saved, status: "failed", error: message }, 500);
  }
});

export default app;
