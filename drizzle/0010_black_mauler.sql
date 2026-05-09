CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demo_run_id" uuid,
	"user_id" uuid NOT NULL,
	"type" varchar(40) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_demo_run_id_demo_runs_id_fk" FOREIGN KEY ("demo_run_id") REFERENCES "public"."demo_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","created_at") WHERE "notifications"."read_at" is null;--> statement-breakpoint
CREATE INDEX "notifications_demo_run_idx" ON "notifications" USING btree ("demo_run_id");