# 08 - Data model + DB query correctness audit

Audit date: 2026-05-09 15:48
Spec: `docs/specs/02-data-model.md` (modified +6/-6 in current diff - **the demo-ownership requirement on `ai_cache` was REMOVED**, see P3-3)
Schema: `src/db/schema.ts` (single file, 486 lines - spec ER mentions `src/db/schema/*.ts` but this repo flattens to one file)
Migrations: `drizzle/0000_glamorous_black_knight.sql` ... `drizzle/0010_black_mauler.sql` (11 files, no holes per `drizzle/meta/_journal.json`)
Demo seed: `scripts/seed-demo.ts` (400 lines), `src/lib/demo/ensure-seeded.ts` (39 lines), reset at `src/app/api/demo/reset/route.ts`

## Headline

Schema is broadly aligned with spec, with stronger demo-ownership tracking than spec required (every demo-resettable table carries `demo_run_id`). The prior 14:32 audit's `ai_cache` finding is now **resolved by spec**, not by schema: the spec was rewritten in the current diff to drop the demo-ownership requirement and call `ai_cache` "runtime only". The five other prior schema gaps (`push_subscriptions`, `thread_reads`, `strava_accounts`, `events.venue_id`/weather/price, `votes.options`/`closes_at`) are **still missing** in `src/db/schema.ts`. New issues found here: an R2-orphan window in photo upload (P0), N+1 attempt-marking inside the matching transaction (P1), 4 sequential `getDb()` calls instead of `Promise.all` in the group-detail loader (P2), an `ai_cache` table with TTL-in-payload that no eviction job will ever sweep (P2), and `messages_client_unique` on `(user_id, client_id)` is too narrow for the all-events sender contract (P2).

The Railway deploy now runs migrations correctly via `railway.toml [deploy] preDeployCommand` - the prior audit's drift is closed (commit 35b0919).

## Verdict matrix

| Area | Verdict | Largest issue |
|---|---|---|
| Schema vs spec drift (tables/columns) | **PARTIAL** - 3 missing tables, 5 missing columns | spec & schema continue to drift; some intentional, some not |
| AI cache demo-ownership | **resolved by spec rewrite** | docs/specs/02-data-model.md +6/-6 dropped the requirement; schema unchanged |
| Constraints / indexes | **DONE+drift** | partial unique on captain, on active prompt member - both spec-aligned |
| Migrations | **DONE** | chronologically ordered, single destructive index drop is paired with replacement (0003) |
| `pnpm start` runs migrations? | **DONE via Railway preDeployCommand** | `package.json:start` itself does NOT run migrations; only `scripts/prepare-standalone.mjs` |
| Transactions | **MOSTLY DONE** | photo upload R2 PUT is OUTSIDE the DB transaction (P0) |
| N+1 queries | **PARTIAL** | matching attempt-marker loops, group-detail loader does 4 sequential SELECTs |
| Time / TZ correctness | **DONE** | all 32 timestamps are `withTimezone:true`; prompt-window math fixed to Europe/Bucharest |
| AI cache (key/TTL/eviction) | **PARTIAL** | TTL stored in payload JSON, no DB column, no SQL eviction job possible |
| Public profile leakage | **DONE** | username-keyed URL, no UUID enumeration; password/recovery hashes never selected |
| Soft delete | **DONE** | `users.deletedAt` consistently filtered with `isNull(users.deletedAt)` in 14+ call sites |
| Seed data idempotence | **DONE-by-presence-check** | `seedDemo()` skips if any user with the demoRunId already exists |

## P0 - data corruption / PII leak

### P0-1. Profile photo upload: R2 object orphaned on DB failure
- **Where:** `src/lib/upload-actions.ts:51-60` (R2 PUT) and `src/lib/upload-actions.ts:79-110` (DB transaction)
- **Symptom:** The R2 PUT (`uploadProfilePhoto`) runs and commits the bytes to Cloudflare BEFORE any database row is written. If the transaction fails (network blip to Postgres, banned-user check returns no row, etc.), the new R2 object stays alive and unreferenced - and the user gets `actionError("upload_failed")` so they have no way to retry against the same key. AGENTS.md mandates "delete replaced objects" but says nothing about cleaning up THIS-attempt's failed object. Over hundreds of failures this is real R2 garbage and a small PII leak (some users may upload a face shot, the action returns failed, but the bytes sit at a public R2 URL that's only unguessable - not deleted).
- **Severity:** P0 because the bytes are user PII and no compensating delete exists.
- **Fix sketch:** Either (a) wrap a `try/catch` around the transaction and call `deleteFromR2(uploaded.key)` on failure, or (b) reverse the order: insert a "pending" `profile_photos` row first, then PUT to R2, then UPDATE the row to "ready" - same row gives you a sweep-able list of "pending older than 1h, delete from R2".
- **Note:** the existing `replacedKeys` cleanup at `src/lib/upload-actions.ts:131-146` is correct and well-commented; only the failure path on the new key is missing.

