ALTER TABLE "payment_methods" RENAME COLUMN "country_code" TO "region";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "billing_country_code" TO "billing_region";