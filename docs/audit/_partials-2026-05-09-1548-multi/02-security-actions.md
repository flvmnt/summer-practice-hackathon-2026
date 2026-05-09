# 02 - Server-Action & API-Route Security Audit

Scope: every `"use server"` module in `src/lib/*.ts` plus `src/app/[locale]/groups/[groupId]/page.tsx` (inline actions), and every route handler under `src/app/api/**` and `src/app/[locale]/demo/**`. Auth implementation itself (session, bcrypt, recovery codes, rate-limit primitives) is owned by another agent and only inspected as a dependency.

Layered on top of `docs/audit/audit-2026-05-09-1432-full.md`. Findings here are NEW; the previous audit's "library built / UI unwired" line items are not repeated.

---

## TL;DR

The chat, vote, RSVP, invite, upload, photo-extract, notification, settings, onboarding, manual-event, and ICS surfaces are all auth- and ownership-checked, with proper zod validation and (for the auth-adjacent ones) DB-backed rate limiting. Magic-byte sniffing, EXIF strip, UUID-namespaced object keys, and `onConflictDoNothing` on `(userId, clientId)` for chat are all implemented correctly.

The serious problem is structural: **`"use server"` is applied at the file level in `src/lib/events.ts`, `src/lib/groups.ts`, `src/lib/profile-public.ts`, `src/lib/leaderboard.ts`, `src/lib/prompt.ts`, and `src/lib/matching.ts`**, and several exports in those files **take a `userId` / `viewerId` / `targetId` / `promptId` parameter and do not re-derive it from the session**. Every one of those exports is reachable from the browser as a callable server action. The result is a cluster of P0 IDOR / unauth-reachable mutations:

- `getUserEventsList(victimId, filter)` leaks any victim's calendar.
- `getCaptainGroups(victimId)` leaks the groups any victim captains.
- `getUserGroupsList(victimId)` leaks group memberships AND full names of teammates.
- `getCompatibilityForViewer(any, any)` leaks AI compatibility (sports, skill, distance, reason) for any pair.
- `formGroupsForPromptAction({ promptId })` runs the matching transaction with no auth check, callable by anyone (or unauth) for any prompt.
- `getOrCreateActivePromptAction({ demoRunId })` mints / reads prompts for arbitrary demo runs, no auth.

In addition: `canMutateDemoEndpoint` treats a missing `Origin` header as same-origin, so non-browser POSTs (curl / server-to-server) bypass the CSRF gate on `/api/demo/seed` and `/api/demo/reset` whenever `ALLOW_DEMO_MODE=true`. A handful of expensive per-user actions (AI bio extract, AI photo extract, vote cast, RSVP, manual event create, prompt response → matching) have no rate-limit bucket.

Severity floor for the IDOR cluster is P0 because the attack is a single anonymous `fetch()` call, and the leak includes other users' real names, calendars, and approximate movement patterns.

---

## Findings

### P0-1 - IDOR cluster: server-action exports take userId/promptId from caller

`"use server"` is a module-level directive (Next 15 / React server actions). Every exported async function in such a module is callable from any client by sending a `Next-Action` POST with a forged payload. A cookie is required only for actions that themselves call `getCurrentUser()`. The functions below take an arbitrary id parameter and never validate it against the session.

| Action | File:line | Param | Leak |
|---|---|---|---|
| `getUserEventsList(userId, filter)` | `src/lib/events.ts:372` | `userId` | victim's full event calendar (titles, sport, time, venue, RSVP) |
| `getCaptainGroups(userId)` | `src/lib/events.ts:546` | `userId` | which groups any user captains (id, sport, city, size) |
| `getUserGroupsList(userId)` | `src/lib/groups.ts:32` | `userId` | victim's group list + every teammate's `userId` and `fullName` |
| `getCompatibilityForViewer(viewerId, targetId)` | `src/lib/profile-public.ts:170` | `viewerId, targetId` | AI/cache compatibility for any pair (sharedSports, skillFit, proximityFit, distanceKm, reason). Also enumerates which users have completed onboarding (returns `null` otherwise). |
| `getPublicUserByUsername(username)` | `src/lib/profile-public.ts:38` | `username` | intentionally public, but combined with the row above lets you sweep usernames -> userIds -> compatibility data |
| `getOrCreateActivePromptAction({ demoRunId })` | `src/lib/prompt.ts:69` | `demoRunId` | unauthenticated; can mint or fetch the prompt id for any demo run; gives the seed for the next finding |
| `formGroupsForPromptAction({ promptId })` | `src/lib/matching.ts:265` | `promptId` | unauthenticated; runs full matching transaction (groups inserted, achievements awarded, advisory lock taken) for any prompt id |