## P1 - integrity gap that bites in real use

### P1-1. `events.venue_id` column is missing - chosen venue cannot be persisted
- **Where:** schema `src/db/schema.ts:221-247`, spec `docs/specs/02-data-model.md:222`
- **Symptom:** `events` table has only `customLocationText` (free-form). Venue picks live in `event_venue_candidates` (composite PK on `event_id, venue_id`) and the venue vote winner exists only as a derivation in `getUserEventsList` (`src/lib/events.ts:503-527`). When a captain confirms the venue there's nowhere to write `events.venue_id`. The auto-event flow can never promote a winning candidate into a single source of truth on `events`. Spec §6.A "Auto-event setup" (which is already a known dead-code path per the 14:32 audit) needs this column to function.
- **Severity:** P1 because the feature can never close without it; demo-day workaround is to read the top-rank candidate, which is what `venueLabelFor()` already does.

### P1-2. `votes.options` and `votes.closes_at` missing - vote choices reference no source of truth
- **Where:** schema `src/db/schema.ts:361-382`, spec `docs/specs/02-data-model.md:303-304`
- **Symptom:** `vote_choices.option_idx` is a smallint that points at... nothing. The vote's "options" are inferred at read time by joining `event_venue_candidates.rank` with `option_idx` - which only works for the venue-pick vote topic. If `topic` is ever set to anything other than `'venue'` (e.g. "what time?", "what duration?"), there is no place to store the options array. Also no `closes_at`, so the spec's promised closing-time UI cannot exist.
- **Severity:** P1 - locks votes to the venue topic forever.

### P1-3. N+1 inside the matching transaction (one UPDATE per candidate, holds the advisory lock open)
- **Where:** `src/lib/matching.ts:241-263` inside `formGroupsForPromptAction` transaction (`src/lib/matching.ts:268-297`)
- **Symptom:** `markMatchAttempts` loops over every candidate and runs a per-row UPDATE. Inside `getDb().transaction(async (tx) => { ... await tx.execute(sql\`select pg_advisory_xact_lock(...)\`); ... })` this means the prompt's advisory lock is held for `N` round-trips. With 20-50 candidates per prompt window this is dozens of round-trips while the lock blocks any other Yes-arrival from triggering a parallel `formGroupsForPromptAction`.
- **Severity:** P1 - works at hackathon scale (4 demo users) but degrades visibly at the scoring-rubric's "20 seeded users" target.
- **Fix sketch:** one `UPDATE ... CASE WHEN user_id = ANY(:matched) THEN NULL ELSE 'no_compatible_group' END WHERE prompt_id = :p AND user_id = ANY(:all)` - single statement, single round-trip.

### P1-4. Group-detail loader does 4 sequential SELECTs instead of `Promise.all`
- **Where:** `src/lib/chat.ts:247-310` (`getGroupAction`)
- **Symptom:** The group SELECT (247-257), members SELECT (263-284), events SELECT (286-297), achievements SELECT (299-310) are all `await`ed serially with no shared state. Each round-trip to Railway Postgres is ~30-80ms, so this is ~120-320ms before render that could be ~80ms. Then `messages: await loadGroupMessages(...)` is fired AFTER `actionOk(...)` is constructed (line 329, evaluated as an object property) - so 5 sequential awaits total inside one call.
- **Severity:** P1 because the group page is the hot path for the demo. Not corruption, but visible jank.
- **Fix sketch:** `const [group, members, events, achievements, messages] = await Promise.all([...])`.

