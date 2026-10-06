import { createAgentRouter } from "@flue/runtime/routing";
import { Hono } from "hono";

import { TestAgent } from "./agents/test-agent.ts";

const app = new Hono();

app.get("/", (c) => c.text("hello"));
app.route("/agents/test", createAgentRouter(TestAgent));

export default app;
