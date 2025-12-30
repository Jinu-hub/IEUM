/**
 * 소스 매칭 함수
 */

import type { MatchedSources } from "./types";

/**
 * 소스 타입에 따라 GitHub/Slack 소스 매칭
 */
export function matchSourcesToIntegrations(
  sources: any[],
  integrationsInfo: any[],
  githubData: any,
  slackData: any
): MatchedSources {
  const matchedRepos: string[] = [];
  const matchedChannels: string[] = [];
  const sourcesWithType = sources.map((s: any) => ({
    ...s,
    integrationType: integrationsInfo.find((i: any) => i.integration_id === s.integrationId)?.type || ''
  }));

  for (const source of sources) {
    if (source.sourceType === 'slack_channel') {
      const cleanSourceIdent = source.sourceIdent?.startsWith('#') 
        ? source.sourceIdent.substring(1) 
        : source.sourceIdent;
      const matchedChannel = slackData?.channels?.find((channel: any) => channel.name === cleanSourceIdent);
      if (matchedChannel && matchedChannel.id) {
        matchedChannels.push(matchedChannel.id);
      }
    } else if (source.sourceType === 'github_repo') {
      const matchedRepo = githubData?.repos?.find((repo: any) => repo.full_name === source.sourceIdent || repo.name === source.sourceIdent);
      if (matchedRepo && matchedRepo.full_name) {
        matchedRepos.push(matchedRepo.full_name);
      }
    }
  }

  return {
    matchedRepos,
    matchedChannels,
    sourcesWithType
  };
}

