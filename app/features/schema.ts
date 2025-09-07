// schema.ts — NexLetter v0.1
// Drizzle ORM for PostgreSQL + inline pgPolicy helpers (Supabase-compatible)
// Assumptions:
// - You have helper utilities: pgPolicy(), authenticatedRole, serviceRole (role names)
// - You use Supabase Auth (auth schema). Adjust as needed if different.
// - All timestamps are timestamptz (UTC). UI converts to local TZ.

import { sql } from "drizzle-orm";
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  bigint,
  uuid,
  pgEnum,
  boolean,
  integer,
  uniqueIndex,
  numeric,
  index,
  unique,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { 
  RUN_STATUS, 
  STEP_NAME, 
  STEP_STATUS, 
  INTEGRATION_TYPE, 
  RULE_TYPE, 
  DELIVERY_EVENT_TYPE_EMAIL, 
  AUDIT_ACTION,
  CONNECTION_STATUS
} from "~/core/lib/constants";
  
  /* =========================================================
     Database Enums
     ========================================================= */
  export const runStatus = pgEnum("run_status", RUN_STATUS);
  export const stepName = pgEnum("step_name", STEP_NAME);
  export const stepStatus = pgEnum("step_status", STEP_STATUS);
  export const integrationType = pgEnum("integration_type", INTEGRATION_TYPE);
  export const ruleType = pgEnum("rule_type", RULE_TYPE);
  export const deliveryEventTypeEmail = pgEnum("delivery_event_type_email", DELIVERY_EVENT_TYPE_EMAIL);
  export const auditAction = pgEnum("audit_action", AUDIT_ACTION);
  export const connectionStatusEnum = pgEnum("connection_status", CONNECTION_STATUS);
  
  
  // RLS 정책은 drizzle-orm의 pgPolicy를 사용하여 자동 생성됩니다
  
  /* =========================================================
     Shared WHERE snippets (workspace membership checks)
     ========================================================= */
  const isMember = (wsCol: any) => sql`${sql.raw("exists (select 1 from workspace_member m where m.workspace_id = ")} ${wsCol} ${sql.raw(" and m.user_id = auth.uid())")}`;
  const isAdmin  = (wsCol: any) => sql`${sql.raw("exists (select 1 from workspace_member m where m.workspace_id = ")} ${wsCol} ${sql.raw(" and m.user_id = auth.uid() and m.role in ('owner','admin'))")}`;
  
  // 최적화된 헬퍼: JOIN을 통한 워크스페이스 접근 (서브쿼리 성능 개선)
  const isMailListMember = (mailingListCol: any) => sql`${sql.raw("exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id = ")} ${mailingListCol} ${sql.raw(" and m.user_id = auth.uid())")}`;
  const isMailListAdmin = (mailingListCol: any) => sql`${sql.raw("exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id = ")} ${mailingListCol} ${sql.raw(" and m.user_id = auth.uid() and m.role in ('owner','admin'))")}`;

  /* =========================================================
     3.1 workspace
     ========================================================= */
  export const workspace = pgTable("workspace", 
    {
      workspaceId: uuid("workspace_id").defaultRandom().primaryKey(),
      name: text("name").notNull(),
      slug: text("slug"),
      kind: text("kind").notNull().default("org"), // 'org' | 'team' | 'personal'
      ownerUserId: uuid("owner_user_id").references(() => authUsers.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
      uniqueIndex("uq_workspace_slug").on(table.slug),
      index("idx_workspace_owner").on(table.ownerUserId),
  
      // RLS (members can read; admin can write)
      pgPolicy("ws_select", {
        for: "select",
        to: authenticatedRole,
        using: isMember(table.workspaceId),
      }),
      pgPolicy("ws_insert", {
        for: "insert",
        to: authenticatedRole,
        // Creation allowed for any authenticated user; tie to owner if personal (adjust in API)
        withCheck: sql`true`,
      }),
      pgPolicy("ws_update", {
        for: "update",
        to: authenticatedRole,
        using: isAdmin(table.workspaceId),
        withCheck: isAdmin(table.workspaceId),
      }),
      pgPolicy("ws_delete", {
        for: "delete",
        to: authenticatedRole,
        using: isAdmin(table.workspaceId),
      }),
    ]
  );
  
  /* =========================================================
     3.2 workspace_member
     ========================================================= */
  export const workspaceMember = pgTable("workspace_member", 
    {
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => authUsers.id),
      role: text("role").notNull().default("member"), // 'owner'|'admin'|'member'
      invitedBy: uuid("invited_by").references(() => authUsers.id),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
      uniqueIndex("pk_workspace_member").on(table.workspaceId, table.userId),
      index("idx_wm_user").on(table.userId),
  
      pgPolicy("wm_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("wm_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("wm_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId),
         withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("wm_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
  );
  
  /* =========================================================
     3.3 integrations
     ========================================================= */
  export const integrations = pgTable("integrations", 
    {
      integrationId: uuid("integration_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      type: integrationType("type").notNull(),
      name: text("name").notNull(),
      credentialRef: text("credential_ref").notNull(),
      webhookUrl: text("webhook_url"),
      apiKeyRef: text("api_key_ref"), // 암호화된 참조값
      configJson: jsonb("config_json").notNull().default(sql`'{}'::jsonb`),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
      createdBy: uuid("created_by").references(() => authUsers.id),
    },
    (table) => [
      index("idx_integrations_ws").on(table.workspaceId),
      index("idx_integrations_type_active").on(table.type, table.isActive),
      index("idx_integrations_created_by").on(table.createdBy),
      // GIN index for JSONB queries - created via SQL migration
      // CREATE INDEX idx_integrations_config_json ON integrations USING GIN (config_json);
      
      // Unique constraint for workspace_id and type combination
      unique("unique_workspace_integration").on(table.workspaceId, table.type),
  
      pgPolicy("integ_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("integ_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("integ_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("integ_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
  );

  /* =========================================================
    3.4.1 integration_statuses
    ========================================================= */
  export const integrationStatuses = pgTable(
    "integration_statuses",
    {
      integrationId: uuid("integration_id").primaryKey().references(() => integrations.integrationId, { onDelete: "cascade" }),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      connectionStatus: connectionStatusEnum("connection_status").notNull().default("never"),
      lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
      lastOkAt: timestamp("last_ok_at", { withTimezone: true }),
      expiresAt: timestamp("expires_at", { withTimezone: true }),
      providerErrorCode: text("provider_error_code"),
      providerErrorMessage: text("provider_error_message"),
      permissionsJson: jsonb("permissions_json").notNull().default(sql`'{}'::jsonb`),
      resourceCacheJson: jsonb("resource_cache_json").notNull().default(sql`'{}'::jsonb`),
    },
    (table) => [
      index("idx_ics_ws").on(table.workspaceId),
      index("idx_ics_status_checked").on(table.connectionStatus, table.lastCheckedAt),
      index("idx_ics_last_ok").on(table.workspaceId, table.connectionStatus, table.lastOkAt),
      // CREATE INDEX idx_ics_permissions_json_gin ON integration_statuses USING GIN (permissions_json);
      // CREATE INDEX idx_ics_resource_cache_json_gin ON integration_statuses USING GIN (resource_cache_json);
      pgPolicy("ics_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("ics_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("ics_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
      pgPolicy("ics_delete", { for: "delete", to: serviceRole, using: sql`true` }),
    ]
  ); 
  
    /* =========================================================
      3.4 mail_list
    ========================================================= */
   export const mailList = pgTable("mail_list", 
     {
       mailingListId: uuid("mailing_list_id").defaultRandom().primaryKey(),
       workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
       name: text("name").notNull(),
             description: text("description"),
      isArchived: boolean("is_archived").notNull().default(false),
      archivedAt: timestamp("archived_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
     },
     (table) => [
       index("idx_mail_list_ws").on(table.workspaceId),
   
       pgPolicy("ml_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
       pgPolicy("ml_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
       pgPolicy("ml_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
       pgPolicy("ml_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
   );

   /* =========================================================
      3.4-1 mail_list_members
      ========================================================= */
   export const mailListMembers = pgTable("mail_list_members", 
     {
       mailingListId: uuid("mailing_list_id").notNull().references(() => mailList.mailingListId, { onDelete: "cascade" }),
       email: text("email").notNull(),
       displayName: text("display_name"),
       metaJson: jsonb("meta_json").notNull().default(sql`'{}'::jsonb`),
       createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
     },
     (table) => [
       uniqueIndex("uq_mail_list_members").on(table.mailingListId, table.email),
       index("idx_mail_list_members_list").on(table.mailingListId),
       index("idx_mail_list_members_email").on(table.email),
   
       pgPolicy("mlm_select", { for: "select", to: authenticatedRole, using: isMailListMember(table.mailingListId) }),
       pgPolicy("mlm_insert", { for: "insert", to: authenticatedRole, withCheck: isMailListAdmin(table.mailingListId) }),
       pgPolicy("mlm_update", { for: "update", to: authenticatedRole, using: isMailListAdmin(table.mailingListId), withCheck: isMailListAdmin(table.mailingListId) }),
       pgPolicy("mlm_delete", { for: "delete", to: authenticatedRole, using: isMailListAdmin(table.mailingListId)        }),
     ]
   );

/* =========================================================
        3.5.1 targets
        ========================================================= */
   export const targets = pgTable("targets", 
     {
       targetId: uuid("target_id").defaultRandom().primaryKey(),
       workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
       displayName: text("display_name").notNull(),
       mailingListId: uuid("mailing_list_id").references(() => mailList.mailingListId, { onDelete: "set null" }),
       scheduleCron: text("schedule_cron"),
       timezone: text("timezone").notNull().default("Asia/Tokyo"),
       defaultRuleSetId: uuid("default_rule_set_id").references(() => ruleSets.ruleSetId, { onDelete: "set null" }),
       isActive: boolean("is_active").notNull().default(true),
       lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
       lastRunId: uuid("last_run_id").references(() => newsletterRuns.runId, { onDelete: "set null" }),
       previewThumbUrl: text("preview_thumb_url"),
       createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
       updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
     },
     (table) => [
       index("idx_targets_ws").on(table.workspaceId),
       index("idx_targets_mailing_list").on(table.mailingListId),
       index("idx_targets_ws_active").on(table.workspaceId, table.isActive),
      index("idx_targets_last_run").on(table.lastRunId),
      index("idx_targets_ws_active_schedule").on(table.workspaceId, table.isActive, table.scheduleCron),
   
       pgPolicy("tgt_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
       pgPolicy("tgt_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
       pgPolicy("tgt_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
       pgPolicy("tgt_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
   );

/* =========================================================
    3.5.2 target_sources
    ========================================================= */
    export const targetSources = pgTable("target_sources", 
    {
        targetSourceId: uuid("target_source_id").defaultRandom().primaryKey(),
        workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
        targetId: uuid("target_id").notNull().references(() => targets.targetId, { onDelete: "cascade" }),
        integrationId: uuid("integration_id").notNull().references(() => integrations.integrationId, { onDelete: "cascade" }),
        sourceType: text("source_type").notNull(), // 'slack_channel' | 'slack_thread' | 'github_repo' | 'github_search'
        sourceIdent: text("source_ident").notNull(), // 예) Slack: 'C0123ABCD' / GitHub: 'owner/repo'
        filterJson: jsonb("filter_json").notNull().default(sql`'{}'::jsonb`),
        priority: integer("priority").notNull().default(0),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        index("idx_target_sources_ws").on(table.workspaceId),
        index("idx_target_sources_target").on(table.targetId),
        index("idx_target_sources_integration").on(table.integrationId),
        index("idx_target_sources_type_active").on(table.sourceType, table.isActive),
        uniqueIndex("uq_target_sources_target_ident").on(table.targetId, table.sourceIdent),
        // GIN index for filter JSON queries - created via SQL migration
        // CREATE INDEX idx_target_sources_filter_json ON target_sources USING GIN (filter_json);
    
        pgPolicy("ts_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
        pgPolicy("ts_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
        pgPolicy("ts_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
        pgPolicy("ts_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
    );
  
  /* =========================================================
     3.6 rule_versions
     ========================================================= */
  export const ruleVersions = pgTable("rule_versions", 
    {
      ruleVerId: uuid("rule_ver_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      type: ruleType("type").notNull(),
      contentYaml: text("content_yaml").notNull(),
      schemaVersion: text("schema_version").notNull().default("v1"),
      fileHash: text("file_hash").notNull(),
      note: text("note"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      createdBy: uuid("created_by").references(() => authUsers.id),
    },
    (table) => [
      uniqueIndex("uq_rule_versions_ws_type_hash").on(table.workspaceId, table.type, table.fileHash),
      index("idx_rule_versions_ws_type_created").on(table.workspaceId, table.type, table.createdAt),
      index("idx_rule_versions_created_by").on(table.createdBy),
  
      pgPolicy("rv_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("rv_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("rv_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("rv_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
  );
  
  /* =========================================================
     3.7 rule_sets
     ========================================================= */
  export const ruleSets = pgTable("rule_sets", 
    {
      ruleSetId: uuid("rule_set_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      agentsVersionId: uuid("agents_version_id").references(() => ruleVersions.ruleVerId, { onDelete: "set null" }),
      tasksVersionId: uuid("tasks_version_id").references(() => ruleVersions.ruleVerId, { onDelete: "set null" }),
      tag: text("tag"),
      note: text("note"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
      createdBy: uuid("created_by").references(() => authUsers.id),
    },
    (table) => [
      uniqueIndex("uq_rule_sets_combo").on(table.workspaceId, table.agentsVersionId, table.tasksVersionId),
      index("idx_rule_sets_ws_created").on(table.workspaceId, table.createdAt),
  
      pgPolicy("rs_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("rs_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("rs_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("rs_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
  );
  
  /* =========================================================
     3.8 rule_set_activations
     ========================================================= */
  export const ruleSetActivations = pgTable(
    "rule_set_activations", 
    {
      ruleSetActId: uuid("rule_set_act_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      ruleSetId: uuid("rule_set_id").notNull().references(() => ruleSets.ruleSetId, { onDelete: "cascade" }),
      scope: text("scope").notNull(), // 'global' | 'target'
      targetId: uuid("target_id").references(() => targets.targetId, { onDelete: "set null" }),
      isActive: boolean("is_active").notNull().default(true),
      activatedAt: timestamp("activated_at", { withTimezone: true }).defaultNow().notNull(),
      activatedBy: uuid("activated_by").references(() => authUsers.id),
    },
    (table) => [
      uniqueIndex("uq_rs_act_scope_once").on(table.workspaceId, table.scope, table.targetId),
      index("idx_rs_act_ws_active").on(table.workspaceId, table.isActive),
  
      pgPolicy("rsa_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("rsa_insert", { for: "insert", to: authenticatedRole, withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("rsa_update", { for: "update", to: authenticatedRole, using: isAdmin(table.workspaceId), withCheck: isAdmin(table.workspaceId) }),
      pgPolicy("rsa_delete", { for: "delete", to: authenticatedRole, using: isAdmin(table.workspaceId)        }),
     ]
  );
  
  /* =========================================================
     3.9 run_logs
     ========================================================= */
  export const runLogs = pgTable(
    "run_logs", 
    {
      runLogId: uuid("run_log_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      storageUrl: text("storage_url").notNull(),
      bytes: bigint("bytes", { mode: "number" }),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
      index("idx_run_logs_ws_created").on(table.workspaceId, table.createdAt),
  
      // Typically written by backend/service role only
      pgPolicy("rl_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("rl_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("rl_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );
  
  /* =========================================================
     3.10 newsletter_runs
     ========================================================= */
  export const newsletterRuns = pgTable(
    "newsletter_runs", 
    {
      runId: uuid("run_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      ruleSetId: uuid("rule_set_id").references(() => ruleSets.ruleSetId, { onDelete: "set null" }),
      trigger: text("trigger").notNull(), // 'cron'|'manual'|'api'|'dry_run'
      startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
      finishedAt: timestamp("finished_at", { withTimezone: true }),
      status: runStatus("status").notNull().default("queued"),
      metricsJson: jsonb("metrics_json").notNull().default(sql`'{}'::jsonb`),
      logRef: uuid("log_ref").references(() => runLogs.runLogId, { onDelete: "set null" }),
      cancelReason: text("cancel_reason"),
      canaryPercent: integer("canary_percent"),
      resumeOfRunId: uuid("resume_of_run_id"),
      isArchived: boolean("is_archived").notNull().default(false),
      archivedAt: timestamp("archived_at", { withTimezone: true })
    },
    (table) => [
      index("idx_runs_ws_started").on(table.workspaceId, table.startedAt),
      index("idx_runs_ws_status_started").on(table.workspaceId, table.status, table.startedAt),
      // GIN index for JSONB queries - created via SQL migration
      // CREATE INDEX idx_newsletter_runs_metrics_gin ON newsletter_runs USING GIN (metrics_json);
  
      pgPolicy("nr_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("nr_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("nr_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
      pgPolicy("nr_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );
  
  /* =========================================================
     3.11 newsletter_run_steps
     ========================================================= */
  export const newsletterRunSteps = pgTable(
    "newsletter_run_steps", 
    {
      runStepId: uuid("run_step_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      runId: uuid("run_id").notNull().references(() => newsletterRuns.runId, { onDelete: "cascade" }),
      step: stepName("step").notNull(),
      status: stepStatus("status").notNull().default("queued"),
      startedAt: timestamp("started_at", { withTimezone: true }),
      finishedAt: timestamp("finished_at", { withTimezone: true }),
      tryCount: integer("try_count").notNull().default(0),
      idempotencyKey: text("idempotency_key"),
      errorSummary: text("error_summary"),
      logRef: uuid("log_ref").references(() => runLogs.runLogId, { onDelete: "set null" }),
    },
    (table) => [
      uniqueIndex("uq_run_steps_run_step").on(table.runId, table.step),
      index("idx_run_steps_ws_run").on(table.workspaceId, table.runId),
  
      pgPolicy("nrs_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("nrs_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("nrs_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
      pgPolicy("nrs_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );
  
  /* =========================================================
     3.12 newsletter_editions
     ========================================================= */
  export const newsletterEditions = pgTable(
    "newsletter_editions", 
    {
      editionId: uuid("edition_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      runId: uuid("run_id").references(() => newsletterRuns.runId, { onDelete: "set null" }),
      targetId: uuid("target_id").notNull().references(() => targets.targetId, { onDelete: "cascade" }),
      sentAt: timestamp("sent_at", { withTimezone: true }),
      subject: text("subject"),
      htmlBody: text("html_body").notNull(),
      textBody: text("text_body"),
      statsJson: jsonb("stats_json").notNull().default(sql`'{}'::jsonb`),
      providerMessageId: text("provider_message_id"),
      archiveUrl: text("archive_url"),
      isArchived: boolean("is_archived").notNull().default(false),
      archivedAt: timestamp("archived_at", { withTimezone: true }),
    },
    (table) => [
      index("idx_editions_ws_target_sent").on(table.workspaceId, table.targetId, table.sentAt),
      // GIN index for JSONB queries - created via SQL migration
      // CREATE INDEX idx_newsletter_editions_stats_gin ON newsletter_editions USING GIN (stats_json);
  
      pgPolicy("ne_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("ne_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("ne_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
      pgPolicy("ne_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );
  
  /* =========================================================
     3.13 highlights
     ========================================================= */
  export const highlights = pgTable(
    "highlights", 
    {
      highlightId: uuid("highlight_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      runId: uuid("run_id").notNull().references(() => newsletterRuns.runId, { onDelete: "cascade" }),
      source: text("source").notNull(), // 'slack'|'github'
      title: text("title").notNull(),
      url: text("url"),
      weight: numeric("weight", { precision: 6, scale: 2 }).notNull().default("0"),
      metaJson: jsonb("meta_json").notNull().default(sql`'{}'::jsonb`),
      dedupKey: text("dedup_key"),
      tags: text("tags").array(),
      isArchived: boolean("is_archived").notNull().default(false),
      archivedAt: timestamp("archived_at", { withTimezone: true }),
    }, 
    (table) => [
      index("idx_highlights_ws_run_source").on(table.workspaceId, table.runId, table.source),
      // GIN index for JSONB queries - created via SQL migration
      // CREATE INDEX idx_highlights_meta_gin ON highlights USING GIN (meta_json);
  
      pgPolicy("hl_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("hl_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("hl_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
      pgPolicy("hl_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );
  
  /* =========================================================
     3.14 delivery_events_email
     ========================================================= */
  export const deliveryEventsEmail = pgTable(
    "delivery_events_email", 
    {
      eventId: uuid("event_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      editionId: uuid("edition_id").notNull().references(() => newsletterEditions.editionId, { onDelete: "cascade" }),
      eventType: deliveryEventTypeEmail("event_type").notNull(),
      eventAt: timestamp("event_at", { withTimezone: true }).notNull(),
      providerEventId: text("provider_event_id"),
      recipientEmail: text("recipient_email"),
      metaJson: jsonb("meta_json").notNull().default(sql`'{}'::jsonb`),
    },
    (table) => [
      index("idx_deliv_email_ws_edition_at").on(table.workspaceId, table.editionId, table.eventAt),
      index("idx_deliv_email_recipient").on(table.recipientEmail),
      index("idx_deliv_email_event_type_at").on(table.eventType, table.eventAt),
      uniqueIndex("uq_deliv_provider_event").on(table.providerEventId),
      // GIN index for JSONB queries - created via SQL migration
      // CREATE INDEX idx_delivery_events_meta_gin ON delivery_events_email USING GIN (meta_json);
  
      pgPolicy("de_select", { for: "select", to: authenticatedRole, using: isMember(table.workspaceId) }),
      pgPolicy("de_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("de_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );

  /* =========================================================
     3.15 audit_logs (감사 로그)
     ========================================================= */
  export const auditLogs = pgTable(
    "audit_logs", 
    {
      logId: uuid("log_id").defaultRandom().primaryKey(),
      workspaceId: uuid("workspace_id").notNull().references(() => workspace.workspaceId, { onDelete: "cascade" }),
      tableName: text("table_name").notNull(),
      recordId: uuid("record_id").notNull(),
      action: auditAction("action").notNull(),
      oldValues: jsonb("old_values"),
      newValues: jsonb("new_values"),
      userId: uuid("user_id").references(() => authUsers.id),
      userAgent: text("user_agent"),
      ipAddress: text("ip_address"),
      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
      index("idx_audit_ws_table_created").on(table.workspaceId, table.tableName, table.createdAt),
      index("idx_audit_record_action").on(table.recordId, table.action),
      index("idx_audit_user_created").on(table.userId, table.createdAt),
      // GIN index for JSONB queries - created via SQL migration
      // CREATE INDEX idx_audit_logs_old_values_gin ON audit_logs USING GIN (old_values);
      // CREATE INDEX idx_audit_logs_new_values_gin ON audit_logs USING GIN (new_values);

      pgPolicy("al_select", { for: "select", to: authenticatedRole, using: isAdmin(table.workspaceId) }),
      pgPolicy("al_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
      pgPolicy("al_delete", { for: "delete", to: serviceRole, using: sql`true`        }),
     ]
  );

  /* =========================================================
     Notes & Migration Guide
     ========================================================= */
  
  /*
   * 1. RLS 활성화 (Drizzle 외부에서 실행):
   *    ALTER TABLE workspace ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE workspace_member ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE mail_list ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE mail_list_members ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE target_sources ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE rule_versions ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE rule_sets ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE rule_set_activations ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE newsletter_runs ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE newsletter_run_steps ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE newsletter_editions ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE delivery_events_email ENABLE ROW LEVEL SECURITY;
   *    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
   *
   * 2. JSONB GIN 인덱스 생성:
   *    CREATE INDEX idx_integrations_config_gin ON integrations USING GIN (config_json);
   *    CREATE INDEX idx_target_sources_filter_gin ON target_sources USING GIN (filter_json);
   *    CREATE INDEX idx_newsletter_runs_metrics_gin ON newsletter_runs USING GIN (metrics_json);
   *    CREATE INDEX idx_newsletter_editions_stats_gin ON newsletter_editions USING GIN (stats_json);
   *    CREATE INDEX idx_highlights_meta_gin ON highlights USING GIN (meta_json);
   *    CREATE INDEX idx_delivery_events_meta_gin ON delivery_events_email USING GIN (meta_json);
   *    CREATE INDEX idx_audit_logs_old_values_gin ON audit_logs USING GIN (old_values);
   *    CREATE INDEX idx_audit_logs_new_values_gin ON audit_logs USING GIN (new_values);
   *
   * 3. 전문검색 (Full-text search) 설정:
   *    ALTER TABLE highlights ADD COLUMN title_fts tsvector;
   *    CREATE INDEX idx_highlights_title_fts ON highlights USING GIN (title_fts);
   *    CREATE TRIGGER trg_highlights_title_fts BEFORE INSERT OR UPDATE ON highlights
   *      FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger('title_fts', 'pg_catalog.simple', 'title');
   *
   * 4. 파티셔닝 (대용량 데이터 처리):
   *    -- delivery_events_email 월별 파티셔닝 예시
   *    ALTER TABLE delivery_events_email PARTITION BY RANGE (event_at);
   *    CREATE TABLE delivery_events_email_y2024m01 
   *      PARTITION OF delivery_events_email 
   *      FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
   *
   * 5. 아카이빙 자동화:
   *    -- 6개월 이상 된 데이터 자동 아카이빙
   *    CREATE OR REPLACE FUNCTION auto_archive_old_data()
   *    RETURNS void AS $$
   *    BEGIN
   *      UPDATE newsletter_runs 
   *      SET is_archived = true, archived_at = now()
   *      WHERE started_at < now() - interval '6 months' 
   *        AND is_archived = false;
   *      
   *      UPDATE highlights 
   *      SET is_archived = true, archived_at = now()
   *      WHERE run_id IN (
   *        SELECT run_id FROM newsletter_runs 
   *        WHERE is_archived = true
   *      ) AND is_archived = false;
   *    END;
   *    $$ LANGUAGE plpgsql;
   *
   * 6. 성능 모니터링:
   *    -- 느린 쿼리 모니터링
   *    SELECT query, calls, total_time, mean_time
   *    FROM pg_stat_statements
   *    WHERE query LIKE '%workspace%'
   *    ORDER BY mean_time DESC;
   *
   * 7. 백업 및 복구 전략:
   *    -- 중요 테이블별 백업 주기 설정
   *    -- workspace, integrations: 일일 백업
   *    -- newsletter_runs, highlights: 주간 백업
   *    -- delivery_events_email: 월간 백업 (파티션별)
   */
