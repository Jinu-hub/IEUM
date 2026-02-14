CREATE TABLE "run_log_events" (
	"run_log_event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"level" text NOT NULL,
	"step_name" text NOT NULL,
	"message" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "run_log_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "newsletter_editions" DROP CONSTRAINT "newsletter_editions_target_id_targets_target_id_fk";
--> statement-breakpoint
ALTER TABLE "run_log_events" ADD CONSTRAINT "run_log_events_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_log_events" ADD CONSTRAINT "run_log_events_run_id_newsletter_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."newsletter_runs"("run_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_run_log_events_run_id_level" ON "run_log_events" USING btree ("run_id","level");--> statement-breakpoint
CREATE INDEX "idx_run_log_events_run_id_step_name" ON "run_log_events" USING btree ("run_id","step_name");--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD CONSTRAINT "newsletter_editions_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "rle_select" ON "run_log_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "run_log_events"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "rle_insert" ON "run_log_events" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "rle_update" ON "run_log_events" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "rle_delete" ON "run_log_events" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);