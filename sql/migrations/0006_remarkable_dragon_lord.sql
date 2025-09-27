CREATE TYPE "public"."installation_request_status" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "github_installation_requests" (
	"request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"state_data" text NOT NULL,
	"account_login" text,
	"installation_id" integer,
	"status" "installation_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "github_installation_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "github_installation_requests" ADD CONSTRAINT "github_installation_requests_workspace_id_workspace_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installation_requests" ADD CONSTRAINT "github_installation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_github_install_req_ws_user" ON "github_installation_requests" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_github_install_req_account_status" ON "github_installation_requests" USING btree ("account_login","status");--> statement-breakpoint
CREATE INDEX "idx_github_install_req_status_expires" ON "github_installation_requests" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "idx_github_install_req_installation_id" ON "github_installation_requests" USING btree ("installation_id");--> statement-breakpoint
CREATE POLICY "gir_select" ON "github_installation_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from workspace_member m where m.workspace_id =  "github_installation_requests"."workspace_id"  and m.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "gir_insert" ON "github_installation_requests" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "gir_update" ON "github_installation_requests" AS PERMISSIVE FOR UPDATE TO "authenticated", "service_role" USING (user_id = auth.uid() OR auth.role() = 'service_role') WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');--> statement-breakpoint
CREATE POLICY "gir_delete" ON "github_installation_requests" AS PERMISSIVE FOR DELETE TO "authenticated", "service_role" USING (user_id = auth.uid() OR auth.role() = 'service_role');