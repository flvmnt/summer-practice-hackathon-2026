CREATE TABLE "group_members" (
	"demo_run_id" uuid,
	"group_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'player' NOT NULL,
	"status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"prompt_id" uuid NOT NULL,
	"sport" varchar(40) NOT NULL,
	"city" varchar(100),
	"center_lat" numeric(9, 6),
	"center_lng" numeric(9, 6),
	"size_target" smallint NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"captain_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_captain_user_id_users_id_fk" FOREIGN KEY ("captain_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_prompt_user_unique" ON "group_members" USING btree ("prompt_id","user_id");--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_members_prompt_idx" ON "group_members" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "group_members_demo_run_idx" ON "group_members" USING btree ("demo_run_id");--> statement-breakpoint
CREATE INDEX "groups_prompt_idx" ON "groups" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "groups_demo_run_idx" ON "groups" USING btree ("demo_run_id");--> statement-breakpoint
CREATE INDEX "groups_sport_idx" ON "groups" USING btree ("sport");