### P1-5. `messages_client_unique` is `(user_id, client_id)` with no scope and no NULL guard
- **Where:** `src/db/schema.ts:440`, migration `drizzle/0004_pale_amphibian.sql:28`
- **Symptom:** Two distinct issues:
  1. **NULL idempotency hole.** Postgres treats `(user_id, NULL)` rows as non-equal, so a user can have unlimited NULL-clientId messages (system messages: `src/lib/events.ts:343-354` inserts two with no clientId). That's actually intended behavior, but the index claim "idempotency for optimistic sends" is weakly enforced.
  2. **Cross-scope collisions.** A user who happens to send the same `client_id` to a group AND to an event (different rooms, both via different React state) will hit the unique conflict and the second send will silently dedup to the first scope's row. The index does not include `scope_type`/`group_id`/`event_id`. The action handlers `postMessageAction` (`src/lib/chat.ts:469-563`) and `postEventMessageAction` (`src/lib/chat.ts:565+`) both `onConflictDoNothing` and then re-fetch with the right scope filter - so they don't return the wrong message - but the message simply does not get inserted.
- **Severity:** P1 - rare in practice (clientIds are usually `crypto.randomUUID()`) but a real correctness gap if any client reuses ids.
- **Fix sketch:** widen index to `(user_id, scope_type, coalesce(group_id, event_id), client_id)` with `WHERE user_id IS NOT NULL AND client_id IS NOT NULL`.

### P1-6. Demo reset does not delete `event_attendees` or `vote_choices` directly
- **Where:** `src/app/api/demo/reset/route.ts:119-151`
- **Symptom:** The transaction deletes `messages, notifications, votes, event_invites, events, group_members, groups, availability_responses, prompts, venues, achievements, profile_photos, user_sports, users, demo_runs` in that order. Cascade chains *should* sweep `event_attendees` (FK to events with ON DELETE CASCADE per `schema.ts:252-257`), `event_venue_candidates` (FK to events ON DELETE CASCADE per `schema.ts:344-349`), and `vote_choices` (FK to votes ON DELETE CASCADE per `schema.ts:387-389`). However:
  - `event_attendees` and `event_venue_candidates` have NO `demoRunId` column themselves and are NOT in the explicit delete list.
  - If a non-demo event ever ends up with a demo-attendee row (e.g. test pollution), the demo reset will not clean it up.
  - The reliance on cascade is correct per spec line 362 ("reachable only through a marked parent with ON DELETE CASCADE"), so this is technically DONE - flagging because the prior audit warned about it and the explicit listing pattern would be safer.
