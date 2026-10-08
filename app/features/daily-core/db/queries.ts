import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "database.types";

export type DailyCoreDataRow = Tables<"daily_core_data">;
export type DailyCoreGenerationRow = Tables<"daily_core_generations">;
export type DailyCoreSourceDataRow = Tables<"daily_core_source_data">;
export type DailyCoreItemRow = Tables<"daily_core_items">;
export type DailyCoreMetricRow = Tables<"daily_core_metrics">;
type DailyCoreQualityStatus = Database["public"]["Enums"]["daily_core_quality_status"];
type DailyCoreItemType = Database["public"]["Enums"]["daily_core_item_type"];

export async function getDailyCoreData(
  client: SupabaseClient<Database>,
  { targetId, coreDate }: { targetId: string; coreDate: string }
): Promise<DailyCoreDataRow | null> {
  const { data, error } = await client
    .from("daily_core_data")
    .select("*")
    .eq("target_id", targetId)
    .eq("core_date", coreDate)
    .maybeSingle();

  if (error) {
    console.log("getDailyCoreData error", error);
    throw error;
  }

  return data;
}

export async function listDailyCoreData(
  client: SupabaseClient<Database>,
  {
    workspaceId,
    startDate,
    endDate,
    targetId,
    qualityStatus,
    limit = 100,
  }: {
    workspaceId: string;
    startDate?: string;
    endDate?: string;
    targetId?: string;
    qualityStatus?: DailyCoreQualityStatus;
    limit?: number;
  }
): Promise<DailyCoreDataRow[]> {
  let query = client
    .from("daily_core_data")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("core_date", { ascending: false })
    .limit(limit);

  if (startDate) query = query.gte("core_date", startDate);
  if (endDate) query = query.lte("core_date", endDate);
  if (targetId) query = query.eq("target_id", targetId);
  if (qualityStatus) query = query.eq("quality_status", qualityStatus);

  const { data, error } = await query;
  if (error) {
    console.log("listDailyCoreData error", error);
    throw error;
  }

  return data ?? [];
}

export async function listDailyCoreGenerations(
  client: SupabaseClient<Database>,
  { dailyCoreId }: { dailyCoreId: string }
): Promise<DailyCoreGenerationRow[]> {
  const { data, error } = await client
    .from("daily_core_generations")
    .select("*")
    .eq("daily_core_id", dailyCoreId)
    .order("generation_no", { ascending: false });

  if (error) {
    console.log("listDailyCoreGenerations error", error);
    throw error;
  }

  return data ?? [];
}

export async function getDailyCoreGeneration(
  client: SupabaseClient<Database>,
  { generationId }: { generationId: string }
): Promise<DailyCoreGenerationRow | null> {
  const { data, error } = await client
    .from("daily_core_generations")
    .select("*")
    .eq("generation_id", generationId)
    .maybeSingle();

  if (error) {
    console.log("getDailyCoreGeneration error", error);
    throw error;
  }

  return data;
}

export async function getCurrentDailyCoreGeneration(
  client: SupabaseClient<Database>,
  { dailyCoreId }: { dailyCoreId: string }
): Promise<DailyCoreGenerationRow | null> {
  const dailyCore = await getDailyCoreDataById(client, { dailyCoreId });

  if (!dailyCore?.current_generation_no) {
    return null;
  }

  const { data, error } = await client
    .from("daily_core_generations")
    .select("*")
    .eq("daily_core_id", dailyCoreId)
    .eq("generation_no", dailyCore.current_generation_no)
    .maybeSingle();

  if (error) {
    console.log("getCurrentDailyCoreGeneration error", error);
    throw error;
  }

  return data;
}

export async function getDailyCoreDataById(
  client: SupabaseClient<Database>,
  { dailyCoreId }: { dailyCoreId: string }
): Promise<DailyCoreDataRow | null> {
  const { data, error } = await client
    .from("daily_core_data")
    .select("*")
    .eq("daily_core_id", dailyCoreId)
    .maybeSingle();

  if (error) {
    console.log("getDailyCoreDataById error", error);
    throw error;
  }

  return data;
}

export async function listDailyCoreSourceData(
  client: SupabaseClient<Database>,
  { dailyCoreId, sourceDataIds }: { dailyCoreId: string; sourceDataIds?: string[] }
): Promise<DailyCoreSourceDataRow[]> {
  let query = client
    .from("daily_core_source_data")
    .select("*")
    .eq("daily_core_id", dailyCoreId)
    .order("collected_at", { ascending: true });

  if (sourceDataIds) query = query.in("source_data_id", sourceDataIds);

  const { data, error } = await query;
  if (error) {
    console.log("listDailyCoreSourceData error", error);
    throw error;
  }

  return data ?? [];
}

export async function listDailyCoreItems(
  client: SupabaseClient<Database>,
  {
    workspaceId,
    targetId,
    generationId,
    itemType,
    coreDateFrom,
    coreDateTo,
    limit = 200,
  }: {
    workspaceId: string;
    targetId?: string;
    generationId?: string;
    itemType?: DailyCoreItemType;
    coreDateFrom?: string;
    coreDateTo?: string;
    limit?: number;
  }
): Promise<DailyCoreItemRow[]> {
  let query = client
    .from("daily_core_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("core_date", { ascending: false })
    .limit(limit);

  if (targetId) query = query.eq("target_id", targetId);
  if (generationId) query = query.eq("generation_id", generationId);
  if (itemType) query = query.eq("item_type", itemType);
  if (coreDateFrom) query = query.gte("core_date", coreDateFrom);
  if (coreDateTo) query = query.lte("core_date", coreDateTo);

  const { data, error } = await query;
  if (error) {
    console.log("listDailyCoreItems error", error);
    throw error;
  }

  return data ?? [];
}

export async function listDailyCoreItemsByTag(
  client: SupabaseClient<Database>,
  {
    workspaceId,
    tag,
    limit = 100,
  }: {
    workspaceId: string;
    tag: string;
    limit?: number;
  }
): Promise<DailyCoreItemRow[]> {
  const { data, error } = await client
    .from("daily_core_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .contains("tags", [tag])
    .order("core_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.log("listDailyCoreItemsByTag error", error);
    throw error;
  }

  return data ?? [];
}

export async function listDailyCoreMetrics(
  client: SupabaseClient<Database>,
  {
    workspaceId,
    targetId,
    generationId,
    metricKey,
    coreDateFrom,
    coreDateTo,
    limit = 200,
  }: {
    workspaceId: string;
    targetId?: string;
    generationId?: string;
    metricKey?: string;
    coreDateFrom?: string;
    coreDateTo?: string;
    limit?: number;
  }
): Promise<DailyCoreMetricRow[]> {
  let query = client
    .from("daily_core_metrics")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("core_date", { ascending: false })
    .limit(limit);

  if (targetId) query = query.eq("target_id", targetId);
  if (generationId) query = query.eq("generation_id", generationId);
  if (metricKey) query = query.eq("metric_key", metricKey);
  if (coreDateFrom) query = query.gte("core_date", coreDateFrom);
  if (coreDateTo) query = query.lte("core_date", coreDateTo);

  const { data, error } = await query;
  if (error) {
    console.log("listDailyCoreMetrics error", error);
    throw error;
  }

  return data ?? [];
}

export async function getDailyCoreBundle(
  client: SupabaseClient<Database>,
  { targetId, coreDate }: { targetId: string; coreDate: string }
) {
  const dailyCore = await getDailyCoreData(client, { targetId, coreDate });
  if (!dailyCore) {
    return null;
  }

  const generation = await getCurrentDailyCoreGeneration(client, {
    dailyCoreId: dailyCore.daily_core_id,
  });

  if (!generation) {
    return {
      dailyCore,
      generation: null,
      sourceData: [],
      items: [],
      metrics: [],
    };
  }

  const [sourceData, items, metrics] = await Promise.all([
    listDailyCoreSourceData(client, {
      dailyCoreId: dailyCore.daily_core_id,
      sourceDataIds: generation.input_source_data_ids,
    }),
    listDailyCoreItems(client, {
      workspaceId: dailyCore.workspace_id,
      generationId: generation.generation_id,
    }),
    listDailyCoreMetrics(client, {
      workspaceId: dailyCore.workspace_id,
      generationId: generation.generation_id,
    }),
  ]);

  return {
    dailyCore,
    generation,
    sourceData,
    items,
    metrics,
  };
}