Repro shape (any browser, no creds needed for the matching/prompt rows):

```js
fetch("/", {
  method: "POST",
  headers: {
    "Next-Action": "<server-action-id>", // visible in DevTools network for any logged-out page that imports the module
    "Content-Type": "application/json",
  },
  body: JSON.stringify(["<arbitrary-uuid>", "all"]),
});
```

The current page imports keep most of these reachable: `events.ts` is imported by `/[locale]/calendar`, `/[locale]/events`, `/[locale]/events/new`; `profile-public.ts` is imported by `/[locale]/u/[username]`; `groups.ts` is imported by `/[locale]/groups`; `matching.ts` and `prompt.ts` are imported by `/[locale]/today`. Each of those imports turns the file's exports into callable actions for that page bundle.

Fix shape: either move read-only data fetchers out of `"use server"` modules into plain `import "server-only"` modules and call them from server components only, or add `const me = await getCurrentUser(); if (!me || me.id !== userId) return ...;` (or drop the param entirely and source from session) at the top of each.

### P0-2 - `getCompatibilityForViewer` lets anyone score arbitrary pairs and warm AI cache

`src/lib/profile-public.ts:170-224`. No auth check. `viewerId`/`targetId` are passed straight to `loadCompatProfile` and `scoreCompatibility`. Two consequences:

1. **Disclosure** of skill, sport overlap, distance bucket, AI-written `reason`, and `source: ai|fallback` for any pair of opted-in users.
2. **AI cache poisoning / cost amplification.** `scoreCompatibility` calls `getOrCompute` against `ai_cache`. An attacker can iterate over `(viewerId, targetId)` permutations to (a) fan out Groq calls if the cache is cold, (b) detect via timing whether a pair has been computed already.

Fix: require `getCurrentUser().id === viewerId`, OR drop `viewerId` and source it from session.

### P1-1 - Demo-mutation CSRF gate treats missing Origin as same-origin

`src/lib/demo/guard.ts:33-49`:

```ts
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;          // <-- accepts no-Origin requests
  }
  ...
}

export async function canMutateDemoEndpoint(request: Request) {
  const env = getServerEnv();
  return env.ALLOW_DEMO_MODE && isSameOrigin(request);
}
```

`/api/demo/seed/route.ts:27` and `/api/demo/reset/route.ts:46` both gate on this. In production demo (where `ALLOW_DEMO_MODE=true` and `ALLOW_DEMO_SEED=true` per `AGENTS.md` "Judge Mode" guidance), any `curl -X POST https://<host>/api/demo/reset?demoRunId=<uuid>` succeeds because `curl` does not send `Origin`. The attacker still needs to know or guess the active `demoRunId`, but `/api/demo/scoring-status` (gated only by `DEMO_MODE_SECRET`, not by Origin) and the public `/[locale]/demo` page leak it.

Worse: `/api/demo/reset/route.ts:91-94` accepts `demoRunId` from query string OR `x-demo-run-id` header without validating ownership. Once `ALLOW_DEMO_SEED=true` (the only state in which reset is reachable) any caller can wipe any run id they can name.

Fix shape: `if (!origin) return false;` in `isSameOrigin`, AND validate that `requestedDemoRunId` is the currently-active label-bound run, not arbitrary UUIDs.

### P1-2 - `formGroupsForPromptAction` is an unauthenticated, expensive server action

`src/lib/matching.ts:265-297`. Public-by-default server action. No `getCurrentUser()` call. It:

