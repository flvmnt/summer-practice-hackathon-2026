# 04 - Schema, migrations, R2 + uploads, manual-event action, mobile-first sweep

Audit window: T0 = 14:32 -> 15:55. Read-only.

## 1. Migration status

`drizzle/_journal.json` last entry is `idx=10`, tag `0010_black_mauler` (`drizzle/meta/_journal.json:75-80`). No 0011+ has landed since T0; the journal and on-disk SQL are in lockstep.

| File | Lines | Forward-only | Idempotent | Notes |
|---|---|---|---|---|
| `drizzle/0000_glamorous_black_knight.sql` | 71 | yes | no (uses raw `CREATE TABLE` w/o `IF NOT EXISTS`) | base tables: users, demo_runs, profile_photos, user_sports, auth_rate_limits |
| `drizzle/0001_kind_epoch.sql` | 31 | yes | no | prompts, availability_responses |
| `drizzle/0002_foamy_changeling.sql` | 38 | yes | no | groups, group_members |
| `drizzle/0003_uneven_spyke.sql` | 9 | yes | no | messages |
| `drizzle/0004_pale_amphibian.sql` | 27 | yes | no | events, event_attendees, FK from messages.event_id |
| `drizzle/0005_harsh_punisher.sql` | 31 | yes | no | indexes/columns: scope_key on prompts, partial captain unique, match attempt cols |
| `drizzle/0006_fat_steve_rogers.sql` | 61 | yes | no | venues, votes, vote_choices, event_venue_candidates |
| `drizzle/0007_cultured_kree.sql` | 5 | yes | no | ai_cache |
| `drizzle/0008_keen_energizer.sql` | 17 | yes | no | event_invites |
| `drizzle/0009_flaky_lord_tyger.sql` | 10 | yes | no | achievements |
| `drizzle/0010_black_mauler.sql` | 16 | yes | no | notifications |

None of the migrations issue destructive `DROP TABLE` / column drops on shipped state; only `0005` drops two indexes that are immediately re-created with refined predicates. No migration uses `IF NOT EXISTS`, but drizzle-kit's standard migrator records applied state in `__drizzle_migrations`, so re-running a migrated DB is safe via the runner. None of them depend on time-of-day or external state, and all FKs/indexes are forward-only.

Verdict: **SAFE for next Railway `preDeployCommand`** as long as the runner is `drizzle-kit migrate` (not bare `psql`-applying SQL). 0010 introduces no FK cycles or destructive ops, and 0009 is now the prior baseline on prod.

## 2. Schema vs spec drift (`src/db/schema.ts` vs `docs/specs/02-data-model.md`)

