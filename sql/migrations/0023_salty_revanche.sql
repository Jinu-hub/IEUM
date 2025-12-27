CREATE TYPE "public"."plan_type" AS ENUM('trial', 'free', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('slack_channel', 'slack_thread', 'github_repo', 'github_search');--> statement-breakpoint
CREATE TYPE "public"."subscription_mode" AS ENUM('experiment', 'free', 'paid');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'paused', 'expired', 'canceled');--> statement-breakpoint
CREATE TABLE "plan_limits" (
	"plan_type" "plan_type" PRIMARY KEY NOT NULL,
	"max_workspaces" integer,
	"max_targets" integer
);
--> statement-breakpoint
ALTER TABLE "plan_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"subscription_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_type" "plan_type" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"mode" "subscription_mode" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"latest_payment_id" bigint,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "target_source_policy" (
	"policy_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_type" "plan_type" NOT NULL,
	"source_type" "source_type" NOT NULL,
	"max_count" integer
);
--> statement-breakpoint
ALTER TABLE "target_source_policy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_latest_payment_id_payments_payment_id_fk" FOREIGN KEY ("latest_payment_id") REFERENCES "public"."payments"("payment_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER POLICY "select-payment-policy" ON "payments" RENAME TO "pay_select";--> statement-breakpoint
CREATE POLICY "pay_insert" ON "payments" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "pay_update" ON "payments" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "pay_delete" ON "payments" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "plan_select" ON "plan_limits" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "plan_insert" ON "plan_limits" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "plan_update" ON "plan_limits" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "plan_delete" ON "plan_limits" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "subsc_select" ON "subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "subscriptions"."user_id");--> statement-breakpoint
CREATE POLICY "subsc_insert" ON "subscriptions" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "subsc_update" ON "subscriptions" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "subsc_delete" ON "subscriptions" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "tsp_select" ON "target_source_policy" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "tsp_insert" ON "target_source_policy" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "tsp_update" ON "target_source_policy" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "tsp_delete" ON "target_source_policy" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);