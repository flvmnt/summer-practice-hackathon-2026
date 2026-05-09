# 09 — Data model audit

Audit date: 2026-05-09
Spec: `docs/specs/02-data-model.md`
Schema: `src/db/schema.ts` (single file, 487 lines)
Migrations: `drizzle/0000`–`drizzle/0010`

## Headline

Most spec entities are present and well-aligned, with stronger demo-ownership tracking than the spec required (every demo-resettable table carries `demo_run_id`). However, **four spec tables are entirely missing** (`push_subscriptions`, `thread_reads`, `strava_accounts`, plus the spec's `events.venueId`/weather/price columns), the `events.title` column drifts from spec (`notNull` vs spec optional, length 120 vs 200), `events` does not implement spec's optional `venueId` FK or weather/price cache columns, `votes` lost spec's `options` array + `closesAt`, and `messages.client_id` unique index allows duplicates due to a NULL-prone composite. Drift the other way: schema adds `event_invites`, `prompts.scope_key`, `availability_responses.matchFailure*`, `group_members.prompt_id` + partial unique indexes, and `notifications` partial unread index — all reasonable extensions.

## Verdict matrix (table by table)

| Table | Verdict | Schema location | Migration | Notes |
|---|---|---|---|---|
| `users` | DONE+drift | `schema.ts:25-59` | `0000:34-58` | OK. Adds `demoRunId`. `deletedAt`/`bannedAt` present (spec lines 109-110). |
| `demo_runs` | PARTIAL | `schema.ts:19-23` | `0000:7-11` | Missing spec's `created_by_user_id` FK (spec line 123). |
| `profile_photos` | DONE | `schema.ts:82-103` | `0000:13-22` | OK; spec lines 127-135. Adds object_key unique + per-user index. |
| `user_sports` | DONE+drift | `schema.ts:61-80` | `0000:24-32` | OK. Adds `demoRunId` + `sport` index. |
| `push_subscriptions` | **MISSING** | — | — | Spec lines 145-152. Not in schema. (Per AGENTS.md "Web Push is stretch only" so this is acceptable scope drift, but spec still lists it.) |
| `prompts` | DONE+drift | `schema.ts:105-126` | `0001:15-22`, `0003:5,10` | Adds `scope_key` (varchar 80, default 'prod') and changes unique index to `(scope_key, window_date, window_slot)`. Spec called for `(window_date, window_slot)` only. |
| `availability_responses` | DONE+drift | `schema.ts:128-157` | `0001:1-13`, `0003:3-4,6` | OK. Adds `matchFailureReason`, `lastMatchAttemptAt`, `updatedAt`, partial answer index — all extensions, not conflicts. |
| `groups` | PARTIAL | `schema.ts:159-186` | `0002:12-24`, `0003:9` | `prompt_id` is `notNull` (schema:166-168) and cascade-deletes on prompt drop; spec line 178 has it nullable with `set null`. Default status is `'active'` (schema:174); spec line 184 says `'forming'`. |
| `group_members` | DONE+drift | `schema.ts:188-219` | `0002:1-10`, `0003:1,7-8` | Adds `prompt_id` column + partial unique on `(prompt_id, user_id) where status in ('invited','confirmed')` (schema:209-211) — exactly what spec §3 line 402 requested. Adds one-captain-per-group partial unique. |
| `events` | PARTIAL | `schema.ts:221-247` | `0004:9-22` | Drift: `title` is `notNull` varchar(120) (schema:231); spec line 218 has it optional varchar(200). Missing spec columns `venue_id` FK (line 222), `notes_text` (225), `weather_cache_json` (226), `price_estimate_text` (227), `price_confidence` (228). `customLocationText` is `text` not varchar(200). `groupId` is `notNull` (schema:228-230); spec line 216 nullable. |
| `event_attendees` | PARTIAL | `schema.ts:249-265` | `0005:1-7` | Drift: status default `'going'` (schema:258); spec line 294 default `'invited'`. Missing spec column `responded_at` (spec line 295). Schema substitutes a `created_at`. |
| `event_invites` | **DRIFT (extra)** | `schema.ts:267-295` | `0008:1-18` | Not in spec at all. Extension for invite-link flow. Self-consistent. |
| `event_venue_candidates` | PARTIAL | `schema.ts:341-359` | `0006:1-9` | Different shape: spec has surrogate `id` PK + nullable `event_id`/`group_id` + `score`/`priceTier`/`priceConfidence`/`weatherFit` (spec lines 234-246). Schema uses composite PK `(event_id, venue_id)`, replaces `score` with `rank`, drops group fk, drops price/weather columns. |
| `messages` | DONE | `schema.ts:402-442` | `0004:1-19` | OK; check constraint matches spec. **Bug:** `messages_client_unique` on `(user_id, client_id)` (schema:440) — both columns can be NULL, so PG treats NULL pairs as distinct and allows multiple NULL rows. Either accept this (intent: idempotency only when both present) or add `WHERE user_id IS NOT NULL AND client_id IS NOT NULL`. Spec line 268 had the same definition, so technically DONE-as-spec'd, but the spec invariant "idempotency for optimistic sends" is weakly enforced. |
| `thread_reads` | **MISSING** | — | — | Spec lines 271-289. Not in schema. Affects unread/read state for chat surfaces. |
| `votes` | PARTIAL | `schema.ts:361-382` | `0006:34-43` | Significant drift: missing spec's `options text[] notNull` (spec line 303) and `closes_at` (spec line 304). Adds `status` ('open' default) — fine. `topic` shrunk to varchar(40) from spec's 200. `created_by_user_id` made nullable + `set null`; spec line 305 had it `notNull`. Without `options`, vote choices reference `option_idx` with no source of truth for option text. |
| `vote_choices` | DONE | `schema.ts:384-400` | `0006:26-32` | Matches spec lines 309-314. |
| `venues` | PARTIAL | `schema.ts:315-339` | `0006:11-24` | Drift: spec defines `kind` varchar(40) notNull (line 202), `price_tier smallint` (205), `raw_tags jsonb` (207), `external_id` nullable. Schema replaces `kind` with `sport varchar(40)`, makes `price_tier` `varchar(20) default 'free'` (string enum-ish), adds `address text`, makes `external_id` `notNull`, drops `raw_tags`. Lat/lng index present (line 334). `source` widened to varchar(40) with default `'seeded'`. |
| `strava_accounts` | **MISSING** | — | — | Spec lines 316-324. Not in schema. (Stretch per AGENTS.md "wearables claim points only with real Strava OAuth or labeled fixture", but spec still lists it.) |
| `auth_rate_limits` | DONE+drift | `schema.ts:470-480` | `0000:1-5` | OK. `bucket` widened from spec's varchar(80) to varchar(120). Adds window index. |
| `notifications` | DONE+drift | `schema.ts:444-468` | `0010` | OK; adds `demoRunId` and partial unread index. Spec lines 332-343. |
| `ai_cache` | PARTIAL | `schema.ts:482-486` | `0007` | Schema implements only the **minimal** §2.1 contract (`input_hash`, `output_json`, `created_at`). The richer Drizzle table the spec declared inline (lines 345-353) with `key`, `kind`, `model`, `input_hash`, `output`, `expires_at` is NOT implemented. Spec's note (line 378) said "the richer Drizzle table … is the implementation". Also: no `demoRunId` column, no `demo:<runId>:` key prefix mechanism — spec line 385 requires one of these for demo-reset ownership. Currently `ai_cache` rows are orphaned by demo reset. |
| `achievements` | DONE+drift | `schema.ts:297-313` | `0009` | OK. Adds `demoRunId`. |
| `sessions` | n/a | — | — | Not a spec table; spec relies on `iron-session` (cookie-based, no DB row). DONE by absence. |
| `recovery_codes` | n/a | — | — | Not a spec table; recovery code stored as hash on `users.recovery_code_hash`. DONE by absence. |

## Per-aspect findings

### Foreign keys + cascade behavior

DONE in most places. Mismatches:
- `groups.prompt_id` (schema:166-168) is `notNull` + `cascade`; spec (line 178) says nullable + `set null` so groups outlive their prompt. Cascade behavior on prompt deletion is acceptable for demo reset chain but conflicts with spec wording.
- `events.group_id` (schema:228-230) is `notNull` + `cascade`; spec line 216 nullable + `cascade`. Spec invariant allowed group-less events (e.g. created via invite flow); schema does not.
- `events.created_by_user_id` (schema:237-239) `set null`; spec line 217 `notNull`. Schema is more lenient — fine for GDPR anonymization.
- `votes.created_by_user_id` (schema:372-374) nullable + `set null`; spec line 305 `notNull`. Schema more lenient — fine.
- `event_venue_candidates.venue_id` (schema:347-349) `cascade`; spec line 238 `set null`. Cascade means deleting a venue removes the candidate row entirely. Acceptable.

### Indexes called out in spec

| Spec index | Implemented? | Location |
|---|---|---|
| `users_home_lat_lng_idx` | DONE | schema:56, 0000:71 |
| `prompt_date_slot_unique` | DRIFT (renamed `prompt_scope_date_slot_unique` and includes `scope_key`) | schema:119, 0003:10 |
| `availability_unique` | DONE (named `availability_prompt_user_unique`) | schema:152, 0001:28 |
| `push_endpoint_unique` | MISSING (table missing) | — |
| `venues_lat_lng_idx` | DONE | schema:334, 0006:55 |
| `venues_source_external_unique` | DONE | schema:337, 0006:58 |
| `events_group_when_idx` | DONE | schema:244, 0005:30 |
| `messages_group_created_idx` | DONE | schema:437, 0004:25 |
| `messages_event_created_idx` | DONE | schema:438, 0004:26 |
| `messages_client_unique` | DONE (with NULL caveat above) | schema:440, 0004:28 |
| `thread_reads_*_unique` (partial) | MISSING (table missing) | — |
| `notifications_user_created_idx` | DONE | schema:462, 0010:15 |
| Spec §3 line 400 — `groups(center_lat, center_lng)` | DONE (`groups_center_lat_lng_idx`) | schema:184, 0003:9 |
| Spec §3 line 402 — partial unique active member per prompt | DONE (`group_members_active_prompt_user_unique`) | schema:209-211, 0003:7 |

### Enums / string-enum value sets

The schema uses `varchar` everywhere (no `pgEnum`), matching the spec's pattern. Value-set drift:

- `groups.status` default `'active'` (schema:174) vs spec `'forming'` (line 184). Spec listed `forming|active|done|cancelled`; default differs.
- `event_attendees.status` default `'going'` (schema:258) vs spec `'invited'` (line 294).
- `venues.price_tier` is `varchar(20)` `'free'`-default (schema:327) vs spec `smallint` 1-4 (line 205). Different type/value-set entirely.
- `venues.source` defaults to `'seeded'` (schema:329); spec invariant only listed `osm|manual` (line 199). Spec lacks `seeded` as a recognized source.
- `messages.kind` adds default `'text'` (schema:420). Spec listed `text|system|vote_started|event_proposed` and no default; schema is fine.
- `votes.topic` is varchar(40) (schema:370) vs spec varchar(200) (line 302). Drastic shrink; if topic includes prompt text this will truncate.

### Default values

Generally aligned. Notable defaults that differ from spec:
- `groups.status` (above)
- `event_attendees.status` (above)
- `venues.price_confidence` `'estimated'` matches spec.
- `prompts.scope_key` `'prod'` (schema:112) — schema-only addition; not in spec.

### Timestamps (created_at / updated_at)

- All tables have `created_at` notNull defaultNow — DONE.
- `updated_at` present on `users` (schema:52), `availability_responses` (schema:149), `events` (schema:241). Spec only requires it on `users` (line 114). Extra is fine. **No `updated_at` trigger is defined** (no PG function/trigger to bump on UPDATE) — these will silently stay equal to `created_at` unless application code writes them, which is consistent with Drizzle conventions but worth noting.
- `last_seen_at` on users — DONE (schema:53).
- No tables that expect timestamps lack them.

### Demo ownership (spec line 362)

DONE with one exception. The spec required every seeded/resettable table carry `demoRunId` or be reachable via cascade through a marked parent. Verified:

- Direct `demoRunId` columns: `users`, `userSports`, `profilePhotos`, `prompts`, `availabilityResponses`, `groups`, `groupMembers`, `events`, `eventInvites`, `achievements`, `venues`, `votes`, `messages`, `notifications`. All cascade-on-delete to `demo_runs`.
- Reachable via cascade-only (no direct demoRunId): `event_attendees` (via `events`), `event_venue_candidates` (via `events`), `vote_choices` (via `votes`). Acceptable per spec.
- **`ai_cache` has no `demoRunId` and no key-prefix convention** (schema:482-486). Spec line 385 explicitly required this. Demo reset will leak AI cache rows.
- `auth_rate_limits` has no demo marker — acceptable (rate-limit buckets are not seeded).
- `demo_runs.created_by_user_id` not implemented (spec line 123).

## Tables in schema not in spec (drift the other way)

| Schema-only table/column | Location | Justification |
|---|---|---|
| `event_invites` table | schema:267-295 | Invite link flow. Not in spec but consistent with product. |
| `prompts.scope_key` | schema:112 | Allows multiple prompt scopes (prod/test/demo). Reasonable. |
| `availability_responses.match_failure_reason`, `last_match_attempt_at`, `updated_at` | schema:146-149 | Matching diagnostics. |
| `group_members.prompt_id` redundant column | schema:197-199 | Spec §3 line 402 explicitly anticipated this. |
| `group_members_one_captain_unique` partial index | schema:212-214 | Enforces single captain — not in spec but useful. |
| `notifications_user_unread_idx` partial | schema:463-465 | Performance optimization. |
| `events.updated_at` | schema:241 | Useful but not specified. |

## Missing entities (spec → schema)

1. **`push_subscriptions`** (spec lines 145-152) — Web Push is stretch in AGENTS.md, but if a notifications panel ever wants Web Push it has nowhere to write subs. **Recommend**: leave deferred; mark in spec as deferred-stretch to avoid drift confusion.
2. **`thread_reads`** (spec lines 271-289) — Required for unread badges on group/event chat. Currently not represented. **Recommend**: add before chat-isolation tests, since spec relies on this for read state.
3. **`strava_accounts`** (spec lines 316-324) — Stretch per AGENTS.md. Mark deferred or implement.
4. **`events.venue_id`, `notes_text`, `weather_cache_json`, `price_estimate_text`, `price_confidence`** (spec lines 222-228) — Without `venue_id` the events table has no venue link other than `customLocationText`. The matching/venue planning surfaces in spec rely on `events.venue_id`. **Recommend**: high priority — add columns.
5. **`votes.options text[]`, `closes_at`** (spec lines 303-304) — Voting cannot store options without these. `voteChoices.option_idx` references no source of truth. **Recommend**: high priority.
6. **`venues.kind`, `raw_tags`** + revert `price_tier` to smallint (spec lines 202-207) — Either update the spec to reflect schema (varchar `sport`, varchar `price_tier`, no `raw_tags`) or revert schema to spec. Drift here is large and looks intentional; needs alignment in same PR.

## Highest-priority fixes

1. **`votes.options` and `votes.closes_at`** — voting flow is broken without these.
2. **`thread_reads`** — chat unread state has no storage.
3. **`events.venue_id` FK** — spec event-chat/venue-pick flow assumes this column.
4. **`ai_cache` demo ownership** — demo reset leaks rows; spec §2.1 line 385 explicit.
5. **Spec ↔ schema reconciliation for `venues`** — type drift on `kind`/`price_tier`/`raw_tags` is large enough to warrant a spec amendment commit.

## Lower-priority alignments

- Decide `groups.status` default (`forming` vs `active`).
- Decide `event_attendees.status` default and add `responded_at`.
- Decide whether to widen `votes.topic` or accept varchar(40).
- Add `demo_runs.created_by_user_id`.
- Add `WHERE user_id IS NOT NULL AND client_id IS NOT NULL` to `messages_client_unique` (or accept current weakness).
- Mark `push_subscriptions` and `strava_accounts` as deferred in spec to remove drift signal.