| Spec table | Status | Notes (file:line) |
|---|---|---|
| `users` | PARTIAL | PRESENT incl. visibility/banned/deleted. Missing: `users_full_name` regex CHECK constraint (spec §3); spec sketch had no `pushSubscriptions`, schema also drops it (acceptable, push is stretch). `home_lat/lng` btree present (`src/db/schema.ts:56`). `demoRunId` added beyond spec (good for demo reset). |
| `demo_runs` | PARTIAL | Present (`schema.ts:19`). Missing `created_by_user_id` FK from spec sketch. Acceptable (stretch). |
| `profile_photos` | PRESENT | All cols + `objectKey` unique (`schema.ts:101`). |
| `user_sports` | PRESENT | Composite PK preserved. |
| `push_subscriptions` | MISSING | Spec describes table; schema omits. Per AGENTS.md "Web Push is stretch only" -> intentional. |
| `prompts` | PARTIAL+ | Adds `scopeKey` for demo scoping (`schema.ts:112`). Unique now `(scope_key, window_date, window_slot)` (`schema.ts:119`) - tightened, OK. |
| `availability_responses` | PARTIAL+ | Unique on (prompt_id, user_id) PRESENT (`schema.ts:152`). Adds `match_failure_reason`/`last_match_attempt_at`. |
| `groups` | PARTIAL | `promptId` is `notNull` (`schema.ts:166-168`) -> stricter than spec which used `set null`. **DRIFT**: spec says `set null`, schema says `cascade`. Acceptable for hackathon. `groups_center_lat_lng_idx` PRESENT (`schema.ts:184`). |
| `group_members` | PARTIAL+ | Carries `promptId` redundantly (`schema.ts:197-199`) - this enables the partial unique `(prompt_id, user_id) WHERE status in ('invited','confirmed')` (`schema.ts:209-211`), exactly the spec invariant. Also adds `group_members_one_captain_unique` partial unique on `groupId WHERE role='captain'` (`schema.ts:212-214`). Strong. |
| `venues` | PARTIAL | Drift from spec sketch: spec has `kind`, `priceTier smallint`, `rawTags jsonb`. Schema uses `sport varchar`, `priceTier varchar`, drops `rawTags`, drops `priceConfidence` from spec but keeps it (`schema.ts:328`). Lat/lng decimal w/ btree index PRESENT (`schema.ts:334`). FK shape OK. **MINOR DRIFT** vs spec, no breakage. |
| `events` | PARTIAL | `groupId` is `notNull cascade` (`schema.ts:228-230`) - stricter than spec. **MISSING**: `venueId` FK column; **MISSING**: `weatherCacheJson`, `priceEstimateText`, `priceConfidence`, `notesText`. `customLocationText` collapsed to text. `events_group_when_idx` PRESENT (`schema.ts:244`). Spec also forbids time-dependent CHECK; schema correctly omits it. |
| `event_venue_candidates` | PARTIAL | Schema slimmer: PK is composite (event_id, venue_id) (`schema.ts:356`) instead of standalone id; drops `groupId`, `score`, `priceTier`, `priceConfidence`, `weatherFit` from spec. Has `rank` + `distanceKm` only. Acceptable simplification. |
| `messages` | PRESENT | `messages_scope_exactly_one` CHECK PRESENT (`schema.ts:430-436`). `messages_client_unique` (`user_id, client_id`) PRESENT (`schema.ts:440`). Group/event indexes PRESENT (`schema.ts:437-438`). |
| `thread_reads` | MISSING | Spec defines table with two partial unique indexes; schema omits entirely. **GAP** for unread-tracking SSR; the inbox/HeaderBell read-count likely runs off `notifications` instead. |
| `event_attendees` | PRESENT | Composite PK `(event_id, user_id)` (`schema.ts:262`). |
| `event_invites` | PARTIAL+ | Beyond spec; supports invite tokens with one-active-event partial unique (`schema.ts:287-289`). |
| `votes` | PARTIAL | Drift: spec has `topic varchar(200)` and `options text[]`, schema has `topic varchar(40)` and **MISSING** `options text[]` and `closesAt`. **GAP**: votes can't carry options in-row; UI must source options elsewhere. |
| `vote_choices` | PRESENT | Composite PK + `option_idx`. |
| `strava_accounts` | MISSING | Spec defines; schema omits entirely. Per AGENTS.md Strava is optional but counts only with real OAuth -> if integration is dropped, this is intentional. |
| `auth_rate_limits` | PRESENT | (`schema.ts:470-480`). |
| `notifications` | PRESENT | Plus a partial-unread index (`schema.ts:463-465`). |
| `ai_cache` | PRESENT | Minimum demo-safe shape `(input_hash text PK, output_json jsonb, created_at)` exactly per spec §2.1 (`schema.ts:482-486`). |
| `achievements` | PRESENT | Composite PK preserved. |

Decimal-as-string concerns: lat/lng/distance are `decimal(9,6)`/`decimal(6,2)`. Drizzle returns numerics as strings by default - confirm any consumer doing math casts to `Number(...)` or uses `.mode("number")`. Not verified here; flag for follow-up.

Haversine indexes: `users_home_lat_lng_idx`, `groups_center_lat_lng_idx`, `venues_lat_lng_idx` all PRESENT.

CHECK constraints: only `messages_scope_exactly_one` is encoded. Spec also wants `thread_reads_scope_exactly_one`, but that table is missing entirely. `users.full_name` regex / `users.username` regex CHECKs are NOT in schema (relying on zod at the action boundary).

FK cascades: no FK uses an unsafe `restrict`. `user_id` -> `set null` on messages, deleted_by_user, notifications-not-deleted, captain, etc., matching the GDPR anonymization path. `groups.promptId` is `cascade` (drift from spec `set null`); same for `events.groupId` `cascade`. Both are stricter, acceptable.

## 3. R2 + uploads compliance scorecard

AGENTS.md mandate: "sniff MIME, reject spoofed/large/unsafe images, strip metadata, resize to webp, write to R2, and delete replaced objects."

