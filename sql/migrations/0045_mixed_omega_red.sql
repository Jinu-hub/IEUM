ALTER TABLE "newsletter_editions" ADD COLUMN "daily_core_id" uuid;--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD COLUMN "daily_report_id" uuid;--> statement-breakpoint
ALTER TABLE "newsletter_editions" ADD COLUMN "forced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_editions_daily_core_sent" ON "newsletter_editions" USING btree ("daily_core_id") WHERE "newsletter_editions"."status" in ('sending', 'delivered', 'partial') and "newsletter_editions"."forced" = false;