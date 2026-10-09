/**
 * 타겟 소스 수집. Flue와 메일 발송은 모른다.
 */

import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import { getIntegrationsInfo, getTargetSources } from "~/features/settings/db/queries";
import { fetchIntegrationData } from "./integration-fetching";
import { matchSourcesToIntegrations } from "./source-matching";
import type { FetchedData, MatchedSources, Target } from "./types";

export type CollectedSources = {
  fetchedData: FetchedData;
  integrationsInfo: any[];
  matchedSources: MatchedSources;
};

export async function collectTargetSources(
  target: Target,
  days = 1
): Promise<CollectedSources | { skip: string }> {
  const integrationsInfo = await getIntegrationsInfo(adminClient, { workspaceId: target.workspace_id });
  const githubData = integrationsInfo?.find((integration: any) => integration.type === "github")?.resource_cache_json as any;
  const slackData = integrationsInfo?.find((integration: any) => integration.type === "slack")?.resource_cache_json as any;
  const sources = await getTargetSources(adminClient, {
    workspaceId: target.workspace_id,
    targetId: target.target_id,
  });

  if (sources.length === 0) {
    return { skip: `No sources found for target: ${target.display_name}` };
  }

  const matchedSources = matchSourcesToIntegrations(sources, integrationsInfo, githubData, slackData);
  if (matchedSources.matchedRepos.length === 0 && matchedSources.matchedChannels.length === 0) {
    logger.warn("No matched sources found for target", {
      targetId: target.target_id,
      sourcesCount: sources.length,
    });
    return { skip: `No matched sources found for target: ${target.display_name}` };
  }

  const fetchedData = await fetchIntegrationData(integrationsInfo, matchedSources, days);
  return { fetchedData, integrationsInfo, matchedSources };
}