- **Severity:** P1-low (cascade saves it today, but it's brittle).

## P2 - hardening

### P2-1. AI cache TTL is in the JSON payload, not a DB column - no eviction is possible in SQL
- **Where:** `src/lib/ai/cache.ts:7-11, 49-53`, schema `src/db/schema.ts:482-486`
- **Symptom:** `outputJson` shape is `{ output, model, expiresAt }` where `expiresAt: number` is an epoch ms. Eviction happens lazily at READ time (`src/lib/ai/cache.ts:40`). There is no `expires_at timestamptz` column, so no cron job, no `DELETE FROM ai_cache WHERE expires_at < now()`, no Drizzle index on it. The table grows unbounded until manual `TRUNCATE`. For a hackathon this is fine; for "production ready" (per AGENTS.md) it isn't.
- **Severity:** P2.
- **Fix sketch:** add `expiresAt: timestamp("expires_at", { withTimezone: true })` column; on insert set both the JSON payload AND the column; add a `CREATE INDEX ai_cache_expires_at_idx ON ai_cache (expires_at)`.

### P2-2. `getUserGroupsList` works fine, but `groups/page.tsx` already has a clean batched call - the prior audit's "modified +25/-71" was cleanup not a new risk
- **Where:** `src/app/[locale]/groups/page.tsx:34-37`, `src/lib/groups.ts:32-129`
- **Symptom:** `getUserGroupsList` correctly uses `inArray(groupMembers.groupId, groupIds)` (line 74) for a single batched member fetch. No N+1. Verified against the diff - the page just shed unused state. Listing here as **NOT a finding** so the next auditor doesn't re-flag it.

### P2-3. `getUserEventsList` is well-batched
- **Where:** `src/lib/events.ts:372-544`
- **Symptom:** Verified: 4 SELECTs total, each batched with `inArray`, then assembled in JS. Listing here as **NOT a finding**.

### P2-4. `recordAuthFailure` table has no cleanup of stale rate-limit buckets
- **Where:** `src/db/schema.ts:470-480`, `src/lib/auth-rate-limit.ts:130-147`
- **Symptom:** `auth_rate_limits` rows are `INSERT ... ON CONFLICT DO UPDATE` with rolling window resets. Buckets that are never hit again sit forever. With per-IP, per-username, per-event-id buckets this can grow (especially the chat-send `(user_id, event_id)` combo). No demo marker, no cron sweep.
- **Severity:** P2 - hackathon scale is fine; `DELETE FROM auth_rate_limits WHERE window_started_at < now() - interval '7 days'` would close it.

### P2-5. `events.created_by_user_id` is `set null` on user delete (spec wanted notNull)
- **Where:** `src/db/schema.ts:237-239` vs spec `docs/specs/02-data-model.md:217`
- **Symptom:** Schema is more lenient than spec, which is GDPR-friendly. `votes.created_by_user_id` (`schema.ts:372-374`) and `groups.captain_user_id` (`schema.ts:175-177`) likewise made nullable + `set null`. All three drift from the spec but in a defensible direction. **Reconcile by amending the spec.**

### P2-6. `event_attendees` lacks `responded_at`; status default `'going'` not `'invited'`
- **Where:** `src/db/schema.ts:249-265` vs spec `docs/specs/02-data-model.md:294-295`
- **Symptom:** The spec's RSVP flow (invited -> going|maybe|declined) cannot record WHEN someone responded - only when the row was created. Most rows are created already-going (e.g. `src/lib/events.ts:272-279`), so the column is effectively `created_at`. If RSVP changes ship, you lose the audit trail.

### P2-7. `users.skill_level` is auto-derived from per-sport averages but stored as ground truth
- **Where:** `src/lib/onboarding.ts:99-102` writes `skillLevel = round(avg(sports[].level))` on every `setUserSportsAction`.
- **Symptom:** `users.skill_level` is a denormalized cache of `user_sports.level`. There is no trigger or contract enforcing that they stay in sync; if any other code path UPDATEs `user_sports` without going through this action, `users.skill_level` drifts stale. Matching reads `users.skill_level` (`src/lib/matching.ts:112`) and falls back to the avg only when no `user_sports` exist (`src/lib/matching.ts:158-164`) - so a stale `users.skill_level` will score wrong.
- **Severity:** P2 - low risk today (only one write site) but a footgun for the next contributor.

### P2-8. Numeric lat/lng stored as `decimal({precision:9, scale:6})` - but read with `Number(string)`
- **Where:** schema `src/db/schema.ts:39-40, 172, 184, 324, 325`; reads at `src/lib/profile-public.ts:184-187`, `src/lib/matching.ts:91-92`, etc.
- **Symptom:** Drizzle returns `decimal` columns as strings (`row.homeLat: string`). Code consistently re-parses with `Number(...)` and checks `Number.isFinite`. This works, but every distance calc allocates strings and re-parses. Small perf P2; correctness is fine.

### P2-9. `groups.status` default is `'active'`, spec says `'forming'`
- **Where:** `src/db/schema.ts:174` vs spec `docs/specs/02-data-model.md:184`
- **Symptom:** Schema bypasses the `forming` state entirely. `formDeterministicGroups` creates groups straight in `active` (`src/lib/matching.ts:192-198`). FormationTimeline UI is hardcoded placeholder per the 14:32 audit, so `forming` would be unreachable today anyway. Reconcile spec or restore the state machine.

### P2-10. `votes.topic` shrunk to `varchar(40)` from spec's 200
- **Where:** `src/db/schema.ts:370` vs spec line 302.
- **Symptom:** Probably fine for the demo's "venue" / "time" topics, but if the topic ever holds prompt-style sentences it will silently truncate (Postgres throws on overflow, so actually it'll error - not silently corrupt).

## P3 - cosmetic / spec drift

### P3-1. Schema lives in single `src/db/schema.ts` not `src/db/schema/*.ts`
- **Where:** `src/db/`
- **Symptom:** The audit prompt referred to `src/db/schema/*.ts` and `find . -name schema` returned nothing inside `src/db/`. `src/db/schema.ts` (486 lines) is one file. No functional issue; the prompt's wording was based on the spec's intent.

