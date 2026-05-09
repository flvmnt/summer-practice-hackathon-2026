import {
  boolean,
  check,
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
import { sql } from "drizzle-orm";

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
    scopeKey: varchar("scope_key", { length: 80 }).notNull().default("prod"),
    windowDate: date("window_date").notNull(),
    windowSlot: varchar("window_slot", { length: 12 }).notNull(),
    messageText: text("message_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prompt_scope_date_slot_unique").on(
      table.scopeKey,
      table.windowDate,
      table.windowSlot,
    ),
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
    matchFailureReason: varchar("match_failure_reason", { length: 40 }),
    lastMatchAttemptAt: timestamp("last_match_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("availability_prompt_user_unique").on(table.promptId, table.userId),
    index("availability_user_idx").on(table.userId),
    index("availability_demo_run_idx").on(table.demoRunId),
    index("availability_prompt_answer_idx").on(table.promptId, table.answer),
  ],
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    sport: varchar("sport", { length: 40 }).notNull(),
    city: varchar("city", { length: 100 }),
    centerLat: decimal("center_lat", { precision: 9, scale: 6 }),
    centerLng: decimal("center_lng", { precision: 9, scale: 6 }),
    sizeTarget: smallint("size_target").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    captainUserId: uuid("captain_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("groups_prompt_idx").on(table.promptId),
    index("groups_demo_run_idx").on(table.demoRunId),
    index("groups_sport_idx").on(table.sport),
    index("groups_center_lat_lng_idx").on(table.centerLat, table.centerLng),
  ],
);

export const groupMembers = pgTable(
  "group_members",
  {
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull().default("player"),
    status: varchar("status", { length: 20 }).notNull().default("confirmed"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    uniqueIndex("group_members_active_prompt_user_unique")
      .on(table.promptId, table.userId)
      .where(sql`${table.status} in ('invited', 'confirmed')`),
    uniqueIndex("group_members_one_captain_unique")
      .on(table.groupId)
      .where(sql`${table.role} = 'captain'`),
    index("group_members_user_idx").on(table.userId),
    index("group_members_prompt_idx").on(table.promptId),
    index("group_members_demo_run_idx").on(table.demoRunId),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    sport: varchar("sport", { length: 40 }).notNull(),
    whenAt: timestamp("when_at", { withTimezone: true }).notNull(),
    durationMin: smallint("duration_min").notNull().default(90),
    customLocationText: text("custom_location_text"),
    status: varchar("status", { length: 20 }).notNull().default("proposed"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("events_group_when_idx").on(table.groupId, table.whenAt),
    index("events_demo_run_idx").on(table.demoRunId),
  ],
);

export const eventAttendees = pgTable(
  "event_attendees",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("going"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.userId] }),
    index("event_attendees_user_idx").on(table.userId),
  ],
);

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 120 }).notNull(),
    address: text("address"),
    lat: decimal("lat", { precision: 9, scale: 6 }).notNull(),
    lng: decimal("lng", { precision: 9, scale: 6 }).notNull(),
    sport: varchar("sport", { length: 40 }).notNull(),
    priceTier: varchar("price_tier", { length: 20 }).notNull().default("free"),
    priceConfidence: varchar("price_confidence", { length: 20 }).notNull().default("estimated"),
    source: varchar("source", { length: 40 }).notNull().default("seeded"),
    externalId: varchar("external_id", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("venues_lat_lng_idx").on(table.lat, table.lng),
    index("venues_sport_idx").on(table.sport),
    index("venues_demo_run_idx").on(table.demoRunId),
    uniqueIndex("venues_source_external_unique").on(table.source, table.externalId),
  ],
);

export const eventVenueCandidates = pgTable(
  "event_venue_candidates",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    rank: smallint("rank").notNull(),
    distanceKm: decimal("distance_km", { precision: 6, scale: 2 }),
    reason: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.venueId] }),
    index("event_venue_candidates_event_rank_idx").on(table.eventId, table.rank),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 40 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("votes_event_topic_idx").on(table.eventId, table.topic),
    index("votes_group_idx").on(table.groupId),
    index("votes_demo_run_idx").on(table.demoRunId),
  ],
);

export const voteChoices = pgTable(
  "vote_choices",
  {
    voteId: uuid("vote_id")
      .notNull()
      .references(() => votes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    optionIdx: smallint("option_idx").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.voteId, table.userId] }),
    index("vote_choices_user_idx").on(table.userId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    demoRunId: uuid("demo_run_id").references(() => demoRuns.id, {
      onDelete: "cascade",
    }),
    scopeType: varchar("scope_type", { length: 10 }).notNull(),
    groupId: uuid("group_id").references(() => groups.id, {
      onDelete: "cascade",
    }),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    clientId: varchar("client_id", { length: 80 }),
    kind: varchar("kind", { length: 20 }).notNull().default("text"),
    body: text("body").notNull(),
    meta: jsonb("meta"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByUserId: uuid("deleted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "messages_scope_exactly_one",
      sql`
        (${table.scopeType} = 'group' and ${table.groupId} is not null and ${table.eventId} is null)
        or (${table.scopeType} = 'event' and ${table.eventId} is not null and ${table.groupId} is null)
      `,
    ),
    index("messages_group_created_idx").on(table.groupId, table.createdAt),
    index("messages_event_created_idx").on(table.eventId, table.createdAt),
    index("messages_demo_run_idx").on(table.demoRunId),
    uniqueIndex("messages_client_unique").on(table.userId, table.clientId),
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
