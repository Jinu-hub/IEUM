ALTER TABLE "target_sources" ALTER COLUMN "is_member_mail" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "targets" ADD COLUMN "is_member_mail" boolean DEFAULT true NOT NULL;