- Acquires `pg_advisory_xact_lock(hashtext(promptId))` (DoS vector if hammered).
- Reads every `availability_response` row for the prompt.
- Inserts new `groups`, `group_members`, `achievements` rows.
- Updates every candidate's `last_match_attempt_at` and `match_failure_reason`.

Anyone (logged-in or not) can invoke it for any `promptId` they obtain via `getOrCreateActivePromptAction` (also unauth) -> can repeatedly trigger matching, churn the advisory lock, and influence `last_match_attempt_at` for arbitrary users.

Fix: add `const me = await getCurrentUser(); if (!me) return actionError("unauthorized");` and rate-limit per user.

### P1-3 - `respondToPromptAction` triggers matching with no rate limit

`src/lib/prompt.ts:155-251`. Auth-checked (good), but on every call it invokes `formGroupsForPromptAction` which runs the full matching transaction. A logged-in user toggling yes/no in a tight loop is a cheap DoS. No bucket exists in `AUTH_RATE_LIMIT_POLICIES` (`src/lib/auth-rate-limit.ts:23-31`) for prompt response or matching. Combine with P1-2 above for compounded effect.

Fix: add `prompt:respond:user` and/or `match:form:prompt` buckets to the rate-limit policy table.

### P2-1 - Demo reset accepts arbitrary `demoRunId` without binding to active label

`src/app/api/demo/reset/route.ts:91-117`. Reads `demoRunId` from `?demoRunId=` or `x-demo-run-id` and proceeds to delete every child row tagged with that UUID. There is no check that the requested id matches the currently-seeded `DEMO_RUN_LABEL`. In a multi-run setup (judge mode + dev seed at the same time) one judge can wipe the other's data given the UUID. With P1-1, this is exploitable from any host.

Fix: only honor `demoRunId` if it matches the row currently bound to `DEMO_RUN_LABEL`, or drop the parameter entirely.

### P2-2 - AI server actions have no rate-limit bucket

`src/lib/ai-actions.ts:16` `extractSportsForCurrentUserAction`, `src/lib/ai-actions.ts:35` `extractSportsFromBioTextAction`, `src/lib/photo-actions.ts:20` `extractSportsFromPhotoAction`. All auth-check, none rate-limit. Each call hits Groq if cache misses (`src/lib/ai/bio-extract.ts`, `src/lib/ai/photo-extract.ts`). A logged-in user can spin Groq cost up by varying the bio / image bytes (cache key includes the bytes hash, so distinct payloads are distinct cache rows).

Fix: add `ai:extract:user` and `ai:photo:user` buckets analogous to `chatUserGroup` and gate the actions.

### P2-3 - Vote cast and RSVP not rate-limited

`src/lib/votes.ts:18-87` (`castVenueVoteAction`) and `src/lib/events.ts:581-610` (`updateEventRsvpAction`). Both auth- and ownership-checked, both DB-idempotent (vote uses `onConflictDoUpdate` on `(voteId, userId)`; RSVP is a single row update). However a logged-in user with a stake in the event can hammer either to spike DB write load and inflate notifications when those are wired (`audit-2026-05-09-1432-full.md` §1 Phase 3 lists notifications as wired-but-bell-unmounted). Not exploitable for data, but noisy.

Fix: add `vote:cast:user_event` and `rsvp:update:user_event` buckets at chat-tier limits (e.g. 20/min).

### P2-4 - `createManualEventAction` not rate-limited; whenAt unbounded

`src/lib/manual-event-actions.ts:63-169`. Auth-checked. On every call it creates a `groups` row, a `group_members` row (captain), an `events` row, and a system `messages` row in a transaction. No rate limit -> a logged-in user can spam group+event rows. `whenAt` is parsed via `new Date(parsed.data.whenAt)` and only validated as not-NaN; events can be backdated decades or scheduled centuries out.

Fix: add `event:create:user` bucket and constrain `whenAt` to `now - 1d .. now + 1y`.

### P2-5 - `messages.body` zod cap is good, no profanity / link guard

Cosmetic: `src/lib/contracts/chat.ts:5,15` cap message body at 1000 chars. Adequate. Note for the record: there is no anti-spam content filter, no URL whitelist, and no markdown sanitization. Hackathon-acceptable; flagged so the audit chain doesn't miss it.

