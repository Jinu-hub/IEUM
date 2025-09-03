CREATE TYPE "public"."audit_action" AS ENUM('insert', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."delivery_event_type_email" AS ENUM('delivered', 'opened', 'clicked', 'bounced', 'complained', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('slack', 'github', 'discord', 'lineworks');--> statement-breakpoint
CREATE TYPE "public"."rule_type" AS ENUM('agents', 'tasks');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'success', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."step_name" AS ENUM('collector_slack', 'collector_github', 'summarizer', 'assembler', 'sender_email');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('queued', 'running', 'success', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"table_name" text NOT NULL,
	"record_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" uuid,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "delivery_events_email" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"edition_id" uuid NOT NULL,
	"event_type" "delivery_event_type_email" NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"provider_event_id" text,
	"recipient_email" text,
	"meta_json" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_events_email" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "highlights" (
	"highlight_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"source" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"weight" numeric(6, 2) DEFAULT '0' NOT NULL,
	"meta_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedup_key" text,
	"tags" text[],
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "highlights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "integrations" (
	"integration_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "integration_type" NOT NULL,
	"name" text NOT NULL,
	"credential_ref" text NOT NULL,
	"webhook_url" text,
	"api_key_ref" text,
	"config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mail_list" (
	"mailing_list_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_list" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mail_list_members" (
	"mailing_list_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"meta_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_list_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter_editions" (
	"edition_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid,
	"target_id" uuid NOT NULL,
	"sent_at" timestamp with time zone,
	"subject" text,
	"html_body" text NOT NULL,
	"text_body" text,
	"stats_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider_message_id" text,
	"archive_url" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "newsletter_editions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter_run_steps" (
	"run_step_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"step" "step_name" NOT NULL,
	"status" "step_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"try_count" integer DEFAULT 0 NOT NULL,
	"idempotency_key" text,
	"error_summary" text,
	"log_ref" uuid
);
--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter_runs" (
	"run_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"rule_set_id" uuid,
	"trigger" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"metrics_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"log_ref" uuid,
	"cancel_reason" text,
	"canary_percent" integer,
	"resume_of_run_id" uuid,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "newsletter_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rule_set_activations" (
	"rule_set_act_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"target_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "rule_set_activations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rule_sets" (
	"rule_set_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"agents_version_id" uuid,
	"tasks_version_id" uuid,
	"tag" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "rule_sets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rule_versions" (
	"rule_ver_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" "rule_type" NOT NULL,
	"content_yaml" text NOT NULL,
	"schema_version" text DEFAULT 'v1' NOT NULL,
	"file_hash" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "rule_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "run_logs" (
	"run_log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"storage_url" text NOT NULL,
	"bytes" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "run_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "target_sources" (
	"target_source_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_ident" text NOT NULL,
	"filter_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "target_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "targets" (
	"target_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"mailing_list_id" uuid,
	"schedule_cron" text,
	"timezone" text DEFAULT 'Asia/Tokyo' NOT NULL,
	"default_rule_set_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sent_at" timestamp with time zone,
	"last_run_id" uuid,
	"preview_thumb_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "targets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace" (
	"workspace_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"kind" text DEFAULT 'org' NOT NULL,
	"owner_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_member" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_events_email" ADD CONSTRAINT "delivery_events_email_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_events_email" ADD CONSTRAINT "delivery_events_email_edition_id_newsletter_editions_edition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."newsletter_editions"("edition_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_run_id_newsletter_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."newsletter_runs"("run_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_list" ADD CONSTRAINT "mail_list_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_list_members" ADD CONSTRAINT "mail_list_members_mailing_list_id_mail_list_mailing_list_id_fk" FOREIGN KEY ("mailing_list_id") REFERENCES "public"."mail_list"("mailing_list_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD CONSTRAINT "newsletter_editions_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD CONSTRAINT "newsletter_editions_run_id_newsletter_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."newsletter_runs"("run_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD CONSTRAINT "newsletter_editions_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" ADD CONSTRAINT "newsletter_run_steps_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" ADD CONSTRAINT "newsletter_run_steps_run_id_newsletter_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."newsletter_runs"("run_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" ADD CONSTRAINT "newsletter_run_steps_log_ref_run_logs_run_log_id_fk" FOREIGN KEY ("log_ref") REFERENCES "public"."run_logs"("run_log_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_runs" ADD CONSTRAINT "newsletter_runs_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_runs" ADD CONSTRAINT "newsletter_runs_rule_set_id_rule_sets_rule_set_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."rule_sets"("rule_set_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_runs" ADD CONSTRAINT "newsletter_runs_log_ref_run_logs_run_log_id_fk" FOREIGN KEY ("log_ref") REFERENCES "public"."run_logs"("run_log_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_set_activations" ADD CONSTRAINT "rule_set_activations_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_set_activations" ADD CONSTRAINT "rule_set_activations_rule_set_id_rule_sets_rule_set_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."rule_sets"("rule_set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_set_activations" ADD CONSTRAINT "rule_set_activations_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_set_activations" ADD CONSTRAINT "rule_set_activations_activated_by_users_id_fk" FOREIGN KEY ("activated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_agents_version_id_rule_versions_rule_ver_id_fk" FOREIGN KEY ("agents_version_id") REFERENCES "public"."rule_versions"("rule_ver_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_tasks_version_id_rule_versions_rule_ver_id_fk" FOREIGN KEY ("tasks_version_id") REFERENCES "public"."rule_versions"("rule_ver_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_sets" ADD CONSTRAINT "rule_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_logs" ADD CONSTRAINT "run_logs_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_sources" ADD CONSTRAINT "target_sources_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_sources" ADD CONSTRAINT "target_sources_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_sources" ADD CONSTRAINT "target_sources_integration_id_integrations_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("integration_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_mailing_list_id_mail_list_mailing_list_id_fk" FOREIGN KEY ("mailing_list_id") REFERENCES "public"."mail_list"("mailing_list_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_default_rule_set_id_rule_sets_rule_set_id_fk" FOREIGN KEY ("default_rule_set_id") REFERENCES "public"."rule_sets"("rule_set_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targets" ADD CONSTRAINT "targets_last_run_id_newsletter_runs_run_id_fk" FOREIGN KEY ("last_run_id") REFERENCES "public"."newsletter_runs"("run_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_ws_table_created" ON "audit_logs" USING btree ("workspace_id","table_name","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_record_action" ON "audit_logs" USING btree ("record_id","action");--> statement-breakpoint
CREATE INDEX "idx_audit_user_created" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_deliv_email_ws_edition_at" ON "delivery_events_email" USING btree ("workspace_id","edition_id","event_at");--> statement-breakpoint
CREATE INDEX "idx_deliv_email_recipient" ON "delivery_events_email" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_deliv_email_event_type_at" ON "delivery_events_email" USING btree ("event_type","event_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_deliv_provider_event" ON "delivery_events_email" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_ws_run_source" ON "highlights" USING btree ("workspace_id","run_id","source");--> statement-breakpoint
CREATE INDEX "idx_integrations_ws" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_integrations_type_active" ON "integrations" USING btree ("type","is_active");--> statement-breakpoint
CREATE INDEX "idx_integrations_created_by" ON "integrations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_mail_list_ws" ON "mail_list" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mail_list_members" ON "mail_list_members" USING btree ("mailing_list_id","email");--> statement-breakpoint
CREATE INDEX "idx_mail_list_members_list" ON "mail_list_members" USING btree ("mailing_list_id");--> statement-breakpoint
CREATE INDEX "idx_mail_list_members_email" ON "mail_list_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_editions_ws_target_sent" ON "newsletter_editions" USING btree ("workspace_id","target_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_run_steps_run_step" ON "newsletter_run_steps" USING btree ("run_id","step");--> statement-breakpoint
CREATE INDEX "idx_run_steps_ws_run" ON "newsletter_run_steps" USING btree ("workspace_id","run_id");--> statement-breakpoint
CREATE INDEX "idx_runs_ws_started" ON "newsletter_runs" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_runs_ws_status_started" ON "newsletter_runs" USING btree ("workspace_id","status","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rs_act_scope_once" ON "rule_set_activations" USING btree ("workspace_id","scope","target_id");--> statement-breakpoint
CREATE INDEX "idx_rs_act_ws_active" ON "rule_set_activations" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rule_sets_combo" ON "rule_sets" USING btree ("workspace_id","agents_version_id","tasks_version_id");--> statement-breakpoint
CREATE INDEX "idx_rule_sets_ws_created" ON "rule_sets" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rule_versions_ws_type_hash" ON "rule_versions" USING btree ("workspace_id","type","file_hash");--> statement-breakpoint
CREATE INDEX "idx_rule_versions_ws_type_created" ON "rule_versions" USING btree ("workspace_id","type","created_at");--> statement-breakpoint
CREATE INDEX "idx_rule_versions_created_by" ON "rule_versions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_run_logs_ws_created" ON "run_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_target_sources_ws" ON "target_sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_target_sources_target" ON "target_sources" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "idx_target_sources_integration" ON "target_sources" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "idx_target_sources_type_active" ON "target_sources" USING btree ("source_type","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_target_sources_target_ident" ON "target_sources" USING btree ("target_id","source_ident");--> statement-breakpoint
CREATE INDEX "idx_targets_ws" ON "targets" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_targets_mailing_list" ON "targets" USING btree ("mailing_list_id");--> statement-breakpoint
CREATE INDEX "idx_targets_ws_active" ON "targets" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_targets_last_run" ON "targets" USING btree ("last_run_id");--> statement-breakpoint
CREATE INDEX "idx_targets_ws_active_schedule" ON "targets" USING btree ("workspace_id","is_active","schedule_cron");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workspace_slug" ON "workspace" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_workspace_owner" ON "workspace" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pk_workspace_member" ON "workspace_member" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_wm_user" ON "workspace_member" USING btree ("user_id");--> statement-breakpoint
CREATE POLICY "al_select" ON "audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "audit_logs"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "al_insert" ON "audit_logs" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "al_delete" ON "audit_logs" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "de_select" ON "delivery_events_email" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "delivery_events_email"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "de_insert" ON "delivery_events_email" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "de_delete" ON "delivery_events_email" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "hl_select" ON "highlights" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "highlights"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "hl_insert" ON "highlights" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "hl_update" ON "highlights" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "hl_delete" ON "highlights" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "integ_select" ON "integrations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "integrations"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "integ_insert" ON "integrations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "integrations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "integ_update" ON "integrations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "integrations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "integrations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "integ_delete" ON "integrations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "integrations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ml_select" ON "mail_list" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "mail_list"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "ml_insert" ON "mail_list" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "mail_list"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ml_update" ON "mail_list" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "mail_list"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "mail_list"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ml_delete" ON "mail_list" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "mail_list"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "mlm_select" ON "mail_list_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id =  "mail_list_members"."mailing_list_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "mlm_insert" ON "mail_list_members" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id =  "mail_list_members"."mailing_list_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "mlm_update" ON "mail_list_members" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id =  "mail_list_members"."mailing_list_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id =  "mail_list_members"."mailing_list_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "mlm_delete" ON "mail_list_members" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from mail_list ml join workspace_member m on ml.workspace_id = m.workspace_id where ml.mailing_list_id =  "mail_list_members"."mailing_list_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ne_select" ON "newsletter_editions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "newsletter_editions"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "ne_insert" ON "newsletter_editions" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ne_update" ON "newsletter_editions" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ne_delete" ON "newsletter_editions" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "nrs_select" ON "newsletter_run_steps" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "newsletter_run_steps"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "nrs_insert" ON "newsletter_run_steps" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "nrs_update" ON "newsletter_run_steps" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "nrs_delete" ON "newsletter_run_steps" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "nr_select" ON "newsletter_runs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "newsletter_runs"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "nr_insert" ON "newsletter_runs" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "nr_update" ON "newsletter_runs" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "nr_delete" ON "newsletter_runs" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "rsa_select" ON "rule_set_activations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_set_activations"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "rsa_insert" ON "rule_set_activations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "rule_set_activations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rsa_update" ON "rule_set_activations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_set_activations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "rule_set_activations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rsa_delete" ON "rule_set_activations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_set_activations"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rs_select" ON "rule_sets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_sets"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "rs_insert" ON "rule_sets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "rule_sets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rs_update" ON "rule_sets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_sets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "rule_sets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rs_delete" ON "rule_sets" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_sets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rv_select" ON "rule_versions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_versions"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "rv_insert" ON "rule_versions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "rule_versions"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rv_update" ON "rule_versions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_versions"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "rule_versions"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rv_delete" ON "rule_versions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "rule_versions"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "rl_select" ON "run_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "run_logs"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "rl_insert" ON "run_logs" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "rl_delete" ON "run_logs" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "ts_select" ON "target_sources" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "target_sources"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "ts_insert" ON "target_sources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "target_sources"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ts_update" ON "target_sources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "target_sources"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "target_sources"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ts_delete" ON "target_sources" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "target_sources"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "tgt_select" ON "targets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "targets"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "tgt_insert" ON "targets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "targets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "tgt_update" ON "targets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "targets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "targets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "tgt_delete" ON "targets" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "targets"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ws_select" ON "workspace" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "workspace"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "ws_insert" ON "workspace" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ws_update" ON "workspace" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "workspace"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "workspace"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "ws_delete" ON "workspace" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "workspace"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "wm_select" ON "workspace_member" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "workspace_member"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "wm_insert" ON "workspace_member" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "workspace_member"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "wm_update" ON "workspace_member" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "workspace_member"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "workspace_member"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "wm_delete" ON "workspace_member" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "workspace_member"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));