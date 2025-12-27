CREATE TYPE "public"."period_type" AS ENUM('hourly', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"counter_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" "subscription_mode" NOT NULL,
	"period_type" "period_type" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"process_count" integer NOT NULL,
	"email_sent_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "uc_select" ON "usage_counters" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "usage_counters"."user_id");--> statement-breakpoint
CREATE POLICY "uc_insert" ON "usage_counters" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "uc_update" ON "usage_counters" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "uc_delete" ON "usage_counters" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);