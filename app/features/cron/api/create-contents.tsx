import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import { logger } from "~/core/lib/logger";
import type { CreateContentsInput } from "~/core/lib/types";

const FLUE_AGENT_URL = process.env.FLUE_AGENT_URL ?? "http://localhost:8787/agents/test";

async function askTestAgent(runId: string): Promise<string> {
  const url = `${FLUE_AGENT_URL}/${runId}`;
  const auth = { Authorization: `Bearer ${process.env.FLUE_API_TOKEN ?? ""}` };
  const post = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ kind: "user", body: "Go." }),
  });
  if (!post.ok) throw new Error(`Flue send failed: ${post.status}`);

  for (let i = 0; i < 40; i++) {
    const res = await fetch(url, { headers: auth });
    if (!res.ok) throw new Error(`Flue read failed: ${res.status}`);
    const snapshot = await res.json();
    const done = snapshot.settlements?.some((s: { outcome?: string }) => s.outcome === "completed");
    if (done) {
      const assistant = [...(snapshot.messages ?? [])].reverse().find((m: { role?: string }) => m.role === "assistant");
      const text = assistant?.parts?.find((p: { type?: string; text?: string }) => p.type === "text")?.text;
      if (text) return text;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Flue reply timed out");
}

function toHtml(text: string) {
  const escaped = text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  return `<p>${escaped}</p>`;
}

export function createGithubStats(githubResult : Record<string, FetchedRepoData>) {
  if (!githubResult) return null;
  return {
    repoCount: Object.keys(githubResult).length,
    repos: Object.keys(githubResult),
    totalCommits: Object.values(githubResult).reduce((acc, repo) => acc + (repo.commits?.length || 0), 0),
    totalClosedPRs: Object.values(githubResult).reduce((acc, repo) => acc + (repo.closedPRs?.length || 0), 0),
    totalOpenedIssues: Object.values(githubResult).reduce((acc, repo) => acc + (repo.openedIssues?.length || 0), 0),
    totalClosedIssues: Object.values(githubResult).reduce((acc, repo) => acc + (repo.closedIssues?.length || 0), 0)
  }
}

function createSlackStats(slackResult : Record<string, FetchedMessage[]>) {
  if (!slackResult) return null;
  return {
    channelCount: Object.keys(slackResult).length,
    channels: Object.keys(slackResult),
    totalMessages: Object.values(slackResult).reduce((acc, messages) => acc + messages.length, 0)
  }
}

/**
 * コンテンツを生成する関数（直接呼び出し可能）
 */
export async function createContents(input: CreateContentsInput) {

  const githubStats = createGithubStats(input.githubResult || {});
  const slackStats = createSlackStats(input.slackResult || {});
  logger.info('📝 Creating contents', { 
    workspaceId: input.workspaceId, targetId: input.targetId, github: githubStats, slack: slackStats
  });

  const text = await askTestAgent(input.runId);
  const content = { finalContents: text, htmlContents: toHtml(text) };

  logger.info('✅ Contents created successfully', {
    targetId: input.targetId,
    stats: {
      github: githubStats,
      slack: slackStats
    }
  });
  
  return {
    status: 'success',
    data: content
  };
}

/**
 * Action: HTTP POST経由でのコンテンツ生成
 */
export async function action({ request, params }: ActionFunctionArgs) {
  console.log('🚀 Create contents API 호출됨:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  // POST 요청만 허용
  if (request.method !== "POST") {
    return data({ 
      status: 'error', 
      error: 'Only POST requests are allowed' 
    }, { status: 405 });
  }

  try {
    const body = await request.json();
    const result = await createContents(body);
    
    return data(result, { status: 200 });
  } catch (error: any) {
    logger.error('Create contents error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}


