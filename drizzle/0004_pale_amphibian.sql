CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"scope_type" varchar(10) NOT NULL,
	"group_id" uuid,
	"event_id" uuid,
	"user_id" uuid,
	"client_id" varchar(80),
	"kind" varchar(20) DEFAULT 'text' NOT NULL,
	"body" text NOT NULL,
	"meta" jsonb,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_scope_exactly_one" CHECK (
        ("messages"."scope_type" = 'group' and "messages"."group_id" is not null and "messages"."event_id" is null)
        or ("messages"."scope_type" = 'event' and "messages"."event_id" is not null and "messages"."group_id" is null)
      )
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_group_created_idx" ON "messages" USING btree ("group_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_event_created_idx" ON "messages" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_demo_run_idx" ON "messages" USING btree ("demo_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_client_unique" ON "messages" USING btree ("user_id","client_id");