# 02 — Data Model

## 1. ER diagram (ASCII)

```
                  ┌──────────────────┐
                  │     users        │
                  │──────────────────│
                  │ id (uuid pk)     │◄──────────────┐
                  │ username uk      │               │
                  │ password_hash    │               │
                  │ recovery_code_h  │               │
                  │ email?           │               │
                  │ bio?             │               │
                  │ city?            │               │
                  │ home_point?      │  (PostGIS)    │
                  │ skill_level?     │               │
                  │ photo_url?       │               │
                  │ locale (ro|en)   │               │
                  │ is_admin         │               │
                  │ created_at       │               │
                  │ last_seen_at     │               │
                  └─────┬────────────┘               │
                        │                            │
            ┌───────────┼─────────┬──────────────────┼────────────┐
            ▼           ▼         ▼                  ▼            ▼
   ┌─────────────┐  ┌────────┐ ┌──────────────┐ ┌─────────┐ ┌────────────┐
   │ user_sports │  │push_   │ │availability_ │ │group_   │ │ strava_    │
   │             │  │subs    │ │responses     │ │members  │ │ accounts   │
   │ user_id fk  │  │user_id │ │ user_id fk   │ │user_id  │ │ user_id fk │
   │ sport       │  │endpoint│ │ prompt_id fk │ │group_id │ │ athlete_id │
   │ level?      │  │keys    │ │ answer Y|N   │ │role     │ │ tokens     │
   │ verified    │  │        │ │ created_at   │ │joined_at│ │ scope      │
   └─────────────┘  └────────┘ └──────────────┘ └─────────┘ └────────────┘
                                       │              │
                                       ▼              ▼
                              ┌────────────────┐ ┌───────────────┐
                              │  prompts       │ │  groups       │
                              │ id pk          │ │ id pk         │
                              │ window_date    │ │ sport         │
                              │ window_slot    │ │ city?         │
                              │ created_at     │ │ center_point? │
                              │ message_text   │ │ size_target   │
                              └────────────────┘ │ status        │
                                                 │ captain_id fk │
                                                 │ created_at    │
                                                 └──────┬────────┘
                                                        │
                                                ┌───────┼─────────┐
                                                ▼       ▼         ▼
                                         ┌──────────┐ ┌────────┐ ┌──────────┐
                                         │ messages │ │events  │ │  votes   │
                                         │ group_id │ │group_id│ │ group_id │
                                         │ user_id  │ │created │ │ event_id?│
                                         │ kind     │ │ _by    │ │ topic    │
                                         │ body     │ │when_at │ │ options  │
                                         │ created  │ │venue_id│ │ created  │
                                         └──────────┘ │status  │ └────┬─────┘
                                                      └──┬─────┘      │
                                                         │            ▼
                                                         ▼      ┌──────────────┐
                                                  ┌──────────┐  │ vote_choices │
                                                  │event_    │  │ vote_id fk   │
                                                  │attendees │  │ user_id fk   │
                                                  │event_id  │  │ option_idx   │
                                                  │user_id   │  │ created_at   │
                                                  │status    │  └──────────────┘
                                                  └──────────┘

                              ┌──────────────────┐
                              │   venues         │
                              │ id pk            │
                              │ source (osm|man) │
                              │ external_id      │
                              │ name             │
                              │ kind             │
                              │ point (PostGIS)  │
                              │ price_tier 1..4  │
                              │ raw_tags jsonb   │
                              └──────────────────┘
```

## 2. Tables (Drizzle schema sketch)

> This is illustrative. Actual code goes in `src/db/schema.ts` later.

