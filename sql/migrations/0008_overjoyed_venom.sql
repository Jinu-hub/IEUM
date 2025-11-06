ALTER TABLE "targets" ADD COLUMN "schedule_hour" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."newsletter_run_steps" ALTER COLUMN "step" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."step_name";--> statement-breakpoint
CREATE TYPE "public"."step_name" AS ENUM('queued', 'collect_data', 'summarize_data', 'assemble_data', 'send_email');--> statement-breakpoint
ALTER TABLE "public"."newsletter_run_steps" ALTER COLUMN "step" SET DATA TYPE "public"."step_name" USING "step"::"public"."step_name";--> statement-breakpoint
ALTER TYPE "public"."step_status" RENAME VALUE 'skipped' TO 'canceled';--> statement-breakpoint