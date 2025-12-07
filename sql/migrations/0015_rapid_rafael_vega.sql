CREATE TYPE "public"."onboarding_step" AS ENUM('welcome', 'setup_workspace', 'connect_github', 'connect_slack', 'setup_mailing_list', 'setup_targets', 'setup_rules', 'first_mail_sending', 'completed');--> statement-breakpoint
CREATE TYPE "public"."onboarding_type" AS ENUM('default', 'slack_review');--> statement-breakpoint
CREATE TYPE "public"."review_step" AS ENUM('review_start', 'review_connect', 'review_setup_channel', 'review_collecting_data', 'review_completed');--> statement-breakpoint
CREATE TABLE "onboarding_states" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"onboarding_mode" "onboarding_type" DEFAULT 'default' NOT NULL,
	"onboarding_step" "onboarding_step" DEFAULT 'welcome' NOT NULL,
	"review_step" "review_step",
	"slack_connected" boolean DEFAULT false NOT NULL,
	"github_connected" boolean DEFAULT false NOT NULL,
	"target_configured" boolean DEFAULT false NOT NULL,
	"first_mail_send" boolean DEFAULT false NOT NULL,
	"first_mail_run_id" uuid,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_first_mail_run_id_newsletter_runs_run_id_fk" FOREIGN KEY ("first_mail_run_id") REFERENCES "public"."newsletter_runs"("run_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "os_select" ON "onboarding_states" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "onboarding_states"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "os_insert" ON "onboarding_states" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "onboarding_states"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "os_update" ON "onboarding_states" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "onboarding_states"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin'))) WITH CHECK (exists (select 1 from workspace_member m where m.workspace_id =  "onboarding_states"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));--> statement-breakpoint
CREATE POLICY "os_delete" ON "onboarding_states" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "onboarding_states"."workspace_id"  and m.user_id = auth.uid() and m.role in ('owner','admin')));