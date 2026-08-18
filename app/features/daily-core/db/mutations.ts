import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "database.types";

type Json = Database["public"]["Tables"]["daily_core_generations"]["Row"]["core_json"];
type DailyCoreDataInsert = TablesInsert<"daily_core_data">;
type DailyCoreDataUpdate = TablesUpdate<"daily_core_data">;
type DailyCoreGenerationInsert = TablesInsert<"daily_core_generations">;
type DailyCoreGenerationUpdate = TablesUpdate<"daily_core_generations">;
type DailyCoreSourceSnapshotInsert = TablesInsert<"daily_core_source_snapshots">;
type DailyCoreItemInsert = TablesInsert<"daily_core_items">;
type DailyCoreMetricInsert = TablesInsert<"daily_core_metrics">;
type Language = Database["public"]["Enums"]["language"];
type CategoryType = Database["public"]["Enums"]["category_type"];
type DailyCoreQualityStatus = Database["public"]["Enums"]["daily_core_quality_status"];
type DailyCoreGenerationTrigger = Database["public"]["Enums"]["daily_core_generation_trigger"];
type DailyCoreGenerationStatus = Database["public"]["Enums"]["daily_core_generation_status"];
type DailyCoreCollectionStatus = Database["public"]["Enums"]["daily_core_collection_status"];

export async function createDailyCoreData(
  client: SupabaseClient<Database>,
  {
    workspaceId,
    targetId,
    coreDate,
    timezone,
    language,
    targetDisplayName,
    targetCategory,
    windowStartAt,
    windowEndAt,
    qualityStatus = "missing",
  }: {
    workspaceId: string;
    targetId: string;
    coreDate: string;
    timezone: string;
    language: Language;
    targetDisplayName: string;
    targetCategory: CategoryType;
    windowStartAt: string;
    windowEndAt: string;
    qualityStatus?: DailyCoreQualityStatus;
  }
) {
  const payload: DailyCoreDataInsert = {
    workspace_id: workspaceId,
    target_id: targetId,
    core_date: coreDate,
    timezone,
    language,
    target_display_name: targetDisplayName,
    target_category: targetCategory,
    window_start_at: windowStartAt,
    window_end_at: windowEndAt,
    quality_status: qualityStatus,
    last_generation_no: 0,
  };

  const { data, error } = await client
    .from("daily_core_data")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createDailyCoreData error", error);
    throw error;
  }

  return data;
}

export async function updateDailyCoreData(
  client: SupabaseClient<Database>,
  {
    dailyCoreId,
    patch,
  }: {
    dailyCoreId: string;
    patch: DailyCoreDataUpdate;
  }
) {
  const payload: DailyCoreDataUpdate = {
    ...patch,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  };

  const { data, error } = await client
    .from("daily_core_data")
    .update(payload)
    .eq("daily_core_id", dailyCoreId)
    .select()
    .single();

  if (error) {
    console.error("updateDailyCoreData error", error);
    throw error;
  }

  return data;
}

export async function touchDailyCoreAttempt(
  client: SupabaseClient<Database>,
  {
    dailyCoreId,
    lastGenerationNo,
    lastJobId,
    qualityStatus,
  }: {
    dailyCoreId: string;
    lastGenerationNo: number;
    lastJobId?: string | null;
    qualityStatus?: DailyCoreQualityStatus;
  }
) {
  return updateDailyCoreData(client, {
    dailyCoreId,
    patch: {
      last_generation_no: lastGenerationNo,
      last_job_id: lastJobId ?? null,
      last_attempt_at: new Date().toISOString(),
      ...(qualityStatus ? { quality_status: qualityStatus } : {}),
    },
  });
}

export async function markDailyCoreGenerationSucceeded(
  client: SupabaseClient<Database>,
  {
    dailyCoreId,
    generationNo,
    qualityStatus,
  }: {
    dailyCoreId: string;
    generationNo: number;
    qualityStatus: DailyCoreQualityStatus;
  }
) {
  const now = new Date().toISOString();

  return updateDailyCoreData(client, {
    dailyCoreId,
    patch: {
      current_generation_no: generationNo,
      last_generation_no: generationNo,
      quality_status: qualityStatus,
      last_generated_at: now,
      last_error_code: null,
      last_error_message: null,
      updated_at: now,
    },
  });
}

export async function markDailyCoreGenerationFailed(
  client: SupabaseClient<Database>,
  {
    dailyCoreId,
    lastGenerationNo,
    errorCode,
    errorMessage,
  }: {
    dailyCoreId: string;
    lastGenerationNo: number;
    errorCode?: string | null;
    errorMessage?: string | null;
  }
) {
  return updateDailyCoreData(client, {
    dailyCoreId,
    patch: {
      last_generation_no: lastGenerationNo,
      last_error_code: errorCode ?? null,
      last_error_message: errorMessage ?? null,
    },
  });
}

