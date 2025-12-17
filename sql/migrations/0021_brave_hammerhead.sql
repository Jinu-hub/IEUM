CREATE TYPE "public"."setup_integrations" AS ENUM('start', 'connect_github', 'connect_slack', 'end');--> statement-breakpoint
CREATE TYPE "public"."setup_mailing_list" AS ENUM('start', 'regist_basic', 'regist_address', 'end');--> statement-breakpoint
CREATE TYPE "public"."setup_targets" AS ENUM('start', 'regist_basic', 'regist_schedule', 'regist_sourses', 'end');--> statement-breakpoint
ALTER TYPE "public"."mail_status" ADD VALUE 'partial' BEFORE 'failed';--> statement-breakpoint
ALTER TABLE "onboarding_states" ADD COLUMN "setup_integrations" "setup_integrations" DEFAULT 'start' NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding_states" ADD COLUMN "setup_mailing_list" "setup_mailing_list" DEFAULT 'start' NOT NULL;--> statement-breakpoint
ALTER TABLE "onboarding_states" ADD COLUMN "setup_targets" "setup_targets" DEFAULT 'start' NOT NULL;--> statement-breakpoint
-- Remove default value before changing type to avoid dependency issue
ALTER TABLE "public"."onboarding_states" ALTER COLUMN "onboarding_step" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."onboarding_states" ALTER COLUMN "onboarding_step" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."onboarding_step";--> statement-breakpoint
CREATE TYPE "public"."onboarding_step" AS ENUM('welcome', 'setup_integrations', 'setup_mailing_list', 'setup_targets', 'first_mail_sending', 'completed');--> statement-breakpoint
ALTER TABLE "public"."onboarding_states" ALTER COLUMN "onboarding_step" SET DATA TYPE "public"."onboarding_step" USING "onboarding_step"::"public"."onboarding_step";--> statement-breakpoint
-- Restore default value after type change
ALTER TABLE "public"."onboarding_states" ALTER COLUMN "onboarding_step" SET DEFAULT 'welcome';