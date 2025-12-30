/**
 * 통합 데이터 페칭 함수
 */

import { runGithubFetch } from "~/core/integrations/github/run";
import { runSlackFetch } from "~/core/integrations/slack/run";
import { logger } from "~/core/lib/logger";
import type { EnableCreateContents } from "~/core/lib/types";
import type { FetchedData, MatchedSources } from "./types";

/**
 * GitHub 데이터 페칭
 */
export async function fetchGithubData(
  credentialRef: string,
  repos: string[]
): Promise<{ result: any; enabled: boolean }> {
  const { getGitHubToken } = await import("~/core/lib/secrets-manager.server");
  const githubToken = await getGitHubToken(credentialRef) || undefined;
  const githubRepos = repos.join(',');

  logger.info('[github]');
  logger.info(` credentialRef: ${credentialRef}`);
  logger.info(` repos: ${githubRepos}`);

  try {
    const githubResult = await runGithubFetch({
      repos: githubRepos,
      outDir: 'output-test',
      token: githubToken,
      installationId: credentialRef,
      days: 7,
    });

    const enabled = githubResult && Object.keys(githubResult).length > 0;
    return { result: githubResult, enabled };
  } catch (error: any) {
    logger.error('Github fetch error', { 
      error: error.message || String(error),
      status: error.status,
      response: error.response?.data,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Slack 데이터 페칭
 */
export async function fetchSlackData(
  credentialRef: string,
  channels: string[],
  sourcesWithType: any[]
): Promise<{ result: any; enabled: boolean }> {
  const { getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
  const slackToken = await getSlackBotToken(credentialRef) || undefined;
  const slackChannels = channels.join(',');

  logger.info('[slack]');
  logger.info(` credentialRef: ${credentialRef}`);
  logger.info(` token: ${slackToken}`);
  logger.info(` channels: ${slackChannels}`);

  try {
    const slackResult = await runSlackFetch({
      channels: slackChannels,
      outDir: 'output-test',
      token: slackToken,
      days: 7,
      sources: sourcesWithType,
    });

    const enabled = slackResult && Object.keys(slackResult).length > 0;
    return { result: slackResult, enabled };
  } catch (error: any) {
    logger.error('Slack fetch error', { error });
    return { result: null, enabled: false };
  }
}

/**
 * GitHub/Slack 데이터 통합 페칭
 */
export async function fetchIntegrationData(
  integrationsInfo: any[],
  matchedSources: MatchedSources
): Promise<FetchedData> {
  const githubCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'github')?.credential_ref;
  const slackCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'slack')?.credential_ref;

  const enableCreateContents: EnableCreateContents = {
    slack: false,
    github: false,
    discord: false,
  };

  let githubResult = null;
  let slackResult = null;

  // GitHub 데이터 페칭
  if (githubCredentialRef && matchedSources.matchedRepos.length > 0) {
    try {
      const { result, enabled } = await fetchGithubData(githubCredentialRef, matchedSources.matchedRepos);
      githubResult = result;
      enableCreateContents.github = enabled;
    } catch (error) {
      logger.info('CredentialRef가 유효하지 않거나, 매칭된 Repository가 없습니다.');
    }
  } else {
    logger.info('CredentialRef가 유효하지 않거나, 매칭된 Repository가 없습니다.');
  }

  // Slack 데이터 페칭
  if (slackCredentialRef && matchedSources.matchedChannels.length > 0) {
    const { result, enabled } = await fetchSlackData(
      slackCredentialRef,
      matchedSources.matchedChannels,
      matchedSources.sourcesWithType
    );
    slackResult = result;
    enableCreateContents.slack = enabled;
  } else {
    logger.info('CredentialRef가 유효하지 않거나, 매칭된 Channel가 없습니다.');
  }

  if (!githubResult && !slackResult) {
    logger.warn('Failed to fetch GitHub and Slack data - no matched sources', {
      matchedRepos: matchedSources.matchedRepos.length,
      matchedChannels: matchedSources.matchedChannels.length,
      githubCredentialRef: !!githubCredentialRef,
      slackCredentialRef: !!slackCredentialRef
    });
    // エラーをスローせず、nullの結果を返して処理を続行可能にする
    // （実際にはtarget-processing.tsで早期リターンされるため、ここには到達しない）
  }

  return {
    githubResult,
    slackResult,
    enableCreateContents
  };
}