export async function createDailyCoreGeneration(
  client: SupabaseClient<Database>,
  {
    dailyCoreId,
    workspaceId,
    targetId,
    generationNo,
    jobId,
    trigger,
    schemaVersion,
    taxonomyVersion,
    promptVersion,
    pipelineVersion,
    modelProvider,
    modelName,
    modelConfigJson = {},
    inputStatsJson = {},
    tokenUsageJson = {},
    processingMetricsJson = {},
    validationJson = {},
    startedAt,
    generationStatus = "queued",
    qualityStatus = null,
    inputHash = null,
    contentHash = null,
    coreJson = null,
  }: {
    dailyCoreId: string;
    workspaceId: string;
    targetId: string;
    generationNo: number;
    jobId?: string | null;
    trigger: DailyCoreGenerationTrigger;
    schemaVersion: string;
    taxonomyVersion: string;
    promptVersion: string;
    pipelineVersion: string;
    modelProvider: string;
    modelName: string;
    modelConfigJson?: Json;
    inputStatsJson?: Json;
    tokenUsageJson?: Json;
    processingMetricsJson?: Json;
    validationJson?: Json;
    startedAt?: string;
    generationStatus?: DailyCoreGenerationStatus;
    qualityStatus?: DailyCoreQualityStatus | null;
    inputHash?: string | null;
    contentHash?: string | null;
    coreJson?: Json | null;
  }
) {
  const payload: DailyCoreGenerationInsert = {
    daily_core_id: dailyCoreId,
    workspace_id: workspaceId,
    target_id: targetId,
    generation_no: generationNo,
    job_id: jobId ?? null,
    trigger,
    generation_status: generationStatus,
    quality_status: qualityStatus,
    input_hash: inputHash,
    content_hash: contentHash,
    core_json: coreJson,
    schema_version: schemaVersion,
    taxonomy_version: taxonomyVersion,
    prompt_version: promptVersion,
    pipeline_version: pipelineVersion,
    model_provider: modelProvider,
    model_name: modelName,
    model_config_json: modelConfigJson ?? {},
    input_stats_json: inputStatsJson ?? {},
    token_usage_json: tokenUsageJson ?? {},
    processing_metrics_json: processingMetricsJson ?? {},
    validation_json: validationJson ?? {},
    started_at: startedAt ?? new Date().toISOString(),
  };

  const { data, error } = await client
    .from("daily_core_generations")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createDailyCoreGeneration error", error);
    throw error;
  }

  return data;
}

export async function updateDailyCoreGeneration(
  client: SupabaseClient<Database>,
  {
    generationId,
    patch,
  }: {
    generationId: string;
    patch: DailyCoreGenerationUpdate;
  }
) {
  const { data, error } = await client
    .from("daily_core_generations")
    .update(patch)
    .eq("generation_id", generationId)
    .select()
    .single();

  if (error) {
    console.error("updateDailyCoreGeneration error", error);
    throw error;
  }

  return data;
}

export async function completeDailyCoreGeneration(
  client: SupabaseClient<Database>,
  {
    generationId,
    generationStatus,
    qualityStatus,
    contentHash,
    coreJson,
    tokenUsageJson,
    processingMetricsJson,
    validationJson,
  }: {
    generationId: string;
    generationStatus: "succeeded" | "failed";
    qualityStatus?: DailyCoreQualityStatus | null;
    contentHash?: string | null;
    coreJson?: Json | null;
    tokenUsageJson?: Json;
    processingMetricsJson?: Json;
    validationJson?: Json;
  }
) {
  return updateDailyCoreGeneration(client, {
    generationId,
    patch: {
      generation_status: generationStatus,
      quality_status: qualityStatus ?? null,
      content_hash: contentHash ?? null,
      core_json: coreJson ?? null,
      token_usage_json: tokenUsageJson,
      processing_metrics_json: processingMetricsJson,
      validation_json: validationJson,
      finished_at: new Date().toISOString(),
      error_code: generationStatus === "succeeded" ? null : undefined,
      error_message: generationStatus === "succeeded" ? null : undefined,
    },
  });
}

export async function failDailyCoreGeneration(
  client: SupabaseClient<Database>,
  {
    generationId,
    errorCode,
    errorMessage,
    processingMetricsJson,
    validationJson,
  }: {
    generationId: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    processingMetricsJson?: Json;
    validationJson?: Json;
  }
) {
  return updateDailyCoreGeneration(client, {
    generationId,
    patch: {
      generation_status: "failed",
      error_code: errorCode ?? null,
      error_message: errorMessage ?? null,
      processing_metrics_json: processingMetricsJson,
      validation_json: validationJson,
      finished_at: new Date().toISOString(),
    },
  });
}

