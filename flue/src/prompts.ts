import * as v from "valibot";

export const ThinkingLevel = v.picklist(["off", "minimal", "low", "medium", "high", "xhigh"]);
export type ThinkingLevel = v.InferOutput<typeof ThinkingLevel>;

// Used when a prompt DB template leaves thinking_level null. Flue itself would fall back to "medium".
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "low";

// What one agent runs with. Each agent file holds a code default; the prompt DB can replace it.
// `instructions` excludes the closing lines that need run values (language, submit tool), which
// the agent appends.
export type AgentPrompt = {
  agentKey: string;
  version: string;
  model: string;
  thinkingLevel: ThinkingLevel;
  instructions: string;
};

export type PromptEnv = {
  PROMPTS_SUPABASE_URL?: string;
  PROMPTS_SUPABASE_KEY?: string;
  PROMPT_ENVIRONMENT?: string;
};

const SERVICE_KEY = "ieum";
const SHARED_ENVIRONMENT = "default";
const TIMEOUT_MS = 5000;

type ReleaseRow = {
  agent_key: string;
  environment: string;
  prompt_templates: {
    version: number;
    template: string;
    default_provider: string | null;
    default_model: string | null;
    thinking_level: ThinkingLevel | null;
  } | null;
};

// Picks each agent's prompt from the prompt DB's prompt_releases: the row for PROMPT_ENVIRONMENT
// first, then the "default" row. An agent without a row keeps its code default, and so does every
// agent when the prompt DB is not configured or the lookup fails.
export async function resolvePrompts(env: PromptEnv, defaults: AgentPrompt[]): Promise<AgentPrompt[]> {
  const { PROMPTS_SUPABASE_URL: url, PROMPTS_SUPABASE_KEY: key, PROMPT_ENVIRONMENT: environment } = env;
  if (!url || !key) return defaults;
  const environments = [...new Set([environment, SHARED_ENVIRONMENT].filter((name): name is string => !!name))];
  const query = new URLSearchParams({
    service_key: `eq.${SERVICE_KEY}`,
    agent_key: `in.(${defaults.map((prompt) => prompt.agentKey).join(",")})`,
    environment: `in.(${environments.join(",")})`,
    select: "agent_key,environment,prompt_templates(version,template,default_provider,default_model,thinking_level)",
  });

  let rows: ReleaseRow[];
  try {
    // New Supabase keys (sb_secret_...) are not JWTs and go only in the apikey header.
    const res = await fetch(`${url}/rest/v1/prompt_releases?${query}`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    rows = (await res.json()) as ReleaseRow[];
  } catch (error) {
    console.warn(`prompt DB lookup failed, using code defaults: ${error instanceof Error ? error.message : error}`);
    return defaults;
  }

  return defaults.map((fallback) => {
    const row = environments
      .map((name) => rows.find((r) => r.agent_key === fallback.agentKey && r.environment === name))
      .find((r) => r?.prompt_templates?.template.trim());
    const template = row?.prompt_templates;
    if (!row || !template) return fallback;
    return {
      agentKey: fallback.agentKey,
      version: `${fallback.agentKey}@v${template.version}(${row.environment})`,
      model:
        template.default_provider && template.default_model
          ? `${template.default_provider}/${template.default_model}`
          : fallback.model,
      thinkingLevel: template.thinking_level ?? DEFAULT_THINKING_LEVEL,
      instructions: template.template,
    };
  });
}

// The initialData fields every agent reads. A request `model` overrides the prompt's model.
export const promptData = (prompt: AgentPrompt, model?: string) => ({
  instructions: prompt.instructions,
  thinkingLevel: prompt.thinkingLevel,
  model: model ?? prompt.model,
});
