ALTER TABLE "newsletter_runs" ADD COLUMN "accurated_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" DROP COLUMN "accurated_tokens";