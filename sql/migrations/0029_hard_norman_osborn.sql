CREATE TYPE "public"."job_status" AS ENUM('queued', 'processing', 'done', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('nexletter_generate', 'nexletter_retry', 'maintenance');--> statement-breakpoint
CREATE TABLE "job_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"dedupe_key" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"locked_by" text,
	"locked_at" timestamp with time zone,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_queue" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_queue_dedupe_key" ON "job_queue" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "idx_job_queue_pick" ON "job_queue" USING btree ("status","available_at","priority","created_at");--> statement-breakpoint
CREATE INDEX "idx_job_queue_workspace" ON "job_queue" USING btree ("workspace_id");--> statement-breakpoint
CREATE POLICY "jq_select" ON "job_queue" AS PERMISSIVE FOR SELECT TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "jq_insert" ON "job_queue" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "jq_update" ON "job_queue" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "jq_delete" ON "job_queue" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);