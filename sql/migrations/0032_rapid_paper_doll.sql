ALTER TYPE "public"."job_type" ADD VALUE 'billing_renewal';--> statement-breakpoint
ALTER TYPE "public"."job_type" ADD VALUE 'billing_all_renewals';--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_interval" SET DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_country_code" text DEFAULT 'KR' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_currency" text DEFAULT 'KRW' NOT NULL;