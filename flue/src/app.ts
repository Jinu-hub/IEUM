import { init } from "@flue/runtime";
import { createAgentRouter } from "@flue/runtime/routing";
import { Hono, type MiddlewareHandler } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { CORE_INTERPRETER_PROMPT_VERSION, CoreInterpreter } from "./agents/core-interpreter.ts";
import { CORE_STRUCTURER_PROMPT_VERSION, CoreStructurer } from "./agents/core-structurer.ts";
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

const DAILY_CORE_MODEL = "openai/gpt-5.4-mini";
// v2: both calls at thinkingLevel "low" (v1 used the default "medium").
const PIPELINE_VERSION = "flue-two-call-v2";
const MAX_REJECTIONS = 2;
const PROMPT_VERSION = `${CORE_INTERPRETER_PROMPT_VERSION}+${CORE_STRUCTURER_PROMPT_VERSION}`;
// Classifications are free text until a taxonomy exists.
const TAXONOMY_VERSION = "free-text";

type Env = {
  Bindings: {
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
  initialData: unknown,
  conversations: string[],
) {
  const handle = init(agent);
  conversations.push(handle.id);
  const startedAt = Date.now();
  // Tool call metadata keeps only isError; the stream carries why a submission was rejected.
  const rejections: string[] = [];
  const receipt = await handle.dispatch({ message: { kind: "user", body }, initialData });
  const reply = await handle
    .read(receipt, {
      onEvent: (chunk) => {
        if (chunk.type !== "tool-output-error") return;
        rejections.push(chunk.errorText.slice(0, 2000));
        // Each retry re-emits the whole submission, so stop a model that keeps failing.
        if (rejections.length >= MAX_REJECTIONS) void handle.abort();
      },
    })
    .catch((error) => {
      if (rejections.length < MAX_REJECTIONS) throw error;
      throw new Error(`${key}: stopped after ${rejections.length} rejections: ${rejections.at(-1)}`);
    });
  const output = reply.data[key]?.at(-1) as T | undefined;
  if (!output) throw new Error(`${key}: agent finished without output: ${reply.text.slice(0, 500)}`);
  return {
    output,
    data: reply.data,
    usage: (reply.metadata?.usage ?? {}) as Usage,
    metrics: {
      conversation_id: handle.id,
      elapsed_ms: Date.now() - startedAt,
      tool_calls: reply.metadata?.toolCalls ?? [],
      rejections,
    },
  };
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

app.route("/agents/test", createAgentRouter(TestAgent));

// Generates a Daily Core and saves it as the next generation. `model` overrides the default model.
// Call 1 (CoreInterpreter) merges the day into core items, Call 2 (CoreStructurer) places them.
app.post("/core/generate", async (c) => {
  const { dailyCoreId, model = DAILY_CORE_MODEL } = await c.req.json<{ dailyCoreId?: string; model?: string }>();
  if (!dailyCoreId || !/^[0-9a-f-]{36}$/i.test(dailyCoreId)) {
    return c.json({ error: "dailyCoreId must be a uuid" }, 400);
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = c.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return c.text("Supabase secrets are not set", 500);
  // ponytail: sequential REST writes, no transaction. A crash mid-way leaves the generation `processing`;
  // move the writes into one Postgres function (RPC) when projections are added.
  const db = async <T,>(path: string, init: { method?: string; body?: unknown } = {}) => {
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
  const coreRow = `daily_core_data?daily_core_id=eq.${dailyCoreId}`;

  const [core] = await db<CoreMeta & { workspace_id: string; last_generation_no: number }>(coreRow);
  if (!core) return c.json({ error: "daily core not found" }, 404);
  const rows = await db<SourceRow & { source_data_id: string }>(
    `daily_core_source_data?daily_core_id=eq.${dailyCoreId}&select=source_data_id,source_type,source_ident,collection_status,normalized_json&order=source_type,source_ident`,
  );

  const input = buildAgentInput(rows, core.timezone);
  const body = [
    `Target: ${core.target_display_name} (${core.target_category})`,
    `Date: ${core.core_date} (${core.timezone}, ${core.window_start_at} to ${core.window_end_at})`,
    `People who wrote today: ${input.people.join(", ")}`,
    "",
    input.text,
  ].join("\n");
  const inputStats = { ...input.counts, chars: body.length };

  const generationNo = core.last_generation_no + 1;
  const startedAt = new Date();
  const [modelProvider, ...modelName] = model.split("/");
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
      prompt_version: PROMPT_VERSION,
      pipeline_version: PIPELINE_VERSION,
      model_provider: modelProvider,
      model_name: modelName.join("/"),
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
    const call1 = await runAgent<Interpretation>(
      CoreInterpreter,
      "interpretation",
      body,
      {
        refs: input.refs,
        contextRefs: input.contextRefs,
        botRefs: input.botRefs,
        authors: input.authors,
        language: core.language,
        model,
      },
      conversations,
    );
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
        model,
      },
      conversations,
    );
    const structuring = call2.output;

    const output = resolveStructuring(structuring, interpretation, input.authors);
    const coreJson = buildCoreJson(core, rows, output, input.people);
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
    const usage = { ...sumUsage(call1.usage, call2.usage), calls: { interpretation: call1.usage, structuring: call2.usage } };
    const finishedAt = new Date().toISOString();
    await db(generationRow, {
      method: "PATCH",
      body: {
        generation_status: "succeeded",
        quality_status: coreJson.quality.status,
        agent_conversation_id: conversations[0],
        agent_output_json: { interpretation, structuring, dropped_actors: call1.data.droppedActors?.at(-1) ?? [] },
        core_json: coreJson,
        token_usage_json: usage,
        processing_metrics_json: {
          elapsed_ms: Date.now() - startedAt.getTime(),
          calls: { interpretation: call1.metrics, structuring: call2.metrics },
        },
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
      calls: { interpretation: call1.metrics, structuring: call2.metrics },
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

export default app;
