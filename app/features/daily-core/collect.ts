import type { Database, Json } from "database.types";
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { ChannelData } from "~/core/integrations/slack/types";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CollectedSources } from "~/features/cron/api/collect-sources";
import { fetchSlackThreadParents } from "~/features/cron/api/integration-fetching";
import type { Target } from "~/features/cron/api/types";
import { createDailyCoreData, replaceDailyCoreSourceData, updateDailyCoreData } from "./db/mutations";
import { getDailyCoreData } from "./db/queries";
import {
  keepInWindow,
  missingThreadParents,
  normalizeGithubRepo,
  normalizeSlackMessages,
  resolveDailyWindow,
  type Unreffed,
} from "./normalize";

type Language = Database["public"]["Enums"]["language"];
type CategoryType = Database["public"]["Enums"]["category_type"];

function fetchedItems(
  source: { sourceType: string; sourceIdent: string },
  slackResult: Record<string, ChannelData> | null,
  githubResult: Record<string, FetchedRepoData> | null
): { all: Unreffed[]; channelId?: string } | null {
  if (source.sourceType === "slack_channel") {
    const name = source.sourceIdent.replace(/^#/, "");
    const key = Object.keys(slackResult ?? {}).find((k) => k.split(":")[1] === name);
    if (!key) return null;
    const channelId = key.split(":")[0];
    return { all: normalizeSlackMessages(source.sourceIdent, channelId, slackResult![key].messages), channelId };
  }
  if (source.sourceType === "github_repo") {
    const key = Object.keys(githubResult ?? {}).find(
      (k) => k === source.sourceIdent || k.endsWith(`/${source.sourceIdent}`)
    );
    if (!key) return null;
    return { all: normalizeGithubRepo(source.sourceIdent, githubResult![key]) };
  }
  return null;
}

/**
 * Roots of threads that continue inside the window but started before it.
 * Kept as `meta.context_only` so the agent reads the question but does not count it as that day's activity.
 */
async function contextParents(
  sourceIdent: string,
  channelId: string,
  all: Unreffed[],
  inWindow: Unreffed[],
  integrationsInfo: any[]
): Promise<Unreffed[]> {
  const missing = missingThreadParents(inWindow);
  if (missing.length === 0) return [];

  const alreadyFetched = all.filter((item) => missing.includes(item.source_item_id));
  const toFetch = missing.filter((ts) => !alreadyFetched.some((item) => item.source_item_id === ts));
  const fetched = normalizeSlackMessages(
    sourceIdent,
    channelId,
    await fetchSlackThreadParents(integrationsInfo, channelId, toFetch)
  );
  return [...alreadyFetched, ...fetched].map((item) => ({ ...item, meta: { ...item.meta, context_only: true } }));
}

/**
 * Replaces the collection for `target × coreDate`. Fetch errors are swallowed upstream,
 * so a source that errored looks `empty` here; only missing results are `failed`.
 */
export async function saveDailyCoreCollection(target: Target, collected: CollectedSources, coreDate: string) {
  const timezone = target.timezone ?? "UTC";
  const { windowStartAt, windowEndAt } = resolveDailyWindow(coreDate, timezone);

  const dailyCore =
    (await getDailyCoreData(adminClient, { targetId: target.target_id, coreDate })) ??
    (await createDailyCoreData(adminClient, {
      workspaceId: target.workspace_id,
      targetId: target.target_id,
      coreDate,
      timezone,
      language: target.language as Language,
      targetDisplayName: target.display_name,
      targetCategory: target.category as CategoryType,
      windowStartAt,
      windowEndAt,
    }));

  const sources = collected.matchedSources.sourcesWithType.filter((s: any) => s.isActive);
  const perSource = await Promise.all(
    sources.map(async (source: any) => {
      const fetched = fetchedItems(source, collected.fetchedData.slackResult, collected.fetchedData.githubResult);
      if (!fetched) return { source, fetched, inWindow: [], context: [] };
      const inWindow = keepInWindow(fetched.all, windowStartAt, windowEndAt);
      const context = fetched.channelId
        ? await contextParents(source.sourceIdent, fetched.channelId, fetched.all, inWindow, collected.integrationsInfo)
        : [];
      return { source, fetched, inWindow, context };
    })
  );

  let refNo = 0;
  const rows = perSource.map(({ source, fetched, inWindow, context }) => {
    const base = {
      workspace_id: target.workspace_id,
      target_id: target.target_id,
      target_source_id: source.id,
      integration_id: source.integrationId,
      source_type: source.sourceType,
      source_ident: source.sourceIdent,
    };
    if (!fetched) {
      return { ...base, collection_status: "failed" as const, error_code: "not_fetched" };
    }
    const items = [...context, ...inWindow]
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
      .map((item) => ({ source_ref: `S${String(++refNo).padStart(3, "0")}`, ...item }));
    return {
      ...base,
      collection_status: inWindow.length > 0 ? ("success" as const) : ("empty" as const),
      normalized_json: items as unknown as Json,
      item_count: items.length,
      stats_json: { fetched: fetched.all.length, in_window: inWindow.length, context_items: context.length },
    };
  });

  const saved = await replaceDailyCoreSourceData(adminClient, { dailyCoreId: dailyCore.daily_core_id, rows });
  const anyCollected = rows.some((r) => r.collection_status !== "failed");
  await updateDailyCoreData(adminClient, {
    dailyCoreId: dailyCore.daily_core_id,
    patch: {
      collection_stage: anyCollected ? "collected" : "failed",
      collected_at: new Date().toISOString(),
    },
  });

  return {
    dailyCoreId: dailyCore.daily_core_id,
    sourceDataIds: saved.map((r) => r.source_data_id),
    itemCount: refNo,
  };
}
