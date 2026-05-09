CREATE TABLE "availability_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"prompt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"answer" varchar(3) NOT NULL,
	"sport_prefs" text[],
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"max_distance_km" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"window_date" date NOT NULL,
	"window_slot" varchar(12) NOT NULL,
	"message_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_responses" ADD CONSTRAINT "availability_responses_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_responses" ADD CONSTRAINT "availability_responses_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_responses" ADD CONSTRAINT "availability_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_prompt_user_unique" ON "availability_responses" USING btree ("prompt_id","user_id");--> statement-breakpoint
CREATE INDEX "availability_user_idx" ON "availability_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "availability_demo_run_idx" ON "availability_responses" USING btree ("demo_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_date_slot_unique" ON "prompts" USING btree ("window_date","window_slot");--> statement-breakpoint
CREATE INDEX "prompts_demo_run_idx" ON "prompts" USING btree ("demo_run_id");