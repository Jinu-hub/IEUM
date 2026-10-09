import { init } from "@flue/runtime";
import { createAgentRouter } from "@flue/runtime/routing";
import { Hono, type MiddlewareHandler } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { DAILY_CORE_MODEL, DAILY_CORE_PROMPT_VERSION, DailyCore } from "./agents/daily-core.ts";
import { TestAgent } from "./agents/test-agent.ts";
import { buildAgentInput, type DailyCoreOutput, evidenceProblems, type SourceRow } from "./daily-core.ts";

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

// Dry run: generates and returns the Daily Core without saving it.
app.post("/core/generate", async (c) => {
  const { dailyCoreId } = await c.req.json<{ dailyCoreId?: string }>();
  if (!dailyCoreId || !/^[0-9a-f-]{36}$/i.test(dailyCoreId)) {
    return c.json({ error: "dailyCoreId must be a uuid" }, 400);
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = c.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return c.text("Supabase secrets are not set", 500);
  const select = async <T,>(path: string) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    return (await res.json()) as T[];
  };

  const [core] = await select<{
    target_display_name: string;
    target_category: string;
    core_date: string;
    timezone: string;
    language: string;
    window_start_at: string;
    window_end_at: string;
  }>(`daily_core_data?daily_core_id=eq.${dailyCoreId}`);
  if (!core) return c.json({ error: "daily core not found" }, 404);
  const rows = await select<SourceRow>(
    `daily_core_source_data?daily_core_id=eq.${dailyCoreId}&select=source_type,source_ident,collection_status,normalized_json&order=source_type,source_ident`,
  );

  const input = buildAgentInput(rows, core.timezone);
  const body = [
    `Target: ${core.target_display_name} (${core.target_category})`,
    `Date: ${core.core_date} (${core.timezone}, ${core.window_start_at} to ${core.window_end_at})`,
    "",
    input.text,
  ].join("\n");

  const { refs, contextRefs, botRefs, people } = input;
  const evidence = { refs, contextRefs, botRefs, people };
  const startedAt = Date.now();
  const agent = init(DailyCore);
  const receipt = await agent.dispatch({
    message: { kind: "user", body },
    initialData: { ...evidence, language: core.language },
  });
  const reply = await agent.read(receipt);
  const output = (reply.data.dailyCore?.at(-1) as DailyCoreOutput | undefined) ?? null;

  return c.json({
    dailyCoreId,
    conversationId: agent.id,
    model: DAILY_CORE_MODEL,
    promptVersion: DAILY_CORE_PROMPT_VERSION,
    elapsedMs: Date.now() - startedAt,
    usage: reply.metadata?.usage ?? null,
    toolCalls: reply.metadata?.toolCalls ?? null,
    input: { ...input.counts, chars: body.length },
    evidenceProblems: output ? evidenceProblems(output, evidence) : ["no output"],
    output,
    text: reply.text,
  });
});

export default app;
