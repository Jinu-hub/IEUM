ALTER TABLE "job_queue" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "job_queue" ADD CONSTRAINT "job_queue_target_id_targets_target_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("target_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_job_queue_target" ON "job_queue" USING btree ("target_id");