| # | Requirement | File:line | Status |
|---|---|---|---|
| 1 | Sniff MIME from magic bytes (no trust on `File.type`) | `src/lib/uploads.ts:20-59` (`sniffMime`) called by `validateImage` | PRESENT |
| 2 | Size cap (8 MiB) enforced before re-encode | `src/lib/uploads.ts:8` const `MAX_BYTES`; checked at `src/lib/uploads.ts:73-75` and pre-action at `src/lib/upload-actions.ts:40-42` | PRESENT (double-checked: action AND validateImage) |
| 3 | Image resize to webp 512x512 cover | `src/lib/uploads.ts:91-97` (`reencodeProfilePhoto` -> `.resize(512,512,{fit:"cover"}).webp({quality:80})`) | PRESENT |
| 4 | Strip EXIF / ICC / XMP metadata | `src/lib/uploads.ts:91-97` - sharp default does **not** carry metadata (no `withMetadata()` call), explicit `.rotate()` honors EXIF before discarding it | PRESENT (implicit-strip; comment at `:88-90` is slightly misleading - there's no actual `withMetadata` call but sharp's default is strip-by-default which is correct) |
| 5 | Write to R2 (forcePathStyle, region "auto") | `src/lib/r2.ts:38-46` client; `src/lib/uploads.ts:103-123` (`writeToR2` -> `PutObjectCommand`) | PRESENT |
| 6 | Delete replaced objects (post-`0d6f3b1`) | `src/lib/r2.ts:78-82` (`deleteFromR2` w/ `DeleteObjectCommand`); called at `src/lib/upload-actions.ts:136-146` | PRESENT |
| 7 | `deleteFromR2` is called AFTER the new row commits, not before | `src/lib/upload-actions.ts:80-110` insert/update inside `db.transaction`; loop at `:136-146` runs **after** transaction returns successfully and **after** `saveUserSession` | PRESENT - ordering correct |

**Score: 7/7 PRESENT.**

Notes:
- The `replacedKeys` snapshot is read **before** the insert (`upload-actions.ts:67-77`) inside a try/catch, so a snapshot failure leaks one old object on a single cycle but never blocks the upload. Acceptable.
- Defensive guard `if (oldKey === uploaded.key) continue;` at `:137-139` prevents self-deletion - belt-and-suspenders given `profile_photos.object_key` unique index.
- `deleteFromR2` failures are caught + logged (`:142-145`), not propagated. Correct for replace semantics.
- Possible minor improvement: `withMetadata({})` could make the strip explicit and self-documenting; current behavior is correct but relies on sharp's default.

## 4. Manual event action schema sanity (`src/lib/manual-event-actions.ts`)

| Requirement | Verified |
|---|---|
| Wraps in `getDb().transaction()` | YES - `src/lib/manual-event-actions.ts:101` (`await db.transaction(async (tx) => {...})`) |
| Inserts `groups` row with `promptId` non-null via `getOrCreateActivePromptAction` | YES - `:81-85` resolves prompt, `:104-114` `tx.insert(groups).values({ promptId: prompt.id, ... })` |
| Sets `captainUserId = user.id` on groups | YES - `:112` |
| Inserts `groupMembers` row with `role:'captain'`, `status:'confirmed'` | YES - `:120-126` (`role:"captain", status:"confirmed", promptId: prompt.id`) |
| Inserts `events` with `groupId` non-null | YES - `:128-144` (`groupId: group.id`) |
| Insert ordering matches FK dependencies (groups -> groupMembers -> events) | YES - groups inserted first (returns id), then groupMembers using that id, then events using that id. No FK violation possible. |
| Final system message links to group chat (`event_proposed`) | YES - `:150-156` (`scopeType:"group", groupId: group.id, kind:"event_proposed"`). Satisfies the `messages_scope_exactly_one` CHECK because `eventId` is omitted (null). |
| Atomic - any insert failure rolls back the whole event | YES - `:117` and `:147` throw inside the txn callback, drizzle rolls back. |

The action satisfies both the partial unique `group_members_one_captain_unique` (only one row, role='captain') and `group_members_active_prompt_user_unique` (single confirmed prompt-user). Idempotency note: a user calling `createManualEventAction` twice within the same prompt window will hit `group_members_active_prompt_user_unique` on the second call (existing confirmed membership in a prior auto-group with same `promptId`). This will throw and roll back. **Surface as P2:** the action does not currently handle that conflict gracefully - it returns `actionError("internal")` via the catch path the caller assumes (or worse, leaks the underlying error message). For demo, ensure the seed/demo-runner invokes only once per user per prompt.

