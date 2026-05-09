CREATE TABLE "ai_cache" (
	"input_hash" text PRIMARY KEY NOT NULL,
	"output_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
