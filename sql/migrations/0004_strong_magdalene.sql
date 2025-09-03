CREATE TYPE "public"."connection_status" AS ENUM('connected', 'expired', 'revoked', 'unauthorized', 'error', 'never');--> statement-breakpoint
CREATE TABLE "integration_statuses" (
	"integration_id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"connection_status" "connection_status" DEFAULT 'never' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"last_ok_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"provider_error_code" text,
	"provider_error_message" text,
	"permissions_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resource_cache_json" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integration_statuses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integration_statuses" ADD CONSTRAINT "integration_statuses_integration_id_integrations_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("integration_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_statuses" ADD CONSTRAINT "integration_statuses_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ics_ws" ON "integration_statuses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_ics_status_checked" ON "integration_statuses" USING btree ("connection_status","last_checked_at");--> statement-breakpoint
CREATE INDEX "idx_ics_last_ok" ON "integration_statuses" USING btree ("workspace_id","connection_status","last_ok_at");--> statement-breakpoint
CREATE POLICY "ics_select" ON "integration_statuses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "integration_statuses"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "ics_insert" ON "integration_statuses" AS PERMISSIVE FOR INSERT TO "service_role" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ics_update" ON "integration_statuses" AS PERMISSIVE FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "ics_delete" ON "integration_statuses" AS PERMISSIVE FOR DELETE TO "service_role" USING (true);