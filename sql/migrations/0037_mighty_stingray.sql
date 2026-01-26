ALTER TABLE "usage_counters" RENAME COLUMN "estimated_tokens" TO "accurated_token_count";--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" ADD COLUMN "accurated_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_run_steps" ADD COLUMN "process_time_json" jsonb DEFAULT '{}'::jsonb NOT NULL;