### P3-2. `package.json` start script does NOT run migrations - but Railway does (commit 35b0919 worked)
- **Where:** `package.json:12` (`"start": "node scripts/prepare-standalone.mjs && node .next/standalone/server.js"`); `railway.toml:6` (`preDeployCommand = "node scripts/migrate.mjs"`); `Dockerfile:24-26` (copies `drizzle/` and `scripts/migrate.mjs` + scripts/node_modules into the runner image).
- **Symptom:** Migrations ARE run on Railway via `[deploy] preDeployCommand` (the correct hook - it runs before the new replica starts traffic). The 14:32 audit's "Phase 0 spec drift" on Dockerfile-vs-NIXPACKS is unchanged but unrelated. **`pnpm start` locally will NOT migrate** - only deploy does. If a contributor runs `pnpm start` against a fresh DB they'll hit a runtime error. Worth a README line.

### P3-3. Spec was rewritten to drop the `ai_cache` demo-ownership requirement (current diff `docs/specs/02-data-model.md` +6/-6)
- **Where:** `docs/specs/02-data-model.md:362, 364-385`
- **Diff summary:**
  - Removed from line 362: "`ai_cache`" from the list of tables that must carry `demoRunId`, and the trailing sentence "Non-FK caches such as `ai_cache` need `demoRunId` or a `demo:<runId>:` key prefix. Demo reset must never delete rows without that marker or marked-parent cascade."
  - Renamed §2.1 from "AI cache (demo safety)" to "AI cache (runtime only)".
  - Removed seed-time pre-bake language; rule now reads "Demo seed must not populate AI cache rows."
  - Removed the bullet "Demo seed populates fixed `input_hash` rows ..."
- **Implication:** The 14:32 audit's "ai_cache lacks demo-ownership marker" is now **resolved by spec amendment**, not by code change. The schema (`src/db/schema.ts:482-486`) is now spec-aligned. This is a defensible direction (AI cache is real Groq output, not seed proof) but worth noting that the demo run can still leak cache rows across runs - which the new spec text acknowledges and accepts.

### P3-4. Three spec tables still missing in schema (`push_subscriptions`, `thread_reads`, `strava_accounts`)
- **Where:** spec lines 145-152, 271-289, 316-324; not in `src/db/schema.ts`
- **Symptom:** All three correspond to features that AGENTS.md classifies as stretch (Web Push, Strava) or that aren't built yet (chat read-state). Until they ship, the schema gap is fine. Recommend marking them as "deferred" in `02-data-model.md` to remove the drift signal - or add empty-table migrations + skill-test coverage.

### P3-5. `event_invites` table is in schema but not in spec
- **Where:** `src/db/schema.ts:267-295`, migration `drizzle/0008_keen_energizer.sql`
- **Symptom:** Self-consistent and well-indexed (unique on secret_hash, partial unique on active-per-event, partial index on active-per-event). Spec needs a paragraph; not a bug.

### P3-6. `prompts.scope_key` is in schema but not in spec
- **Where:** `src/db/schema.ts:112` + unique index `prompt_scope_date_slot_unique` (line 119), `src/lib/prompt.ts:75-150`
- **Symptom:** Allows multiple isolated prompt scopes (`'prod'` for live users, `'demo:<runId>:...'` for seeded demos). Reasonable; spec needs an addendum.

### P3-7. `seedDemo` idempotence is by "any user with this demoRunId exists" - acceptable but blunt
- **Where:** `scripts/seed-demo.ts:148-167`
- **Symptom:** If a partial seed crashes (e.g. user inserts succeed but venues fail), the next `seedDemo()` call will see `existingByLabel` + `existingUsers.length > 0` and short-circuit (`scripts/seed-demo.ts:166-168`) - leaving a half-seeded demo. There is no "complete demo" marker. The reset endpoint exists, but a crash-then-rerun without manual reset will look "successful" while missing data.
- **Severity:** P3 because it's recoverable via `/api/demo/reset` - just unfriendly.

### P3-8. `messages.userId` for system messages is set to `user.id` of the captain (not NULL)
- **Where:** `src/lib/events.ts:347-354` (`kind: "system"`, `userId: user.id`)
- **Symptom:** The schema allows `userId: null` (FK is `set null` - `src/db/schema.ts:416-418`) and the 14:32 audit's prior partial flagged that the spec's `kind: 'system'` semantics imply server-authored, no user. Currently every "event_proposed" / "system" message is attributed to the captain, which is OK product-wise but means the captain's `(userId, clientId)` slot is consumed by a NULL-clientId row - relevant to P1-5 above.

