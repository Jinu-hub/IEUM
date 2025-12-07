CREATE TYPE "public"."user_type" AS ENUM('normal', 'nexletter', 'app_review');--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "is_completed_onboarding" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_type" "user_type" DEFAULT 'normal' NOT NULL;