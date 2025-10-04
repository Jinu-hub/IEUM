import {
    run,
    setDefaultOpenAIKey
} from "@openai/agents";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import { logger } from "~/core/lib/logger";
import { buildGithubPrompt } from "~/core/openai/prompts/prompt-builder";
import { summarizerAgent } from "~/core/openai/test-agent";

/**
 * コンテンツ生成用のデータ型
 */
type CreateContentsInput = {
  githubResult?: Record<string, FetchedRepoData> | null;
  slackResult?: Record<string, FetchedMessage[]> | null;
  workspaceId: string;
  targetId: string;
};

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

/**
 * コンテンツを生成する関数（直接呼び出し可能）
 */
export async function createContents(input: CreateContentsInput) {
  // OpenAI APIキーを初期化
  initializeOpenAI();
  // データの統計情報を計算（実際のデータは含めない）
  const githubStats = input.githubResult 
    ? {
        repoCount: Object.keys(input.githubResult).length,
        repos: Object.keys(input.githubResult),
        totalCommits: Object.values(input.githubResult).reduce((acc, repo) => acc + (repo.commits?.length || 0), 0),
        totalPRs: Object.values(input.githubResult).reduce((acc, repo) => acc + (repo.mergedPRs?.length || 0), 0),
        totalOpenedIssues: Object.values(input.githubResult).reduce((acc, repo) => acc + (repo.openedIssues?.length || 0), 0),
        totalClosedIssues: Object.values(input.githubResult).reduce((acc, repo) => acc + (repo.closedIssues?.length || 0), 0)
      }
    : null;

  const slackStats = input.slackResult
    ? {
        channelCount: Object.keys(input.slackResult).length,
        channels: Object.keys(input.slackResult),
        totalMessages: Object.values(input.slackResult).reduce((acc, messages) => acc + messages.length, 0)
      }
    : null;

  logger.info('📝 Creating contents', { 
    workspaceId: input.workspaceId,
    targetId: input.targetId,
    github: githubStats,
    slack: slackStats
  });

  //const summaryPrompt = buildPromptFromGithubData(Object.values(input.githubResult || {}));
  const summaryPrompt = buildGithubPrompt(
    Object.values(input.githubResult || {}),
    'ja' // 또는 input.language 같은 동적 값
  );
  const content = await run(summarizerAgent, summaryPrompt);

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
 * 📦 runGithubFetch() 결과를 사람이 읽을 수 있는 텍스트 프롬프트로 변환
 */
function buildPromptFromGithubData(repos: any[]): string {
    return `
  Generate a weekly engineering report based on the following GitHub activity:
  
  ${repos
    .map(
      (repo) => `
  ### 📁 Repository: ${repo.repo.name}
  
  - **Commits (${repo.commits.length})**:
  ${repo.commits
    .slice(0, 5)
    .map((c: any) => `  - ${c.message} (${c.author}, ${c.date})`)
    .join("\n")}
  
  - **Merged PRs (${repo.mergedPRs.length})**:
  ${repo.mergedPRs
    .slice(0, 5)
    .map((pr: any) => `  - #${pr.number}: ${pr.title} by ${pr.author}`)
    .join("\n")}
  
  - **Opened Issues (${repo.openedIssues.length})**:
  ${repo.openedIssues
    .slice(0, 5)
    .map((i: any) => `  - #${i.number}: ${i.title}`)
    .join("\n")}
  
  - **Closed Issues (${repo.closedIssues.length})**:
  ${repo.closedIssues
    .slice(0, 5)
    .map((i: any) => `  - #${i.number}: ${i.title}`)
    .join("\n")}
  `
    )
    .join("\n")}
  
  Write a markdown report with:
  - 📝 **Project summaries** per repo
  - 📊 Key stats (commit count, PR merged, issues opened/closed)
  - ✨ Notable highlights (important PRs or issues)
  - 📅 A short “Next week focus” suggestion if possible
  `;
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
