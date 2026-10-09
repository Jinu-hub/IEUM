import { init } from "@flue/runtime";
import { createAgentRouter } from "@flue/runtime/routing";
import { Hono, type MiddlewareHandler } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { DAILY_CORE_MODEL, DAILY_CORE_PROMPT_VERSION, DailyCore } from "./agents/daily-core.ts";
import { TestAgent } from "./agents/test-agent.ts";
import {
  buildAgentInput,
  buildCoreJson,
  CORE_SCHEMA_VERSION,
  type CoreMeta,
  type DailyCoreOutput,
  evidenceProblems,
  type SourceRow,
} from "./daily-core.ts";

const PIPELINE_VERSION = "flue-single-agent-v1";
// Classifications are free text until a taxonomy exists.
const TAXONOMY_VERSION = "free-text";

type Env = {
  Bindings: {
    FLUE_API_TOKEN?: string;
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  };
};

const app = new Hono<Env>();

const requireToken: MiddlewareHandler<Env> = async (c, next) => {
  const token = c.env.FLUE_API_TOKEN;
  if (!token) return c.text("FLUE_API_TOKEN is not set", 500);
  return bearerAuth<Env>({ token })(c, next);
};

app.get("/", (c) => c.text("hello"));

app.use("/agents/*", requireToken);
app.use("/db/*", requireToken);
app.use("/core/*", requireToken);

app.route("/agents/test", createAgentRouter(TestAgent));

// ponytail: deploy check only, remove once the real pipeline writes to Supabase
app.post("/db/ping", async (c) => {
  const { workspaceId, runId } = await c.req.json<{ workspaceId?: string; runId?: string }>();
  if (!workspaceId || !runId) return c.json({ error: "workspaceId and runId are required" }, 400);

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = c.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return c.text("Supabase secrets are not set", 500);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/run_log_events`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      run_id: runId,
      level: "info",
      step_name: "flue_ping",
      message: "Written by the deployed Flue worker",
    }),
  });
  return c.json(await res.json(), res.status as 201);
});

// Generates a Daily Core and saves it as the next generation. `model` overrides the default model.
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
      prompt_version: DAILY_CORE_PROMPT_VERSION,
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

  const { refs, contextRefs, botRefs, people } = input;
  const evidence = { refs, contextRefs, botRefs, people };
  const agent = init(DailyCore);
  try {
    const receipt = await agent.dispatch({
      message: { kind: "user", body },
      initialData: { ...evidence, language: core.language, model },
    });
    const reply = await agent.read(receipt);
    const output = reply.data.dailyCore?.at(-1) as DailyCoreOutput | undefined;
    if (!output) throw new Error(`agent finished without a Daily Core: ${reply.text.slice(0, 500)}`);

    const coreJson = buildCoreJson(core, rows, output, people);
    const finishedAt = new Date().toISOString();
    await db(generationRow, {
      method: "PATCH",
      body: {
        generation_status: "succeeded",
        quality_status: coreJson.quality.status,
        agent_conversation_id: agent.id,
        agent_output_json: output,
        core_json: coreJson,
        token_usage_json: reply.metadata?.usage ?? {},
        processing_metrics_json: {
          elapsed_ms: Date.now() - startedAt.getTime(),
          tool_calls: reply.metadata?.toolCalls ?? [],
        },
        validation_json: { evidence_problems: evidenceProblems(output, evidence) },
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
      usage: reply.metadata?.usage ?? null,
      coreJson,
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
    const finishedAt = new Date().toISOString();
    await db(generationRow, {
      method: "PATCH",
      body: {
        generation_status: "failed",
        agent_conversation_id: agent.id,
        error_code: "generation_failed",
        error_message: message,
        processing_metrics_json: { elapsed_ms: Date.now() - startedAt.getTime() },
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