## What's NOT broken (positive list - keep front-of-house)

- **Foreign keys:** every owning relationship has explicit `onDelete` (cascade for ownership, set null for actor-attribution). Verified across all 17 user-facing tables.
- **Unique constraints:** `users.username` unique (`schema.ts:32`), `availability_responses` unique on `(prompt_id, user_id)` (line 152), `group_members` partial unique on `(prompt_id, user_id) WHERE status in ('invited','confirmed')` (line 209-211), `group_members_one_captain_unique` partial on `(group_id) WHERE role='captain'` (line 212-214) - all spec-aligned and correctly partial.
- **Time / TZ:** all 32 `timestamp(...)` calls in `schema.ts` use `withTimezone: true`. `prompt-window.ts` uses `Intl.DateTimeFormat({ timeZone: 'Europe/Bucharest' })` for window math. Display formatting on `events/page.tsx:55-59` and `groups/[groupId]/page.tsx:108-114` both use `timeZone: "Europe/Bucharest"`.
- **Soft-delete coverage:** `isNull(users.deletedAt)` checked in 14+ call sites (auth, profile-public, prompt, upload, matching, groups, onboarding, leaderboard, settings). No reads bypass the filter.
- **Seed idempotence on happy path:** `seedDemo` short-circuits cleanly if any user for the demoRunId exists; `ensure-seeded.ts:1-39` is the wrapper that the `/demo` route calls.
- **Migration history:** 11 files numbered 0000-0010 in `drizzle/`, journal at `drizzle/meta/_journal.json` shows all 11 entries with monotonically increasing `when` timestamps. No holes. Single destructive op (0003 drops two indexes - both replaced with better ones in the same file).
- **Railway migration hook:** `railway.toml:6` `preDeployCommand = "node scripts/migrate.mjs"` runs `drizzle-orm/postgres-js/migrator` against `migrationsFolder: "drizzle"` before the new replica accepts traffic.
- **Public profile schema discipline:** `src/lib/profile-public.ts:46-54` selects only `id, username, fullName, city, bio, photoUrl, profileVisibility` - never `email, password_hash, recovery_code_hash, home_lat, home_lng, max_distance_km`. URLs are username-keyed (`/u/[username]`) so no UUID enumeration.
- **Match-confirm uses single-statement guard:** `src/lib/match-confirm.ts:34-45` does an UPDATE with a `WHERE EXISTS (SELECT 1 FROM groups ...)` subquery rather than read-then-write - no race window.
- **Matching uses advisory lock:** `src/lib/matching.ts:279` `pg_advisory_xact_lock(hashtext(promptId))` serializes group formation per prompt.
- **Vote write uses ON CONFLICT correctly:** `src/lib/votes.ts:72-84` upserts on `(vote_id, user_id)` PK.
- **Invite secret rotation is transactional:** `src/lib/invites.ts:116-135` revokes the active invite + inserts the replacement in a single transaction.

## Highest-priority fixes (ordered by p/min)

1. **Wrap R2 cleanup around the photo-upload transaction failure path.** ~10 min. Closes P0-1.
2. **Add `events.venue_id` FK column + migration.** ~10 min. Unblocks the auto-event flow (which is dead code anyway, per the 14:32 audit, but this is cheap).
3. **Add `votes.options text[] NOT NULL` and `votes.closes_at timestamptz`.** ~10 min. Unblocks vote topics other than venue.
4. **Replace the matching N+1 (P1-3) with a single CASE-WHEN UPDATE.** ~15 min.
5. **`Promise.all` the 4 SELECTs in `getGroupAction`.** ~5 min, ~200ms saved per group page load.
6. **Tighten `messages_client_unique` to include scope and add NOT NULL guard.** Migration only. ~5 min.

## Lower-priority hardening

- Add `expires_at timestamptz` column to `ai_cache` + an eviction cron.
- Add `responded_at` to `event_attendees`.
- Reconcile spec ↔ schema drift on `groups.status` default, `event_attendees.status` default, `votes.topic` length, `created_by_user_id` nullability across `events`/`votes`.
- Mark `push_subscriptions`, `thread_reads`, `strava_accounts` as "deferred" in spec to remove the drift signal.
- Add a "demo seeding completed" marker (`demo_runs.completedAt`) so partial seeds can be detected and re-run.
- Add a periodic sweep for stale `auth_rate_limits` rows (>7 days).
