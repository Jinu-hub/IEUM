CREATE TABLE "daily_reports" (
	"report_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_core_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"report_no" integer NOT NULL,
	"core_generation_no" integer NOT NULL,
	"report_status" "daily_core_generation_status" DEFAULT 'processing' NOT NULL,
	"language" "language" NOT NULL,
	"subject" text,
	"markdown" text,
	"html" text,
	"agent_conversation_id" text,
	"agent_output_json" jsonb,
	"format_version" text NOT NULL,
	"prompt_version" text,
	"model_provider" text,
	"model_name" text,
	"token_usage_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processing_metrics_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"validation_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_daily_core_id_daily_core_data_daily_core_id_fk" FOREIGN KEY ("daily_core_id") REFERENCES "public"."daily_core_data"("daily_core_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_daily_reports_no" ON "daily_reports" USING btree ("daily_core_id","report_no");--> statement-breakpoint
CREATE INDEX "idx_daily_reports_daily_core_created" ON "daily_reports" USING btree ("daily_core_id","created_at");--> statement-breakpoint
CREATE POLICY "dr_select" ON "daily_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "daily_reports"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "dr_insert" ON "daily_reports" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dr_update" ON "daily_reports" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "dr_delete" ON "daily_reports" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);