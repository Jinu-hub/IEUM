CREATE TYPE "public"."billing_interval" AS ENUM('weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."payment_method_status" AS ENUM('active', 'suspended', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('card', 'bank', 'wallet');--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"method_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pg_provider" text NOT NULL,
	"method_type" "payment_method_type" NOT NULL,
	"customer_key" text,
	"billing_key" text NOT NULL,
	"status" "payment_method_status" NOT NULL,
	"is_default" boolean NOT NULL,
	"display_brand" text,
	"display_last4" text,
	"metadata" jsonb,
	"raw_data" jsonb,
	"issued_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "payment_method_id" uuid;--> statement-breakpoint
-- Add billing_interval column with default value first (nullable), then update existing rows, then add NOT NULL constraint
ALTER TABLE "subscriptions" ADD COLUMN "billing_interval" "billing_interval" DEFAULT 'monthly';--> statement-breakpoint
UPDATE "subscriptions" SET "billing_interval" = 'monthly' WHERE "billing_interval" IS NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_interval" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_method_id_payment_methods_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("method_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "pm_select" ON "payment_methods" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "payment_methods"."user_id");--> statement-breakpoint
CREATE POLICY "pm_insert" ON "payment_methods" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "pm_update" ON "payment_methods" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "pm_delete" ON "payment_methods" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);