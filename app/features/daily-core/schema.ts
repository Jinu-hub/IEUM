import { sql } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, serviceRole } from "drizzle-orm/supabase";

import {
  categoryType,
  integrations,
  jobQueue,
  language,
  targetSources,
  targets,
  workspace,
} from "~/features/schema";

const isMember = (wsCol: any) =>
  sql`${sql.raw("exists (select 1 from workspace_member m where m.workspace_id = ")} ${wsCol} ${sql.raw(" and m.user_id = auth.uid())")}`;

export const dailyCoreQualityStatus = pgEnum("daily_core_quality_status", [
  "missing",
  "ready",
  "partial",
  "empty",
]);

export const dailyCoreGenerationStatus = pgEnum("daily_core_generation_status", [
  "queued",
  "processing",
  "succeeded",
  "failed",
]);

export const dailyCoreGenerationTrigger = pgEnum("daily_core_generation_trigger", [
  "scheduled",
  "manual",
  "backfill",
  "regenerate",
]);

export const dailyCoreCollectionStatus = pgEnum("daily_core_collection_status", [
  "success",
  "empty",
  "failed",
]);

export const dailyCoreItemType = pgEnum("daily_core_item_type", [
  "highlight",
  "topic",
  "progress_roadmap",
  "member_activity",
]);

export const dailyCoreMetricOrigin = pgEnum("daily_core_metric_origin", [
  "computed",
  "ai",
]);

export const dailyCoreRollupHint = pgEnum("daily_core_rollup_hint", [
  "sum",
  "avg",
  "max",
  "min",
  "last",
  "none",
]);

