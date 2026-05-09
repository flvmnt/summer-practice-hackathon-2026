CREATE TABLE "auth_rate_limits" (
	"bucket" varchar(120) PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"failures" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"object_key" text NOT NULL,
	"ai_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"ai_suggestions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sports" (
	"demo_run_id" uuid,
	"user_id" uuid NOT NULL,
	"sport" varchar(40) NOT NULL,
	"level" smallint,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sports_user_id_sport_pk" PRIMARY KEY("user_id","sport")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"username" varchar(30) NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"recovery_code_hash" text NOT NULL,
	"email" varchar(255),
	"bio" text,
	"city" varchar(100),
	"home_lat" numeric(9, 6),
	"home_lng" numeric(9, 6),
	"max_distance_km" smallint DEFAULT 5 NOT NULL,
	"skill_level" smallint,
	"photo_url" text,
	"profile_visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"locale" varchar(5) DEFAULT 'ro' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sports" ADD CONSTRAINT "user_sports_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sports" ADD CONSTRAINT "user_sports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_rate_limits_window_idx" ON "auth_rate_limits" USING btree ("window_started_at");--> statement-breakpoint
CREATE INDEX "profile_photos_user_created_idx" ON "profile_photos" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "profile_photos_demo_run_idx" ON "profile_photos" USING btree ("demo_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_photos_object_key_unique" ON "profile_photos" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "user_sports_demo_run_idx" ON "user_sports" USING btree ("demo_run_id");--> statement-breakpoint
CREATE INDEX "user_sports_sport_idx" ON "user_sports" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "users_home_lat_lng_idx" ON "users" USING btree ("home_lat","home_lng");--> statement-breakpoint
CREATE INDEX "users_demo_run_idx" ON "users" USING btree ("demo_run_id");