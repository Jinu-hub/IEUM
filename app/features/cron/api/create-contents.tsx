import {
  setDefaultOpenAIKey
} from "@openai/agents";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import { logger } from "~/core/lib/logger";
import type { CreateContentsInput } from "~/core/lib/types";
import { generateContents } from "~/core/processes/mainProcess";

/**
 * OpenAI APIキーを初期化（一度だけ実行）
 */
let isOpenAIInitialized = false;
function initializeOpenAI() {
  if (!isOpenAIInitialized) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    setDefaultOpenAIKey(apiKey);
    isOpenAIInitialized = true;
    logger.info('✅ OpenAI API key initialized');
  }
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
export async function createContents(input: CreateContentsInput, runStepId?: string) {

  initializeOpenAI();

  const githubStats = createGithubStats(input.githubResult || {});
  const slackStats = createSlackStats(input.slackResult || {});
  logger.info('📝 Creating contents', { 
    workspaceId: input.workspaceId, targetId: input.targetId, github: githubStats, slack: slackStats
  });

  const content = await generateContents(input);

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
    const result = await createContents(body, '');
    
    return data(result, { status: 200 });
  } catch (error: any) {
    logger.error('Create contents error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}


