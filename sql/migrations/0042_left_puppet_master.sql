CREATE TYPE "public"."daily_core_collection_status" AS ENUM('success', 'empty', 'failed');--> statement-breakpoint
CREATE TYPE "public"."daily_core_generation_status" AS ENUM('queued', 'processing', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."daily_core_generation_trigger" AS ENUM('scheduled', 'manual', 'backfill', 'regenerate');--> statement-breakpoint
CREATE TYPE "public"."daily_core_item_type" AS ENUM('highlight', 'topic', 'progress_roadmap', 'member_activity');--> statement-breakpoint
CREATE TYPE "public"."daily_core_metric_origin" AS ENUM('computed', 'ai');--> statement-breakpoint
CREATE TYPE "public"."daily_core_quality_status" AS ENUM('missing', 'ready', 'partial', 'empty');--> statement-breakpoint
CREATE TYPE "public"."daily_core_rollup_hint" AS ENUM('sum', 'avg', 'max', 'min', 'last', 'none');--> statement-breakpoint
CREATE TABLE "daily_core_data" (
	"daily_core_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"core_date" date NOT NULL,
	"timezone" text NOT NULL,
	"language" "language" NOT NULL,
	"target_display_name" text NOT NULL,
	"target_category" "category_type" NOT NULL,
	"window_start_at" timestamp with time zone NOT NULL,
	"window_end_at" timestamp with time zone NOT NULL,
	"quality_status" "daily_core_quality_status" DEFAULT 'missing' NOT NULL,
	"last_generation_no" integer DEFAULT 0 NOT NULL,
	"current_generation_no" integer,
	"last_job_id" uuid,
	"last_attempt_at" timestamp with time zone,
	"last_generated_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_core_data" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_core_generations" (
	"generation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_core_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"generation_no" integer NOT NULL,
	"job_id" uuid,
	"trigger" "daily_core_generation_trigger" NOT NULL,
	"generation_status" "daily_core_generation_status" DEFAULT 'queued' NOT NULL,
	"quality_status" "daily_core_quality_status",
	"input_hash" text,
	"content_hash" text,
	"core_json" jsonb,
	"schema_version" text NOT NULL,
	"taxonomy_version" text NOT NULL,
	"prompt_version" text NOT NULL,
	"pipeline_version" text NOT NULL,
	"model_provider" text NOT NULL,
	"model_name" text NOT NULL,
	"model_config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"input_stats_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"token_usage_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processing_metrics_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_core_generations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_core_items" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"core_date" date NOT NULL,
	"item_type" "daily_core_item_type" NOT NULL,
	"item_key" text NOT NULL,
	"title" text,
	"summary" text NOT NULL,
	"status" text,
	"importance" integer,
	"confidence" numeric,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"classifications_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"entities_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"semantic_text" text NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_core_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_core_metrics" (
	"metric_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"core_date" date NOT NULL,
	"metric_key" text NOT NULL,
	"metric_value" numeric NOT NULL,
	"unit" text NOT NULL,
	"rollup_hint" "daily_core_rollup_hint" NOT NULL,
	"origin" "daily_core_metric_origin" NOT NULL,
	"dimensions_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dimension_hash" text NOT NULL,
	"evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_core_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_core_source_snapshots" (
	"source_snapshot_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"target_source_id" uuid,
	"integration_id" uuid,
	"source_type" text NOT NULL,
	"source_ident" text NOT NULL,
	"config_snapshot_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"collection_status" "daily_core_collection_status" NOT NULL,
	"window_start_at" timestamp with time zone NOT NULL,
	"window_end_at" timestamp with time zone NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"raw_bytes" bigint,
	"estimated_tokens" integer,
	"source_input_hash" text,
	"raw_snapshot_ref" text,
	"stats_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"collected_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_core_data" ADD CONSTRAINT "daily_core_data_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_data" ADD CONSTRAINT "daily_core_data_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_data" ADD CONSTRAINT "daily_core_data_last_job_id_job_queue_id_fk" FOREIGN KEY ("last_job_id") REFERENCES "public"."job_queue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD CONSTRAINT "daily_core_generations_daily_core_id_daily_core_data_daily_core_id_fk" FOREIGN KEY ("daily_core_id") REFERENCES "public"."daily_core_data"("daily_core_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD CONSTRAINT "daily_core_generations_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD CONSTRAINT "daily_core_generations_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD CONSTRAINT "daily_core_generations_job_id_job_queue_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_queue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_items" ADD CONSTRAINT "daily_core_items_generation_id_daily_core_generations_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."daily_core_generations"("generation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_items" ADD CONSTRAINT "daily_core_items_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_items" ADD CONSTRAINT "daily_core_items_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_metrics" ADD CONSTRAINT "daily_core_metrics_generation_id_daily_core_generations_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."daily_core_generations"("generation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_metrics" ADD CONSTRAINT "daily_core_metrics_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_metrics" ADD CONSTRAINT "daily_core_metrics_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" ADD CONSTRAINT "daily_core_source_snapshots_generation_id_daily_core_generations_generation_id_fk" FOREIGN KEY ("generation_id") REFERENCES "public"."daily_core_generations"("generation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" ADD CONSTRAINT "daily_core_source_snapshots_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" ADD CONSTRAINT "daily_core_source_snapshots_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" ADD CONSTRAINT "daily_core_source_snapshots_target_source_id_target_sources_target_source_id_fk" FOREIGN KEY ("target_source_id") REFERENCES "public"."target_sources"("target_source_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" ADD CONSTRAINT "daily_core_source_snapshots_integration_id_integrations_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("integration_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_daily_core_data_target_date" ON "daily_core_data" USING btree ("target_id","core_date");--> statement-breakpoint
CREATE INDEX "idx_daily_core_data_workspace_date" ON "daily_core_data" USING btree ("workspace_id","core_date");--> statement-breakpoint
CREATE INDEX "idx_daily_core_data_target_date" ON "daily_core_data" USING btree ("target_id","core_date");--> statement-breakpoint
CREATE INDEX "idx_daily_core_data_quality_date" ON "daily_core_data" USING btree ("quality_status","core_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_daily_core_generations_no" ON "daily_core_generations" USING btree ("daily_core_id","generation_no");--> statement-breakpoint
CREATE INDEX "idx_daily_core_generations_daily_core_created" ON "daily_core_generations" USING btree ("daily_core_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_daily_core_generations_job" ON "daily_core_generations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_daily_core_generations_input_hash" ON "daily_core_generations" USING btree ("input_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_daily_core_items_generation_key" ON "daily_core_items" USING btree ("generation_id","item_type","item_key");--> statement-breakpoint
CREATE INDEX "idx_daily_core_items_target_date_type" ON "daily_core_items" USING btree ("target_id","core_date","item_type");--> statement-breakpoint
CREATE INDEX "idx_daily_core_items_workspace_date" ON "daily_core_items" USING btree ("workspace_id","core_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_daily_core_metrics_generation_key_dimension" ON "daily_core_metrics" USING btree ("generation_id","metric_key","dimension_hash");--> statement-breakpoint
CREATE INDEX "idx_daily_core_metrics_target_date_key" ON "daily_core_metrics" USING btree ("target_id","core_date","metric_key");--> statement-breakpoint
CREATE INDEX "idx_daily_core_metrics_workspace_date" ON "daily_core_metrics" USING btree ("workspace_id","core_date");--> statement-breakpoint
CREATE INDEX "idx_daily_core_source_snapshots_generation" ON "daily_core_source_snapshots" USING btree ("generation_id");--> statement-breakpoint
CREATE INDEX "idx_daily_core_source_snapshots_target_source" ON "daily_core_source_snapshots" USING btree ("target_source_id");--> statement-breakpoint
CREATE INDEX "idx_daily_core_source_snapshots_type_ident" ON "daily_core_source_snapshots" USING btree ("source_type","source_ident");--> statement-breakpoint
CREATE POLICY "dcd_select" ON "daily_core_data" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_core_data"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dcd_insert" ON "daily_core_data" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcd_update" ON "daily_core_data" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcd_delete" ON "daily_core_data" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "dcg_select" ON "daily_core_generations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_core_generations"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dcg_insert" ON "daily_core_generations" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcg_update" ON "daily_core_generations" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcg_delete" ON "daily_core_generations" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "dci_select" ON "daily_core_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_core_items"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dci_insert" ON "daily_core_items" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dci_update" ON "daily_core_items" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dci_delete" ON "daily_core_items" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "dcm_select" ON "daily_core_metrics" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_core_metrics"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dcm_insert" ON "daily_core_metrics" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcm_update" ON "daily_core_metrics" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcm_delete" ON "daily_core_metrics" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "dcss_select" ON "daily_core_source_snapshots" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_core_source_snapshots"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dcss_insert" ON "daily_core_source_snapshots" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcss_update" ON "daily_core_source_snapshots" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcss_delete" ON "daily_core_source_snapshots" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);