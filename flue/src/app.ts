import { createAgentRouter } from "@flue/runtime/routing";
import { Hono, type MiddlewareHandler } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { TestAgent } from "./agents/test-agent.ts";

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

export default app;