export const dailyCoreData = pgTable(
  "daily_core_data",
  {
    dailyCoreId: uuid("daily_core_id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.workspaceId, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.targetId, { onDelete: "cascade" }),
    coreDate: date("core_date").notNull(),
    timezone: text("timezone").notNull(),
    language: language("language").notNull(),
    targetDisplayName: text("target_display_name").notNull(),
    targetCategory: categoryType("target_category").notNull(),
    windowStartAt: timestamp("window_start_at", { withTimezone: true }).notNull(),
    windowEndAt: timestamp("window_end_at", { withTimezone: true }).notNull(),
    qualityStatus: dailyCoreQualityStatus("quality_status").notNull().default("missing"),
    lastGenerationNo: integer("last_generation_no").notNull().default(0),
    currentGenerationNo: integer("current_generation_no"),
    lastJobId: uuid("last_job_id").references(() => jobQueue.id, { onDelete: "set null" }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_daily_core_data_target_date").on(table.targetId, table.coreDate),
    index("idx_daily_core_data_workspace_date").on(table.workspaceId, table.coreDate),
    index("idx_daily_core_data_target_date").on(table.targetId, table.coreDate),
    index("idx_daily_core_data_quality_date").on(table.qualityStatus, table.coreDate),

    pgPolicy("dcd_select", {
      for: "select",
      to: authenticatedRole,
      using: isMember(table.workspaceId),
    }),
    pgPolicy("dcd_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("dcd_update", {
      for: "update",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("dcd_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ]
);

export const dailyCoreGenerations = pgTable(
  "daily_core_generations",
  {
    generationId: uuid("generation_id").defaultRandom().primaryKey(),
    dailyCoreId: uuid("daily_core_id")
      .notNull()
      .references(() => dailyCoreData.dailyCoreId, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.workspaceId, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.targetId, { onDelete: "cascade" }),
    generationNo: integer("generation_no").notNull(),
    jobId: uuid("job_id").references(() => jobQueue.id, { onDelete: "set null" }),
    trigger: dailyCoreGenerationTrigger("trigger").notNull(),
    generationStatus: dailyCoreGenerationStatus("generation_status").notNull().default("queued"),
    qualityStatus: dailyCoreQualityStatus("quality_status"),
    inputHash: text("input_hash"),
    contentHash: text("content_hash"),
    coreJson: jsonb("core_json"),
    schemaVersion: text("schema_version").notNull(),
    taxonomyVersion: text("taxonomy_version").notNull(),
    promptVersion: text("prompt_version").notNull(),
    pipelineVersion: text("pipeline_version").notNull(),
    modelProvider: text("model_provider").notNull(),
    modelName: text("model_name").notNull(),
    modelConfigJson: jsonb("model_config_json").notNull().default(sql`'{}'::jsonb`),
    inputStatsJson: jsonb("input_stats_json").notNull().default(sql`'{}'::jsonb`),
    tokenUsageJson: jsonb("token_usage_json").notNull().default(sql`'{}'::jsonb`),
    processingMetricsJson: jsonb("processing_metrics_json").notNull().default(sql`'{}'::jsonb`),
    validationJson: jsonb("validation_json").notNull().default(sql`'{}'::jsonb`),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_daily_core_generations_no").on(table.dailyCoreId, table.generationNo),
    index("idx_daily_core_generations_daily_core_created").on(table.dailyCoreId, table.createdAt),
    index("idx_daily_core_generations_job").on(table.jobId),
    index("idx_daily_core_generations_input_hash").on(table.inputHash),

    pgPolicy("dcg_select", {
      for: "select",
      to: authenticatedRole,
      using: isMember(table.workspaceId),
    }),
    pgPolicy("dcg_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("dcg_update", {
      for: "update",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("dcg_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ]
);

export const dailyCoreSourceSnapshots = pgTable(
  "daily_core_source_snapshots",
  {
    sourceSnapshotId: uuid("source_snapshot_id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => dailyCoreGenerations.generationId, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.workspaceId, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.targetId, { onDelete: "cascade" }),
    targetSourceId: uuid("target_source_id").references(() => targetSources.targetSourceId, {
      onDelete: "set null",
    }),
    integrationId: uuid("integration_id").references(() => integrations.integrationId, {
      onDelete: "set null",
    }),
    sourceType: text("source_type").notNull(),
    sourceIdent: text("source_ident").notNull(),
    configSnapshotJson: jsonb("config_snapshot_json").notNull().default(sql`'{}'::jsonb`),
    collectionStatus: dailyCoreCollectionStatus("collection_status").notNull(),
    windowStartAt: timestamp("window_start_at", { withTimezone: true }).notNull(),
    windowEndAt: timestamp("window_end_at", { withTimezone: true }).notNull(),
    itemCount: integer("item_count").notNull().default(0),
    rawBytes: bigint("raw_bytes", { mode: "number" }),
    estimatedTokens: integer("estimated_tokens"),
    sourceInputHash: text("source_input_hash"),
    rawSnapshotRef: text("raw_snapshot_ref"),
    statsJson: jsonb("stats_json").notNull().default(sql`'{}'::jsonb`),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("idx_daily_core_source_snapshots_generation").on(table.generationId),
    index("idx_daily_core_source_snapshots_target_source").on(table.targetSourceId),
    index("idx_daily_core_source_snapshots_type_ident").on(table.sourceType, table.sourceIdent),

    pgPolicy("dcss_select", {
      for: "select",
      to: authenticatedRole,
      using: isMember(table.workspaceId),
    }),
    pgPolicy("dcss_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("dcss_update", {
      for: "update",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("dcss_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ]
);

export const dailyCoreItems = pgTable(
  "daily_core_items",
  {
    itemId: uuid("item_id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => dailyCoreGenerations.generationId, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.workspaceId, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.targetId, { onDelete: "cascade" }),
    coreDate: date("core_date").notNull(),
    itemType: dailyCoreItemType("item_type").notNull(),
    itemKey: text("item_key").notNull(),
    title: text("title"),
    summary: text("summary").notNull(),
    status: text("status"),
    importance: integer("importance"),
    confidence: numeric("confidence"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    classificationsJson: jsonb("classifications_json").notNull().default(sql`'{}'::jsonb`),
    entitiesJson: jsonb("entities_json").notNull().default(sql`'{}'::jsonb`),
    evidenceJson: jsonb("evidence_json").notNull().default(sql`'{}'::jsonb`),
    semanticText: text("semantic_text").notNull(),
    payloadJson: jsonb("payload_json").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_daily_core_items_generation_key").on(table.generationId, table.itemType, table.itemKey),
    index("idx_daily_core_items_target_date_type").on(table.targetId, table.coreDate, table.itemType),
    index("idx_daily_core_items_workspace_date").on(table.workspaceId, table.coreDate),
    // GIN index는 SQL migration에서 생성:
    // CREATE INDEX idx_daily_core_items_tags_gin ON daily_core_items USING GIN (tags);
    // CREATE INDEX idx_daily_core_items_classifications_gin ON daily_core_items USING GIN (classifications_json);

    pgPolicy("dci_select", {
      for: "select",
      to: authenticatedRole,
      using: isMember(table.workspaceId),
    }),
    pgPolicy("dci_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("dci_update", {
      for: "update",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("dci_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ]
);

export const dailyCoreMetrics = pgTable(
  "daily_core_metrics",
  {
    metricId: uuid("metric_id").defaultRandom().primaryKey(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => dailyCoreGenerations.generationId, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.workspaceId, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.targetId, { onDelete: "cascade" }),
    coreDate: date("core_date").notNull(),
    metricKey: text("metric_key").notNull(),
    metricValue: numeric("metric_value").notNull(),
    unit: text("unit").notNull(),
    rollupHint: dailyCoreRollupHint("rollup_hint").notNull(),
    origin: dailyCoreMetricOrigin("origin").notNull(),
    dimensionsJson: jsonb("dimensions_json").notNull().default(sql`'{}'::jsonb`),
    dimensionHash: text("dimension_hash").notNull(),
    evidenceJson: jsonb("evidence_json").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_daily_core_metrics_generation_key_dimension").on(
      table.generationId,
      table.metricKey,
      table.dimensionHash
    ),
    index("idx_daily_core_metrics_target_date_key").on(table.targetId, table.coreDate, table.metricKey),
    index("idx_daily_core_metrics_workspace_date").on(table.workspaceId, table.coreDate),

    pgPolicy("dcm_select", {
      for: "select",
      to: authenticatedRole,
      using: isMember(table.workspaceId),
    }),
    pgPolicy("dcm_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("dcm_update", {
      for: "update",
      to: serviceRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("dcm_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ]
);
