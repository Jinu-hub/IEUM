CREATE TYPE "public"."workspace_kind" AS ENUM('org', 'team', 'personal', 'community', 'company', 'school', 'government', 'club', 'nexletter', 'app_review', 'other');--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "workspace"
  ALTER COLUMN "kind" SET DATA TYPE workspace_kind USING kind::workspace_kind;--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "kind" SET DEFAULT 'org';--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "is_onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint