CREATE TABLE "external_events" (
	"source" text NOT NULL,
	"external_event_id" text NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"status" text DEFAULT 'received' NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "external_events_source_external_event_id_pk" PRIMARY KEY("source","external_event_id")
);
--> statement-breakpoint
ALTER TABLE "external_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "pg_provider" text;--> statement-breakpoint
UPDATE "payments" SET "pg_provider" = 'toss' WHERE "pg_provider" IS NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "pg_provider" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_invoice_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
CREATE INDEX "idx_external_events_source" ON "external_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_external_events_status" ON "external_events" USING btree ("status");--> statement-breakpoint
CREATE POLICY "ee_select" ON "external_events" AS PERMISSIVE FOR SELECT TO "service_role" USING (true);--> statement-breakpoint
CREATE POLICY "ee_insert" ON "external_events" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ee_update" ON "external_events" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ee_delete" ON "external_events" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);