import {
  boolean,
  date,
  decimal,
  index,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const demoRuns = pgTable("demo_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    username: varchar("username", { length: 30 }).notNull().unique(),
    fullName: varchar("full_name", { length: 80 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    recoveryCodeHash: text("recovery_code_hash").notNull(),
    email: varchar("email", { length: 255 }),
    bio: text("bio"),
    city: varchar("city", { length: 100 }),
    homeLat: decimal("home_lat", { precision: 9, scale: 6 }),
    homeLng: decimal("home_lng", { precision: 9, scale: 6 }),
    maxDistanceKm: smallint("max_distance_km").notNull().default(5),
    skillLevel: smallint("skill_level"),
    photoUrl: text("photo_url"),
    profileVisibility: varchar("profile_visibility", { length: 20 })
      .notNull()
      .default("public"),
    locale: varchar("locale", { length: 5 }).notNull().default("ro"),
    isAdmin: boolean("is_admin").notNull().default(false),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_home_lat_lng_idx").on(table.homeLat, table.homeLng),
    index("users_demo_run_idx").on(table.demoRunId),
  ],
);

export const userSports = pgTable(
  "user_sports",
  {
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sport: varchar("sport", { length: 40 }).notNull(),
    level: smallint("level"),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.sport] }),
    index("user_sports_demo_run_idx").on(table.demoRunId),
    index("user_sports_sport_idx").on(table.sport),
  ],
);

export const profilePhotos = pgTable(
  "profile_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    objectKey: text("object_key").notNull(),
    aiStatus: varchar("ai_status", { length: 20 }).notNull().default("pending"),
    aiSuggestions: jsonb("ai_suggestions"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("profile_photos_user_created_idx").on(table.userId, table.createdAt),
    index("profile_photos_demo_run_idx").on(table.demoRunId),
    uniqueIndex("profile_photos_object_key_unique").on(table.objectKey),
  ],
);

export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    windowDate: date("window_date").notNull(),
    windowSlot: varchar("window_slot", { length: 12 }).notNull(),
    messageText: text("message_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prompt_date_slot_unique").on(table.windowDate, table.windowSlot),
    index("prompts_demo_run_idx").on(table.demoRunId),
  ],
);

export const availabilityResponses = pgTable(
  "availability_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answer: varchar("answer", { length: 3 }).notNull(),
    sportPrefs: text("sport_prefs").array(),
    lat: decimal("lat", { precision: 9, scale: 6 }),
    lng: decimal("lng", { precision: 9, scale: 6 }),
    maxDistanceKm: smallint("max_distance_km"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("availability_prompt_user_unique").on(table.promptId, table.userId),
    index("availability_user_idx").on(table.userId),
    index("availability_demo_run_idx").on(table.demoRunId),
  ],
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    bucket: varchar("bucket", { length: 120 }).primaryKey(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
    failures: smallint("failures").notNull().default(0),
  },
  (table) => [
    index("auth_rate_limits_window_idx").on(table.windowStartedAt),
  ],
);