```ts
// users — curbe-pattern with sport extensions
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 30 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  recoveryCodeHash: text('recovery_code_hash').notNull(),
  email: varchar('email', { length: 255 }),
  bio: text('bio'),
  city: varchar('city', { length: 100 }),
  homePoint: geography('home_point', { srid: 4326, type: 'Point' }),
  skillLevel: varchar('skill_level', { length: 20 }),  // beginner|intermediate|advanced
  photoUrl: text('photo_url'),
  profileVisibility: varchar('profile_visibility', { length: 20 }).notNull().default('public'),
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  locale: varchar('locale', { length: 5 }).notNull().default('ro'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('users_home_point_gist').using('gist', t.homePoint),
]);

export const userSports = pgTable('user_sports', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sport: varchar('sport', { length: 40 }).notNull(),       // football|tennis|...
  level: smallint('level'),                                // 1..5 per-sport override
  verified: boolean('verified').notNull().default(false),  // true if Strava confirmed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.sport] })]);

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('push_endpoint_unique').on(t.endpoint)]);

// prompts — one per (date, slot). slot = morning|afternoon|evening
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  windowDate: date('window_date').notNull(),
  windowSlot: varchar('window_slot', { length: 12 }).notNull(),
  messageText: text('message_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('prompt_date_slot_unique').on(t.windowDate, t.windowSlot)]);

export const availabilityResponses = pgTable('availability_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  answer: varchar('answer', { length: 3 }).notNull(),  // yes|no
  sportPrefs: text('sport_prefs').array(),             // override of profile prefs
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('availability_unique').on(t.promptId, t.userId)]);

// groups — formed by matching engine; persists across the prompt window
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'set null' }),
  sport: varchar('sport', { length: 40 }).notNull(),
  city: varchar('city', { length: 100 }),
  centerPoint: geography('center_point', { srid: 4326, type: 'Point' }),
  sizeTarget: smallint('size_target').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('forming'), // forming|active|done|cancelled
  captainUserId: uuid('captain_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().default('player'), // player|captain
  status: varchar('status', { length: 20 }).notNull().default('confirmed'), // invited|confirmed|declined|left
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.groupId, t.userId] })]);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  kind: varchar('kind', { length: 20 }).notNull(),  // text|system|vote_started|event_proposed
  body: text('body').notNull(),
  meta: jsonb('meta'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedByUserId: uuid('deleted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('messages_group_created_idx').on(t.groupId, t.createdAt),
]);

export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: varchar('source', { length: 10 }).notNull(),   // osm|manual
  externalId: varchar('external_id', { length: 100 }),
  name: varchar('name', { length: 200 }).notNull(),
  kind: varchar('kind', { length: 40 }).notNull(),       // football_pitch|tennis_court|...
  point: geography('point', { srid: 4326, type: 'Point' }).notNull(),
  priceTier: smallint('price_tier'),                     // 1=free, 4=premium
  rawTags: jsonb('raw_tags'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('venues_point_gist').using('gist', t.point),
  uniqueIndex('venues_source_external_unique').on(t.source, t.externalId),
]);

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 200 }),
  sport: varchar('sport', { length: 40 }).notNull(),
  whenAt: timestamp('when_at', { withTimezone: true }).notNull(),
  durationMin: smallint('duration_min').notNull().default(90),
  venueId: uuid('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  customLocationText: varchar('custom_location_text', { length: 200 }),
  status: varchar('status', { length: 20 }).notNull().default('proposed'),  // proposed|confirmed|cancelled|done
  notesText: text('notes_text'),
  weatherCacheJson: jsonb('weather_cache_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('events_group_when_idx').on(t.groupId, t.whenAt),
]);

export const eventAttendees = pgTable('event_attendees', {
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('invited'), // invited|going|maybe|declined
  respondedAt: timestamp('responded_at', { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.eventId, t.userId] })]);

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  topic: varchar('topic', { length: 200 }).notNull(),
  options: text('options').array().notNull(),     // ["18:00", "19:00", "20:00"]
  closesAt: timestamp('closes_at', { withTimezone: true }),
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const voteChoices = pgTable('vote_choices', {
  voteId: uuid('vote_id').notNull().references(() => votes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  optionIdx: smallint('option_idx').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.voteId, t.userId] })]);

export const stravaAccounts = pgTable('strava_accounts', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  athleteId: bigint('athlete_id', { mode: 'bigint' }).notNull().unique(),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  refreshTokenEncrypted: text('refresh_token_encrypted').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  scope: text('scope').notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
});

export const authRateLimits = pgTable('auth_rate_limits', {
  bucket: varchar('bucket', { length: 80 }).primaryKey(),  // e.g. "login:andrei"
  windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull(),
  failures: smallint('failures').notNull().default(0),
});

export const achievements = pgTable('achievements', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 40 }).notNull(),  // first_match|10_yes_streak|captain_x3|...
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.code] })]);
```

