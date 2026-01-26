ALTER TABLE "payments" ALTER COLUMN "currency" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "mode" SET DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "usage_counters" ADD COLUMN "estimated_tokens" bigint DEFAULT 0 NOT NULL;