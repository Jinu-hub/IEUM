CREATE TYPE "public"."mail_status" AS ENUM('sending', 'delivered', 'failed');--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD COLUMN "status" "mail_status" DEFAULT 'sending' NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD COLUMN "failure_reason" text;