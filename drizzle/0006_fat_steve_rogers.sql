CREATE TABLE "event_venue_candidates" (
	"event_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"rank" smallint NOT NULL,
	"distance_km" numeric(6, 2),
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_venue_candidates_event_id_venue_id_pk" PRIMARY KEY("event_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"name" varchar(120) NOT NULL,
	"address" text,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"sport" varchar(40) NOT NULL,
	"price_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"price_confidence" varchar(20) DEFAULT 'estimated' NOT NULL,
	"source" varchar(40) DEFAULT 'seeded' NOT NULL,
	"external_id" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote_choices" (
	"vote_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"option_idx" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_choices_vote_id_user_id_pk" PRIMARY KEY("vote_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"group_id" uuid,
	"event_id" uuid,
	"topic" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_venue_candidates" ADD CONSTRAINT "event_venue_candidates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_venue_candidates" ADD CONSTRAINT "event_venue_candidates_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_choices" ADD CONSTRAINT "vote_choices_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_choices" ADD CONSTRAINT "vote_choices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_venue_candidates_event_rank_idx" ON "event_venue_candidates" USING btree ("event_id","rank");--> statement-breakpoint
CREATE INDEX "venues_lat_lng_idx" ON "venues" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "venues_sport_idx" ON "venues" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "venues_demo_run_idx" ON "venues" USING btree ("demo_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_source_external_unique" ON "venues" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "vote_choices_user_idx" ON "vote_choices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "votes_event_topic_idx" ON "votes" USING btree ("event_id","topic");--> statement-breakpoint
CREATE INDEX "votes_group_idx" ON "votes" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "votes_demo_run_idx" ON "votes" USING btree ("demo_run_id");