### P3-1 - `sql.raw` template interpolation in count helpers

`src/app/api/demo/scoring-status/route.ts:23` and `src/app/[locale]/demo/page.tsx:31`:

```ts
sql.raw(`select count(*)::int as count from ${table}`)
```

`table` is hardcoded in both call sites (`"users" | "groups" | "events" | "ai_cache"`), so currently safe. Footgun pattern: future refactor that takes `table` from a request param becomes instant SQLi. Replace with a `Record<TableName, () => Promise<number>>` map of `db.select({ count: sql<number>\`count(*)::int\` }).from(<schema-table>)` calls.

### P3-2 - Rate-limit bucket hashing truncates to 32 hex chars

`src/lib/auth-rate-limit.ts:37-45`. Uses `sha256` then slices to 32 hex chars (128 bits of entropy retained). Collision probability across realistic bucket counts is negligible. Noting only because it's the kind of thing a reviewer asks about.

### P3-3 - Invite secret comparison via DB equality

`src/lib/invites.ts:206`. `eq(eventInvites.secretHash, hashSecret(parsed.secret))`. Postgres bytea/text equality is not constant-time, but since `secret` is 32 random bytes (256 bits) and the comparison is on its sha256 hash, timing-side-channel attacks are infeasible. Fine.

---

## Diff notes (changes since `audit-2026-05-09-1432-full.md`)

`git diff HEAD -- src/app src/lib` covers ~1.3k lines across 18 files. The security-relevant ones:

- `src/app/api/events/[eventId]/ics/route.ts` - the diff vs HEAD is empty in the working tree. Last commit touching it was `250d822 fix(i18n): close locale leaks across core flows` which only changed the `localeSchema.catch("ro").parse(...)` fallback to use `user.locale`. No regression in auth/attendee gate. Verified clean.
- `src/lib/profile-public.ts` and the `/u/[username]` page were modified - `getCompatibilityForViewer` was added or strengthened. Confirmed it lacks the session check (P0-2).
- `src/lib/auth.ts` - touched, but auth surface is owned by another agent.
- `src/components/group/GroupChatForm.tsx` - the `chatUserGroupBucket` bucket already exists and is wired into `postMessageAction` (`src/lib/chat.ts:482-488`); no chat-send bypass introduced.

## Commit-history notes

Walking the commit references the brief called out:

- `6eaf47f feat: add event creation and event chat` - introduced `createGroupEventAction`, `postMessageAction`, `postEventMessageAction`. All three are auth- AND membership-gated and validate via zod. Chat send is rate-limited (`AUTH_RATE_LIMIT_POLICIES.chatUserGroup`, 20/min per user/scope). Verified clean for those three.
- `4feee63 feat(uploads): add R2 client and profile-photo upload action` and `0d6f3b1 feat(uploads): delete replaced R2 object on profile-photo upload` - upload action is auth-checked, magic-byte-sniffed (`src/lib/uploads.ts:20-59`), 8 MiB capped (`MAX_BYTES`), re-encoded via sharp to 512x512 webp with EXIF stripped (`src/lib/uploads.ts:91-97`), keyed `profile/{userId}/{uuid}.webp` (no traversal, no overwrite, replaced object best-effort deleted). Verified clean.
- `80ef6a0 feat(notifications): add table, lib, and server actions` - the only exposed actions are `fetchNotificationsAction`, `markNotificationReadAction`, `markAllNotificationsReadAction` (all in `src/lib/notification-actions.ts`). All three derive `userId` from session; both update queries scope by `eq(notifications.userId, user.id)`. **There is no public action that inserts a notification.** Verified that user A cannot create a notification for user B.
- `d1945e7 feat: persist event RSVP state` - `updateEventRsvpAction` (`src/lib/events.ts:581-610`) updates only the row matching `(eventId, sessionUserId)`. RSVP can only flip your own. Verified clean for IDOR; flagged P2-3 for missing rate limit.
- `c611e17 feat: add venue candidates and voting` - `castVenueVoteAction` (`src/lib/votes.ts:18-87`) requires `eventAttendees.status in (going, maybe)`, requires an open vote, validates `optionIdx` against existing candidates, and writes via `onConflictDoUpdate` on `(voteId, userId)`. The schema enforces a primary key on `(voteId, userId)` (`src/db/schema.ts:397`). **One vote per user is enforced at the DB layer**, not just app layer. Verified clean for the question asked.

