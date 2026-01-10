CREATE TYPE "public"."language" AS ENUM('en', 'ja', 'ko');--> statement-breakpoint
ALTER TABLE "targets" ADD COLUMN "language" "language" DEFAULT 'ja' NOT NULL;