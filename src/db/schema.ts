import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const demoRuns = pgTable("demo_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