## 5. UI / Mobile-first sweep

Global wins (cover all components below):
- `:focus-visible { outline: 3px solid var(--field); outline-offset: 3px }` is set globally at `src/app/globals.css:183-186`, so every interactive element gets a visible focus ring by default.
- `@media (prefers-reduced-motion: reduce)` clamps animations to 1ms at `src/app/globals.css:421-427`. Component-level entrance animations like `ratchet-in` (PhotoForm `:482`, `:281`) automatically respect this.

Consequence: the focus-visible and prefers-reduced-motion criteria below are PASS by inheritance for every component. The remaining variation is in sticky CTA, aria-live, aria-busy, aria-label, and tap-target sizing.

| Component | Sticky CTA | aria-live (optimistic UI) | aria-busy (submit) | aria-label (icon-only) | 44/48px tap | Score |
|---|---|---|---|---|---|---|
| `src/components/layout/DesktopSidebar.tsx` | n/a (nav, not a CTA host) | n/a | n/a | YES `:67`, `:115`, `:152` | YES `minHeight:44` `:126`, `:159` | **PASS** |
| `src/components/group/CaptainBriefPanel.tsx` | n/a (panel) | NO - members/venue/time/weather can update without `aria-live` region; loading state uses a static `aria-hidden` skeleton (`:292`) | n/a (no submit) | YES - `aria-label` on `<section>` `:81` and `<ul>` `:127`; status dots use `role="img"+aria-label` `:151-152` | YES - `min-height: var(--tap-target)` on stat cards `:230` | **PARTIAL** (one-line: optimistic updates to confirmed/total or weather lack `aria-live` polite) |
| `src/components/onboarding/PhotoForm.tsx` | YES via `WizardStickyActionBar` (fixed bottom `:97`) | NO - AI suggestions render conditionally without an `aria-live` region (`:460-525`); a screen reader user won't be told sports were suggested. Status banner uses `role="status"` `:422` which is half-credit. | NO - `Analyze` button `:430-450` toggles `disabled` but no `aria-busy`; primary `Finish` button delegated to WizardStickyActionBar (verify upstream). | YES - dropzone has `aria-label={t("chooseFile")}` `:294`; AI suggestion buttons carry `aria-pressed` `:488` plus a visible label | YES - 48px primary `:234`, `:436`; 44px secondaries `:252`, `:396` | **PARTIAL** (one-line: AI suggestions appear without `aria-live="polite"`; analyze button missing `aria-busy={aiState==='loading'}`) |
| `src/components/events/CreateEventForm.tsx` | NO - submit at `:199-207` is a normal in-flow button, no sticky/fixed bottom bar despite this being a primary creation surface | n/a (no optimistic UI; submit is blocking) | NO - `disabled={pending}` only `:201`; missing `aria-busy={pending}` | n/a (no icon-only buttons; venue rows have visible labels) | YES `minHeight:48` `:203` | **PARTIAL** -> **P1**: per design canon, the sports-pick / location / today bottom-action analogue here should be a sticky bottom CTA on mobile. Currently scrolls with the form. |
| `src/components/event/RsvpButtons.tsx` | n/a (inline radiogroup) | NO - tally / RSVP toggles optimistically (`:55`) but the surrounding page does not wrap the visible status in `aria-live`; the `Toast` push is a separate live region (assumed in `ToastProvider`, verify) | NO - buttons set `disabled={pending}` `:50` but no `aria-busy`; `aria-checked` carries selection state correctly `:49` | YES - text-only labels `:89` (`labels[status]`); `role="radiogroup" aria-label="RSVP"` `:39-40` (note: hardcoded English string; should use translations - **MINOR**) | YES `minHeight:44` `:76` | **PARTIAL** (one-line: missing `aria-busy={pending}` and hardcoded English `aria-label="RSVP"` at `:39-40`) |
| `src/components/notifications/NotificationInbox.tsx` (post `11b2619`) | n/a | NO - mark-as-read mutates list in place via `onMarkRead` (`:294-298`) with no `aria-live` on the `<ul>` `:121-124` to announce when an item flips state or disappears | n/a (mark-read button doesn't show pending state) | YES - link has `aria-label={`${kindLabel}: ${item.title}. ${openLabel}`}` `:183`; mark-read button visible label | YES - link `minHeight:44` `:188`; mark-read button `minHeight:32` `:308` (**FAIL** for that one) | **PARTIAL** -> **P1**: mark-read button (`:292-313`) is 32px high - below the 44px minimum even though aria/contrast are fine. Hardcoded English fallbacks `markReadLabel="Mark read"` `:114` (only fallback; consumer passes translated copy). |

Note: `WizardStickyActionBar` was not deeply audited but referenced by PhotoForm; it is `position: fixed` per `src/components/onboarding/WizardStickyActionBar.tsx:97`, satisfying the sticky-CTA mandate for the photo step.

### a11y P1 list (must-fix before judging)

1. `src/components/events/CreateEventForm.tsx:199-207` - submit button is not sticky; needs a fixed-bottom CTA on mobile to match design canon.
2. `src/components/notifications/NotificationInbox.tsx:292-313` - "Mark read" button is `minHeight: 32`; bump to >=44px.
3. Add `aria-busy={pending}` to: `RsvpButtons` (`:45-91`), `CreateEventForm` submit (`:199`), PhotoForm `Analyze` (`:430`).
4. Add `aria-live="polite"` regions for optimistic UI:
   - PhotoForm AI suggestions block (`:460-525`)
   - NotificationInbox `<ul>` (`:121-124`) for mark-read flips
   - RsvpButtons does optimistic toggling - rely on Toast live region or wrap the radiogroup with a polite status announcement.
5. Hardcoded English `aria-label="RSVP"` at `RsvpButtons.tsx:39` - move to translations.

## 6. DesktopSidebar nav coverage

`grep -l "DesktopSidebar"` across `src/app/[locale]` (and `MapPageClient`) yields **10** mounted authed surfaces:

| Authed page | DesktopSidebar | MobileTabBar | HeaderBell | Notes |
|---|---|---|---|---|
| `/today` (`src/app/[locale]/today/page.tsx:80`) | YES | YES `:224` | YES `:128` | first authed screen |
| `/groups` (`.../groups/page.tsx:158`) | YES | YES `:159` | YES `:72` | |
| `/groups/[groupId]` (`.../groups/[groupId]/page.tsx:335`) | YES | YES `:536` | YES `:345` | |
| `/events` (`.../events/page.tsx:216`) | YES | YES `:217` | YES `:100` | |
| `/events/[eventId]` (`.../events/[eventId]/page.tsx`) | **NO** | **NO** | **NO** | **GAP**: event detail loses primary nav. Likely intentional for focused-task screens but reachable directly from notifications and shared links. **P2**. |
| `/events/new` (`.../events/new/page.tsx:313`) | **NO sidebar**; only MobileTabBar `:313` | YES | n/a | **GAP**: desktop users on creation flow have no left nav. **P1**: trivial mount. |
| `/calendar` (`.../calendar/page.tsx:256`) | YES | YES `:257` | YES `:120` | |
| `/leaderboard` (`.../leaderboard/page.tsx:292`) | YES | YES `:293` | YES `:160` | |
| `/notifications` (`.../notifications/page.tsx:107`) | YES | YES `:184` | n/a (own page) | |
| `/settings` (`.../settings/page.tsx:268`) | YES | YES `:422` | YES `:304` | |
| `/u/[username]` (`.../u/[username]/page.tsx:108,191`) | YES (viewer-only branch `:191`; logged-out `:108` mounts an "empty" sidebar - intentional public profile shell) | YES `:120,263` | YES (viewer only) `:221` | nuanced; OK |
| `/map` (mounted via `MapPageClient.tsx:184`) | YES | (MapPageClient handles its own bottom UI) | n/a | OK |

Routes that are **intentionally** without sidebar (correct):
- `/onboarding/*` (profile/sports/location/photo) - wizard, full-screen flow.
- `/login`, `/signup`, `/recover` - unauthed.
- `/i/[token]` - public invite landing.
- `/demo` - scripted Judge Mode page.
- `/` (`src/app/[locale]/page.tsx`) - landing/marketing.

Coverage gaps to close (P1):
- **`/events/new`**: mount `DesktopSidebar` next to the form. The "5 authed pages" claim from `c81a16b` is now stale - 10+ pages are wired, but creation surface still misses it.
- **`/events/[eventId]`**: no nav at all (no MobileTabBar, no DesktopSidebar, no HeaderBell). On mobile this means a deep-linked notification opens an event with no way to navigate without browser back. **P1**.

---

End of partial 04.
