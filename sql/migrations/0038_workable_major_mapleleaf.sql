-- Add target_id as nullable so existing rows don't fail
ALTER TABLE "highlights" ADD COLUMN "target_id" uuid;--> statement-breakpoint
-- Backfill: set target_id from first target in same workspace
UPDATE "highlights" h SET "target_id" = (SELECT t.target_id FROM "targets" t WHERE t.workspace_id = h.workspace_id ORDER BY t.target_id LIMIT 1) WHERE h.target_id IS NULL;--> statement-breakpoint
-- Remove highlights whose workspace has no targets (can't satisfy NOT NULL otherwise)
DELETE FROM "highlights" WHERE "target_id" IS NULL;--> statement-breakpoint
ALTER TABLE "highlights" ALTER COLUMN "target_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;