export async function replaceDailyCoreSourceSnapshots(
  client: SupabaseClient<Database>,
  {
    generationId,
    rows,
  }: {
    generationId: string;
    rows: Array<{
      workspace_id: string;
      target_id: string;
      target_source_id?: string | null;
      integration_id?: string | null;
      source_type: string;
      source_ident: string;
      config_snapshot_json?: Json;
      collection_status: DailyCoreCollectionStatus;
      window_start_at: string;
      window_end_at: string;
      item_count?: number;
      raw_bytes?: number | null;
      estimated_tokens?: number | null;
      source_input_hash?: string | null;
      raw_snapshot_ref?: string | null;
      stats_json?: Json;
      error_code?: string | null;
      error_message?: string | null;
      collected_at?: string;
    }>;
  }
) {
  await client.from("daily_core_source_snapshots").delete().eq("generation_id", generationId);

  if (rows.length === 0) {
    return [];
  }

  const payload: DailyCoreSourceSnapshotInsert[] = rows.map((row) => ({
    generation_id: generationId,
    workspace_id: row.workspace_id,
    target_id: row.target_id,
    target_source_id: row.target_source_id ?? null,
    integration_id: row.integration_id ?? null,
    source_type: row.source_type,
    source_ident: row.source_ident,
    config_snapshot_json: row.config_snapshot_json ?? {},
    collection_status: row.collection_status,
    window_start_at: row.window_start_at,
    window_end_at: row.window_end_at,
    item_count: row.item_count ?? 0,
    raw_bytes: row.raw_bytes ?? null,
    estimated_tokens: row.estimated_tokens ?? null,
    source_input_hash: row.source_input_hash ?? null,
    raw_snapshot_ref: row.raw_snapshot_ref ?? null,
    stats_json: row.stats_json ?? {},
    error_code: row.error_code ?? null,
    error_message: row.error_message ?? null,
    collected_at: row.collected_at ?? new Date().toISOString(),
  }));

  const { data, error } = await client
    .from("daily_core_source_snapshots")
    .insert(payload)
    .select();

  if (error) {
    console.error("replaceDailyCoreSourceSnapshots error", error);
    throw error;
  }

  return data ?? [];
}

export async function replaceDailyCoreItems(
  client: SupabaseClient<Database>,
  {
    generationId,
    rows,
  }: {
    generationId: string;
    rows: Array<{
      workspace_id: string;
      target_id: string;
      core_date: string;
      item_type: string;
      item_key: string;
      title?: string | null;
      summary: string;
      status?: string | null;
      importance?: number | null;
      confidence?: number | string | null;
      tags?: string[];
      classifications_json?: Json;
      entities_json?: Json;
      evidence_json?: Json;
      semantic_text: string;
      payload_json?: Json;
    }>;
  }
) {
  await client.from("daily_core_items").delete().eq("generation_id", generationId);

  if (rows.length === 0) {
    return [];
  }

  const payload: DailyCoreItemInsert[] = rows.map((row) => ({
    generation_id: generationId,
    workspace_id: row.workspace_id,
    target_id: row.target_id,
    core_date: row.core_date,
    item_type: row.item_type as DailyCoreItemInsert["item_type"],
    item_key: row.item_key,
    title: row.title ?? null,
    summary: row.summary,
    status: row.status ?? null,
    importance: row.importance ?? null,
    confidence: row.confidence == null ? null : Number(row.confidence),
    tags: row.tags ?? [],
    classifications_json: row.classifications_json ?? {},
    entities_json: row.entities_json ?? {},
    evidence_json: row.evidence_json ?? {},
    semantic_text: row.semantic_text,
    payload_json: row.payload_json ?? {},
  }));

  const { data, error } = await client
    .from("daily_core_items")
    .insert(payload)
    .select();

  if (error) {
    console.error("replaceDailyCoreItems error", error);
    throw error;
  }

  return data ?? [];
}

export async function replaceDailyCoreMetrics(
  client: SupabaseClient<Database>,
  {
    generationId,
    rows,
  }: {
    generationId: string;
    rows: Array<{
      workspace_id: string;
      target_id: string;
      core_date: string;
      metric_key: string;
      metric_value: string | number;
      unit: string;
      rollup_hint: string;
      origin: string;
      dimensions_json?: Json;
      dimension_hash: string;
      evidence_json?: Json;
    }>;
  }
) {
  await client.from("daily_core_metrics").delete().eq("generation_id", generationId);

  if (rows.length === 0) {
    return [];
  }

  const payload: DailyCoreMetricInsert[] = rows.map((row) => ({
    generation_id: generationId,
    workspace_id: row.workspace_id,
    target_id: row.target_id,
    core_date: row.core_date,
    metric_key: row.metric_key,
    metric_value: typeof row.metric_value === "number" ? row.metric_value : Number(row.metric_value),
    unit: row.unit,
    rollup_hint: row.rollup_hint as DailyCoreMetricInsert["rollup_hint"],
    origin: row.origin as DailyCoreMetricInsert["origin"],
    dimensions_json: row.dimensions_json ?? {},
    dimension_hash: row.dimension_hash,
    evidence_json: row.evidence_json ?? {},
  }));

  const { data, error } = await client
    .from("daily_core_metrics")
    .insert(payload)
    .select();

  if (error) {
    console.error("replaceDailyCoreMetrics error", error);
    throw error;
  }

  return data ?? [];
}
