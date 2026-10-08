CREATE TYPE "public"."daily_core_collection_stage" AS ENUM('pending', 'collected', 'failed');--> statement-breakpoint
CREATE TABLE "daily_core_source_data" (
	"source_data_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_core_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"target_source_id" uuid,
	"integration_id" uuid,
	"source_type" text NOT NULL,
	"source_ident" text NOT NULL,
	"config_snapshot_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"collection_status" "daily_core_collection_status" NOT NULL,
	"normalized_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"content_hash" text,
	"stats_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_core_source_data" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_core_source_snapshots" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "dcss_select" ON "daily_core_source_snapshots" CASCADE;--> statement-breakpoint
DROP POLICY "dcss_insert" ON "daily_core_source_snapshots" CASCADE;--> statement-breakpoint
DROP POLICY "dcss_update" ON "daily_core_source_snapshots" CASCADE;--> statement-breakpoint
DROP POLICY "dcss_delete" ON "daily_core_source_snapshots" CASCADE;--> statement-breakpoint
DROP TABLE "daily_core_source_snapshots" CASCADE;--> statement-breakpoint
ALTER TABLE "daily_core_data" DROP CONSTRAINT "daily_core_data_last_job_id_job_queue_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_core_generations" DROP CONSTRAINT "daily_core_generations_job_id_job_queue_id_fk";
--> statement-breakpoint
DROP INDEX "idx_daily_core_generations_job";--> statement-breakpoint
ALTER TABLE "daily_core_generations" ALTER COLUMN "prompt_version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ALTER COLUMN "model_provider" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ALTER COLUMN "model_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ALTER COLUMN "started_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_core_data" ADD COLUMN "collection_stage" "daily_core_collection_stage" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_core_data" ADD COLUMN "collected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD COLUMN "input_source_data_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD COLUMN "agent_conversation_id" text;--> statement-breakpoint
ALTER TABLE "daily_core_generations" ADD COLUMN "agent_output_json" jsonb;--> statement-breakpoint
ALTER TABLE "daily_core_source_data" ADD CONSTRAINT "daily_core_source_data_daily_core_id_daily_core_data_daily_core_id_fk" FOREIGN KEY ("daily_core_id") REFERENCES "public"."daily_core_data"("daily_core_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_data" ADD CONSTRAINT "daily_core_source_data_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_data" ADD CONSTRAINT "daily_core_source_data_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_data" ADD CONSTRAINT "daily_core_source_data_target_source_id_target_sources_target_source_id_fk" FOREIGN KEY ("target_source_id") REFERENCES "public"."target_sources"("target_source_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_core_source_data" ADD CONSTRAINT "daily_core_source_data_integration_id_integrations_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("integration_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_core_source_data_daily_core_collected" ON "daily_core_source_data" USING btree ("daily_core_id","collected_at");--> statement-breakpoint
CREATE INDEX "idx_daily_core_source_data_target_source" ON "daily_core_source_data" USING btree ("target_source_id");--> statement-breakpoint
CREATE INDEX "idx_daily_core_data_collection_date" ON "daily_core_data" USING btree ("collection_stage","core_date");--> statement-breakpoint
ALTER TABLE "daily_core_data" DROP COLUMN "last_job_id";--> statement-breakpoint
ALTER TABLE "daily_core_generations" DROP COLUMN "job_id";--> statement-breakpoint
CREATE POLICY "dcsd_select" ON "daily_core_source_data" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_core_source_data"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dcsd_insert" ON "daily_core_source_data" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcsd_update" ON "daily_core_source_data" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dcsd_delete" ON "daily_core_source_data" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);