CREATE TYPE "public"."period" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN "period" "period" DEFAULT 'weekly' NOT NULL;--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN "period_key" text DEFAULT 'current' NOT NULL;--> statement-breakpoint
ALTER TABLE "highlights" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;