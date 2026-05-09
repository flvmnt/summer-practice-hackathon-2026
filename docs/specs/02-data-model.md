# 02 - Data Model

## 1. ER diagram (ASCII)

```
                  ┌──────────────────┐
                  │     users        │
                  │──────────────────│
                  │ id (uuid pk)     │◄──────────────┐
                  │ username uk      │               │
                  │ full_name        │               │
                  │ password_hash    │               │
                  │ recovery_code_h  │               │
                  │ email?           │               │
                  │ bio?             │               │
                  │ city?            │               │
                  │ home_lat/lng?    │               │
                  │ max_distance_km  │               │
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
                              │ created_at     │ │ center_lat/lng│
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
                                         │ scope    │ │group_id│ │ group_id │
                                         │ group_id?│ │        │ │ event_id?│
                                         │ event_id?│ │        │ │         │
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
                              │ lat/lng          │
                              │ price/confidence │
                              │ raw_tags jsonb   │
                              └──────────────────┘
```

## 2. Tables (Drizzle schema sketch)

> This is illustrative. Actual code goes in `src/db/schema.ts` later.
> In actual Drizzle code, declare tables in dependency order (for example `events` before event-scoped `messages`) or split references cleanly; the snippets below prioritize readability.

```ts
// users - curbe-pattern with sport extensions
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 30 }).notNull().unique(),
  fullName: varchar('full_name', { length: 80 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  recoveryCodeHash: text('recovery_code_hash').notNull(),
  email: varchar('email', { length: 255 }),
  bio: text('bio'),
  city: varchar('city', { length: 100 }),
  homeLat: decimal('home_lat', { precision: 9, scale: 6 }),
  homeLng: decimal('home_lng', { precision: 9, scale: 6 }),
  maxDistanceKm: smallint('max_distance_km').notNull().default(5),
  skillLevel: smallint('skill_level'),                 // 1..5 fallback when no per-sport level exists
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
  index('users_home_lat_lng_idx').on(t.homeLat, t.homeLng),
]);

export const demoRuns = pgTable('demo_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 80 }).notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profilePhotos = pgTable('profile_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  objectKey: text('object_key').notNull(),
  aiStatus: varchar('ai_status', { length: 20 }).notNull().default('pending'), // pending|ready|failed|skipped
  aiSuggestions: jsonb('ai_suggestions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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

// prompts - one per (date, slot). slot = morning|afternoon|evening
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
  lat: decimal('lat', { precision: 9, scale: 6 }),      // optional one-off prompt location
  lng: decimal('lng', { precision: 9, scale: 6 }),
  maxDistanceKm: smallint('max_distance_km'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('availability_unique').on(t.promptId, t.userId)]);

// groups - formed by matching engine; persists across the prompt window
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'set null' }),
  sport: varchar('sport', { length: 40 }).notNull(),
  city: varchar('city', { length: 100 }),
  centerLat: decimal('center_lat', { precision: 9, scale: 6 }),
  centerLng: decimal('center_lng', { precision: 9, scale: 6 }),
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

export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: varchar('source', { length: 10 }).notNull(),   // osm|manual
  externalId: varchar('external_id', { length: 100 }),
  name: varchar('name', { length: 200 }).notNull(),
  kind: varchar('kind', { length: 40 }).notNull(),       // football_pitch|tennis_court|...
  lat: decimal('lat', { precision: 9, scale: 6 }).notNull(),
  lng: decimal('lng', { precision: 9, scale: 6 }).notNull(),
  priceTier: smallint('price_tier'),                     // 1=free, 4=premium
  priceConfidence: varchar('price_confidence', { length: 20 }).notNull().default('estimated'), // verified|captain_entered|estimated|unknown
  rawTags: jsonb('raw_tags'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('venues_lat_lng_idx').on(t.lat, t.lng),
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
  priceEstimateText: varchar('price_estimate_text', { length: 80 }),
  priceConfidence: varchar('price_confidence', { length: 20 }).notNull().default('unknown'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('events_group_when_idx').on(t.groupId, t.whenAt),
]);

export const eventVenueCandidates = pgTable('event_venue_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  venueId: uuid('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  score: smallint('score').notNull(),
  distanceKm: decimal('distance_km', { precision: 6, scale: 2 }),
  priceTier: smallint('price_tier'),
  priceConfidence: varchar('price_confidence', { length: 20 }).notNull().default('estimated'),
  weatherFit: varchar('weather_fit', { length: 20 }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  scopeType: varchar('scope_type', { length: 10 }).notNull(), // group|event
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  clientId: varchar('client_id', { length: 80 }),        // idempotency for optimistic sends
  kind: varchar('kind', { length: 20 }).notNull(),       // text|system|vote_started|event_proposed
  body: text('body').notNull(),
  meta: jsonb('meta'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedByUserId: uuid('deleted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('messages_scope_exactly_one', sql`
    (${t.scopeType} = 'group' and ${t.groupId} is not null and ${t.eventId} is null)
    or (${t.scopeType} = 'event' and ${t.eventId} is not null and ${t.groupId} is null)
  `),
  index('messages_group_created_idx').on(t.groupId, t.createdAt),
  index('messages_event_created_idx').on(t.eventId, t.createdAt),
  uniqueIndex('messages_client_unique').on(t.userId, t.clientId),
]);

export const threadReads = pgTable('thread_reads', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scopeType: varchar('scope_type', { length: 10 }).notNull(), // group|event
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  lastMessageId: uuid('last_message_id').references(() => messages.id, { onDelete: 'set null' }),
  readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('thread_reads_scope_exactly_one', sql`
    (${t.scopeType} = 'group' and ${t.groupId} is not null and ${t.eventId} is null)
    or (${t.scopeType} = 'event' and ${t.eventId} is not null and ${t.groupId} is null)
  `),
  uniqueIndex('thread_reads_group_unique')
    .on(t.userId, t.groupId)
    .where(sql`${t.scopeType} = 'group' and ${t.groupId} is not null`),
  uniqueIndex('thread_reads_event_unique')
    .on(t.userId, t.eventId)
    .where(sql`${t.scopeType} = 'event' and ${t.eventId} is not null`),
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

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 40 }).notNull(), // prompt|match|message|event|vote|reminder
  title: varchar('title', { length: 160 }).notNull(),
  body: text('body'),
  href: text('href'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('notifications_user_created_idx').on(t.userId, t.createdAt),
]);

export const aiCache = pgTable('ai_cache', {
  key: varchar('key', { length: 180 }).primaryKey(),
  kind: varchar('kind', { length: 40 }).notNull(), // bio|photo|compatibility|captain_brief|event_plan
  model: varchar('model', { length: 120 }),
  inputHash: varchar('input_hash', { length: 80 }).notNull(),
  output: jsonb('output').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const achievements = pgTable('achievements', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 40 }).notNull(),  // first_match|10_yes_streak|captain_x3|...
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.code] })]);
```