## 3. Indexes & invariants

- `users.username` unique (3-30 chars, regex `^[a-zA-Z0-9_-]+$`).
- One response per (`prompt_id`, `user_id`).
- One vote choice per (`vote_id`, `user_id`).
- `groups.size_target` defaults from sport-config table at create time (football=12, tennis=2-4, basketball=8, running=4, badminton=4, volley=12).
- `events.when_at` must be in the future at action validation time. If enforced in DB, use a trigger, not a time-dependent `CHECK (when_at > now())`.
- `messages` paginated by `(group_id, created_at DESC, id)` cursor.
- PostGIS GiST index on `users.home_point`, `groups.center_point`, `venues.point`.
- Group formation must be transactional and idempotent per `(prompt_id, sport, city/proximity_bucket)` so simultaneous Yes responses do not create duplicate partial groups.
- Strava tokens are encrypted at rest before insert/update.

## 4. Sport config (constant in `lib/sports.ts`)

```ts
export const SPORTS = {
  football:    { sizeMin: 6,  sizeIdeal: 12, sizeMax: 14, evenTeams: true,  outdoor: true,  indoor: false, kind: 'pitch' },
  basketball:  { sizeMin: 4,  sizeIdeal: 8,  sizeMax: 10, evenTeams: true,  outdoor: true,  indoor: true,  kind: 'court' },
  tennis:      { sizeMin: 2,  sizeIdeal: 4,  sizeMax: 4,  evenTeams: true,  outdoor: true,  indoor: true,  kind: 'court' },
  volleyball:  { sizeMin: 6,  sizeIdeal: 12, sizeMax: 14, evenTeams: true,  outdoor: true,  indoor: true,  kind: 'court' },
  badminton:   { sizeMin: 2,  sizeIdeal: 4,  sizeMax: 4,  evenTeams: true,  outdoor: false, indoor: true,  kind: 'court' },
  running:     { sizeMin: 1,  sizeIdeal: 4,  sizeMax: 8,  evenTeams: false, outdoor: true,  indoor: false, kind: 'route' },
  cycling:     { sizeMin: 1,  sizeIdeal: 4,  sizeMax: 8,  evenTeams: false, outdoor: true,  indoor: false, kind: 'route' },
  yoga:        { sizeMin: 2,  sizeIdeal: 6,  sizeMax: 12, evenTeams: false, outdoor: true,  indoor: true,  kind: 'studio' },
  hiking:      { sizeMin: 2,  sizeIdeal: 6,  sizeMax: 12, evenTeams: false, outdoor: true,  indoor: false, kind: 'trail' },
  table_tennis:{ sizeMin: 2,  sizeIdeal: 4,  sizeMax: 4,  evenTeams: true,  outdoor: false, indoor: true,  kind: 'table' },
} as const;
```

## 5. GDPR

- Anonymization path: `users.username = 'deleted_<uuid8>'`, clear `bio/email/photo_url/home_point`. Keep `id` for FK history.
- Hard delete path: cascades take down `user_sports`, `availability_responses`, `group_members` (group keeps existing without member), `vote_choices`, `messages.user_id` → `set null`, etc.
- Right-to-export: dump JSON of all rows where `user_id = me.id`.

See [10-prod-readiness.md §3](10-prod-readiness.md).

## 6. Migrations

- `drizzle-kit generate` → review SQL → `drizzle-kit migrate`.
- Each migration is a single `.sql` file checked in under `drizzle/`.
- CI runs `pnpm db:migrate` against an ephemeral Postgres before tests.