## Verified clean (positive findings)

- `src/lib/chat.ts:469-659` - `postMessageAction` and `postEventMessageAction`. Auth + membership + zod + rate limit + `onConflictDoNothing` on `(userId, clientId)` for idempotency. Solid.
- `src/lib/notification-actions.ts:19-67` - notifications inbox actions, scoped by session userId.
- `src/lib/notifications.ts:70-101` - `markNotificationRead` and `markAllNotificationsRead` both filter by `eq(notifications.userId, userId)` AND `isNull(notifications.readAt)`.
- `src/lib/votes.ts:18-87` - vote cast.
- `src/lib/match-confirm-actions.ts` + `src/lib/match-confirm.ts:28-85` - confirm/decline use a single conditional `UPDATE` with row-level guard, no read-then-write race.
- `src/lib/upload-actions.ts:22-149` - profile photo upload action.
- `src/lib/uploads.ts:20-142` - magic-byte sniff, 8 MiB cap, sharp re-encode + EXIF strip, UUID-namespaced keys, replaced-object delete.
- `src/lib/invites.ts:89-166` - create/revoke invite, both gated on `requireEventOwner` (caller must be `events.createdByUserId`); `getEventInvitePreview` is rate-limited (`invitePreviewIp`, 60/min) and constant-secret-time-equivalent via random 256-bit token.
- `src/lib/auth.ts` (login/signup/recover/logout) - all rate-limited on IP+username and user buckets, with timing-safe `verifyPassword` / `verifyRecoveryCode` (delegated to bcryptjs). Auth specifics owned by another agent; no surface defects observed from this audit.
- `src/lib/onboarding.ts` and `src/lib/settings-actions.ts` - all writes scoped to `session.userId`, all inputs zod-validated.
- `src/lib/manual-event-actions.ts:63-169` - creates the auto-group + event in a transaction with caller as captain. Validation OK; flagged P2-4 for missing rate-limit + `whenAt` bound.
- `src/lib/venues.ts:65-165` - public action, lat/lng/radius bounded by zod, sport enum-validated, distance computed in Node (no SQL injection).
- `src/app/api/events/[eventId]/ics/route.ts:86-197` - param uuid-validated, requires session, requires `eventAttendees` row for caller before serving. Sets `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, attachment disposition. Locale parsed from `?locale=` is enum-restricted with safe default. Verified clean.
- `src/app/api/health/route.ts` - no user input, returns DB-backed health.
- `src/app/[locale]/demo/scripted/route.ts` and `.../demo/step/[step]/route.ts` - 404 unless `ALLOW_DEMO_MODE`; redirects only to internal paths constructed from `safeLocale + '/'-prefixed strings`. No open redirect.
- No `fetch(userInput)` anywhere. The only outbound fetches are `groq.ts` (env-controlled `GROQ_BASE_URL`, default `api.groq.com`) and `weather.ts` (`https://api.open-meteo.com/v1/forecast`, lat/lng numerically validated). No SSRF surface.
- No `redirect(searchParams.get(...))` patterns. All redirects are constructed server-side from enum-restricted values.
- No `db.insert(table).values(req.body)` mass-assignment patterns. Every insert names columns explicitly.
- No raw SQL with user-controlled identifiers. The two `sql.raw(...)` sites use a hardcoded table allowlist (P3-1 documents the pattern risk).

## What this partial does not cover

- Auth crypto, session integrity, recovery-code threat model - owned by another agent.
- Database schema-level constraints other than the few touched above (votes PK, profile_photos uniqueness implied by unique key).
- Front-end CSP / cookie flags. `session.ts` sets `httpOnly`, `secure` in prod, `sameSite: lax`, 30-day max-age - looks correct.
- Realtime / SSE - not built (per `audit-2026-05-09-1432-full.md` §2.B).
