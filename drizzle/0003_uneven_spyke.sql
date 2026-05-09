DROP INDEX "group_members_prompt_user_unique";--> statement-breakpoint
DROP INDEX "prompt_date_slot_unique";--> statement-breakpoint
ALTER TABLE "availability_responses" ADD COLUMN "match_failure_reason" varchar(40);--> statement-breakpoint
ALTER TABLE "availability_responses" ADD COLUMN "last_match_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "scope_key" varchar(80) DEFAULT 'prod' NOT NULL;--> statement-breakpoint
CREATE INDEX "availability_prompt_answer_idx" ON "availability_responses" USING btree ("prompt_id","answer");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_active_prompt_user_unique" ON "group_members" USING btree ("prompt_id","user_id") WHERE "group_members"."status" in ('invited', 'confirmed');--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_one_captain_unique" ON "group_members" USING btree ("group_id") WHERE "group_members"."role" = 'captain';--> statement-breakpoint
CREATE INDEX "groups_center_lat_lng_idx" ON "groups" USING btree ("center_lat","center_lng");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_scope_date_slot_unique" ON "prompts" USING btree ("scope_key","window_date","window_slot");