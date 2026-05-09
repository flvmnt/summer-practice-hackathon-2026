CREATE TABLE "event_attendees" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'going' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_attendees_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"group_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"sport" varchar(40) NOT NULL,
	"when_at" timestamp with time zone NOT NULL,
	"duration_min" smallint DEFAULT 90 NOT NULL,
	"custom_location_text" text,
	"status" varchar(20) DEFAULT 'proposed' NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_attendees_user_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_group_when_idx" ON "events" USING btree ("group_id","when_at");--> statement-breakpoint
CREATE INDEX "events_demo_run_idx" ON "events" USING btree ("demo_run_id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;