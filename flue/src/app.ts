import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { TestAgent } from "./agents/test-agent.ts";

type Env = { Bindings: { FLUE_API_TOKEN?: string } };

const app = new Hono<Env>();

app.get("/", (c) => c.text("hello"));

app.use("/agents/*", async (c, next) => {
  const token = c.env.FLUE_API_TOKEN;
  if (!token) return c.text("FLUE_API_TOKEN is not set", 500);
  return bearerAuth<Env>({ token })(c, next);
});

app.route("/agents/test", createAgentRouter(TestAgent));

export default app;