Demo-owned rows that can be reset must carry either a nullable `demoRunId` FK to `demo_runs`, be reachable only through a marked parent with `ON DELETE CASCADE`, or use another explicit demo ownership marker. The final implementation must cover every seeded/resettable table, including `users`, `profile_photos`, `user_sports`, `prompts`, `availability_responses`, `groups`, `group_members`, `messages`, `thread_reads`, `venues`, `events`, `event_venue_candidates`, `event_attendees`, `votes`, `vote_choices`, `notifications`, `achievements`, and optional wearable fixtures. Runtime AI cache rows are not seeded demo proof and must not be deleted by demo reset unless a future schema adds explicit demo ownership.

## 2.1 AI cache (runtime only)

The AI surfaces (sport extraction, photo vision, captain brief, compatibility, vote rationale) call Groq when configured and may reuse runtime cache entries after the first successful call. The `ai_cache` table stores validated runtime outputs; it is not a mock, fixture, or seed-time pre-bake source.

Minimum demo-safe contract:

```sql
CREATE TABLE ai_cache (
  input_hash text PRIMARY KEY,
  output_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The contract above is the minimum interface every consumer must rely on. Consumers compute the same hash for the same real input and reuse cached model output while it is fresh.

Rules:

- Every AI call computes `input_hash = sha256(canonicalized_input)` before hitting the model.
- Lookup is `input_hash` first; on hit, the cached `output_json` is returned with no network call.
- On miss, the model is called, the response is validated against its zod contract, and the row is written.
- Demo seed must not populate AI cache rows. If Groq is unavailable, AI surfaces show deterministic/manual fallback copy and must label it as fallback.
- Judge Mode shows runtime AI cache status and count; this count means previous real AI calls were cached, not seeded or mocked output.

## 3. Indexes & invariants

- `users.username` unique (3-30 chars, regex `^[a-zA-Z0-9_-]+$`).
- `users.full_name` required after onboarding starts (1-80 chars, Unicode letters/marks, spaces, apostrophe, hyphen). Signup stores a temporary default from username until onboarding collects the real display name.
- One response per (`prompt_id`, `user_id`).
- One vote choice per (`vote_id`, `user_id`).
- `users.skill_level` and `user_sports.level` use the same 1..5 scale: 1=beginner, 2=casual, 3=intermediate, 4=advanced, 5=competitive. Per-sport level wins over user fallback level.
- `groups.size_target` defaults from sport-config table at create time (football=12, tennis=2-4, basketball=8, running=4, badminton=4, volley=12).
- `events.when_at` must be in the future at action validation time. If enforced in DB, use a trigger, not a time-dependent `CHECK (when_at > now())`.
- `messages` paginated by `(scope_type, group_id/event_id, created_at DESC, id)` cursor.
- Event-scoped messages must have `scope_type='event'` and `event_id`; group-scoped messages must have `scope_type='group'` and `group_id`.
- Location queries use numeric lat/lng with a bounding-box prefilter and Haversine exact distance in application code.
- Add normal btree indexes on `users(home_lat, home_lng)`, `groups(center_lat, center_lng)`, and `venues(lat, lng)`.
- Group formation must be transactional and idempotent per prompt via advisory lock plus active-membership guard so simultaneous Yes responses do not create duplicate groups or memberships.
- A user must not be an active confirmed member of two groups for the same prompt window. Implement with a transactional lookup/insert guard; add a partial unique index if the final schema stores `prompt_id` redundantly on `group_members`.
- Strava tokens are encrypted at rest before insert/update if the optional integration ships.
- Demo reset uses `demo_runs` ownership and must preserve a sentinel non-demo row in integration tests.

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

- Anonymization path: `users.username = 'deleted_<uuid8>'`, `users.full_name = 'Deleted user'`, clear `bio/email/photo_url/home_lat/home_lng`. Keep `id` for FK history.
- Hard delete path: cascades take down `user_sports`, `availability_responses`, `group_members` (group keeps existing without member), `vote_choices`, `messages.user_id` → `set null`, etc.
- Right-to-export: dump JSON of all rows where `user_id = me.id`.

See [10-prod-readiness.md §3](10-prod-readiness.md).

## 6. Migrations

- `drizzle-kit generate` → review SQL → `drizzle-kit migrate`.
- Each migration is a single `.sql` file checked in under `drizzle/`.
- CI runs `pnpm db:migrate` against an ephemeral Postgres before tests.
