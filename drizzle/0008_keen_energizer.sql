CREATE TABLE "event_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"event_id" uuid NOT NULL,
	"secret_hash" varchar(64) NOT NULL,
	"created_by_user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_invites_secret_hash_unique" ON "event_invites" USING btree ("secret_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "event_invites_one_active_event_unique" ON "event_invites" USING btree ("event_id") WHERE "event_invites"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "event_invites_event_active_idx" ON "event_invites" USING btree ("event_id") WHERE "event_invites"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "event_invites_demo_run_idx" ON "event_invites" USING btree ("demo_run_id");