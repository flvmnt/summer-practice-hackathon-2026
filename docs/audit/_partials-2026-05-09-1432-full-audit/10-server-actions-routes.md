# Audit 10 — Server Actions & Route Handlers

Spec: `docs/specs/03-server-actions-and-routes.md`.
Code lives in `src/lib/*.ts` (with `"use server"`) — the spec's `src/server/actions/*` directory does **not** exist; actions are colocated in `src/lib/`. Form-action wrappers live in `src/lib/*-form-actions.ts`.

## Verdict matrix

### Conventions (§1)

| Convention | Verdict | Notes |
|---|---|---|
| Zod validates every action | PARTIAL | Most actions parse with zod. `getMyTodayStateAction`, `formGroupsForPromptAction`, `fetchNotificationsAction`, `markAllNotificationsReadAction`, `extractSportsForCurrentUserAction` take no input. `getOrCreateActivePromptAction` accepts `{ demoRunId? }` without a zod schema (`prompt.ts:69`). `getNearbyVenuesAction` schema lives inline in `venues.ts:28` rather than `lib/contracts/`. |
| Discriminated `{ ok, ... }` result | DONE | `actionOk` / `actionError` in `action-result.ts:14-39` used uniformly, including `fetchNotificationsAction` (different inline shape — see PARTIAL note below). |
| Auth via `getCurrentUser()` for mutations | PARTIAL | Most mutations check `getCurrentUser()` or `getSession()`. **`formGroupsForPromptAction` (`matching.ts:255`) has no auth check** even though it mutates groups/members/achievements; spec says it is admin/cron only. **`getOrCreateActivePromptAction` (`prompt.ts:69`) has no auth check** and inserts a `prompts` row. |
| No throws across boundary | PARTIAL | `auth.ts:148` rethrows non-unique-violation DB errors from `signupAction`. `matching.ts:197` throws on insert-no-row. `events.ts` transaction can throw on Drizzle errors (no try/catch around the outer transaction call). Most other actions catch. |
| `withRateLimit(bucket, action)` helper | MISSING | No such helper. Rate-limit calls are inlined per-action via `checkAuthRateLimit` / `recordAuthFailure`. Functional but inconsistent. |
| ISO 8601 UTC time inputs | DONE | All `whenAt`/timestamp fields use ISO strings or `Date` objects in actions. |
| Error model union (§5) | PARTIAL | Codes used (`unauthorized`, `validation`, `rate_limited`, `not_found`, `conflict`, `internal`) match spec, but extra ad-hoc codes leak: `invalid_credentials`, `invalid_recovery`, `invalid_prompt`, `too_large`, `unsupported_mime`, `upload_failed`, `venues.unavailable` (`prompt.ts:188`, `auth.ts:184,220`, `upload-actions.ts:41,57`, `venues.ts:77`). Spec union does not include these. |

### 2.1 Auth (`src/lib/auth.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `signupAction` | DONE | `src/lib/auth.ts:100` | Zod `signupInputSchema`. Rate-limited via `checkSignupAttempt` (`auth.ts:107`). Returns `{ ok, data: { recoveryCode } }` — spec says `{ ok, recoveryCode }` (shape mismatch, see Findings). |
| `loginAction` | DONE | `src/lib/auth.ts:152` | Timing-safe via `DUMMY_PASSWORD_HASH` (`auth.ts:175`). Dual rate-limit (IP+user, user). Returns `actionError("invalid_credentials")` instead of spec's plain `{ ok:false }`. |
| `recoverAccountAction` | DONE | `src/lib/auth.ts:192` | Rotates code (`auth.ts:223-244`). Rate-limited. Returns `data.newRecoveryCode` (shape `{ ok, data: {...} }` not `{ ok, newRecoveryCode }`). |
| `logoutAction` | DONE | `src/lib/auth.ts:255` | `clearSession()` then `redirect("/")`. |

### 2.2 Profile (spec'd at `src/server/actions/profile.ts`; lives in `src/lib/onboarding.ts`, `src/lib/settings-actions.ts`, `src/lib/upload-actions.ts`, `src/lib/ai-actions.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `updateProfileAction` | PARTIAL | `src/lib/settings-actions.ts:42` (`updateProfileBasicsAction`), `src/lib/onboarding.ts:19` (`updateOnboardingProfileAction`) | Two near-duplicates. Settings version delegates to onboarding version, so checks happen twice. Only updates `fullName` + `bio` — spec requires `city, skillLevel, locale, homeLat, homeLng, maxDistanceKm` too (those are split across `updateLocationAction` `settings-actions.ts:76` and `setUserSportsAction` `onboarding.ts:82`). No single `updateProfileAction` matches the spec patch shape. |
| `setUserSportsAction` | DONE | `src/lib/onboarding.ts:82` | Zod validated (`setUserSportsInputSchema`). Auth via `getSession()`. Transactional. |
| `removeProfilePhotoAction` | MISSING | — | No such action. Photo upload exists; deletion does not. |
| `requestPhotoSportSuggestionsAction` | MISSING | — | Vision-based suggestions not implemented. Bio-based exists (see below). |
| `requestBioSportSuggestionsAction` | PARTIAL | `src/lib/ai-actions.ts:15` (`extractSportsForCurrentUserAction`) | Auth-checked. Different name, different signature (no `bio` input — reads it from session user). No explicit rate-limit despite calling Groq. Inline result type, not the `actionResult` union (`ai-actions.ts:7-13`). |
| `geocodeCityAction` | MISSING | — | No server action. The onboarding location flow accepts pre-resolved `lat/lng` from the client. |

### 2.3 Availability (spec'd at `src/server/actions/prompt.ts`; lives in `src/lib/prompt.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `getOrCreateActivePromptAction` | PARTIAL | `src/lib/prompt.ts:69` | Idempotent via `onConflictDoNothing` on `(scopeKey, windowDate, windowSlot)` then re-select. **No auth check** — anyone (even unauthenticated) can call it and mint a prompt row. **No zod** (input shape is unvalidated `{ demoRunId?: string \| null }`). Spec says input is empty. |
| `respondToPromptAction` | DONE | `src/lib/prompt.ts:155` | Zod `respondToPromptInputSchema`. Auth via `getCurrentUser()`. Verifies active scoped window (`prompt.ts:127-153`). Calls shared `formGroupsForPromptAction` for matching. Returns `state: 'matched'\|'unavailable'\|'no_match'`. Spec also lists `'queued'`; that branch never returned. |
| `getMyTodayStateAction` | DONE | `src/lib/prompt.ts:238` | Auth-checked. Returns prompt + response + group. Calls `getOrCreateActivePromptAction` server-side. |

### 2.4 Matching (spec'd at `src/server/actions/matching.ts`; lives in `src/lib/matching.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `formGroupsForPromptAction` | PARTIAL | `src/lib/matching.ts:255` | Idempotent (advisory transaction lock by `hashtext(promptId)` `matching.ts:269`, existing-group check `matching.ts:271`). **No auth check** at all — spec says admin/cron/manual demo. Currently called both from `respondToPromptAction` (acceptable) and not gated for direct caller. Throws raw error on insert-empty-row (`matching.ts:197`). |
| `getCompatibleTeammatesAction` | MISSING | — | No such action. |
| `previewCompatibilityAction` | MISSING | — | `getMatchPercentForViewer` (`profile-public.ts:164`) is a render helper, not an action; no action wrapper. |

### 2.5 Group (spec'd at `src/server/actions/group.ts`; lives in `src/lib/chat.ts`, `src/lib/match-confirm-actions.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `getGroupAction` | DONE | `src/lib/chat.ts:224` | Auth + group-membership ownership check (`chat.ts:119`). Returns `group, members, recentMessages` plus `events`, `achievements`. |
| `joinGroupAction` | MISSING | — | Not implemented (matches confirm/decline only). |
| `leaveGroupAction` | MISSING | — | Comment in `match-confirm.ts:59` references it; no implementation exists. |
| `confirmMembershipAction` | DONE | `src/lib/match-confirm-actions.ts:33` | Auth-checked (`match-confirm-actions.ts:36`). Atomic UPDATE `invited`→`confirmed` via `confirmMembership` (`match-confirm.ts:28`), with classification on no-rows-updated. Plus `declineMembershipAction` (`match-confirm-actions.ts:63`) that the spec does not list. |
| `electCaptainAction` | MISSING | — | No standalone action; captain is set during initial group formation only (`matching-core.ts` heuristic). |

### 2.6 Chat (spec'd at `src/server/actions/chat.ts`; lives in `src/lib/chat.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `postMessageAction` (group) | PARTIAL | `src/lib/chat.ts:462` | Auth + membership, zod, idempotent on `(userId, clientId)` (`chat.ts:494`). Rate-limit uses `recordAuthFailure` (`chat.ts:475`) — **wrong primitive**: this records every send as a "failure" so the bucket fills up under normal use, instead of using `checkAuthRateLimit` to gate then increment. Limit policy `chatUserGroup` 20/60s. |
| `postEventMessageAction` | DONE | `src/lib/chat.ts:558` | Spec only mentions a single `postMessageAction` discriminated by `scopeType`; here split into two functions. Same `recordAuthFailure` issue (`chat.ts:571`). |
| `loadMessagesPageAction` | MISSING | — | No paginated loader; only the initial 30-message slice baked into `getGroupAction`/`getEventAction`. |
| `markThreadReadAction` | MISSING | — | Not implemented. |

### 2.7 Event (spec'd at `src/server/actions/event.ts`; lives in `src/lib/events.ts`, `src/lib/event-form-actions.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `createEventAction` | PARTIAL | `src/lib/events.ts:184` (`createGroupEventAction`) | Auth + captain-only ownership (`events.ts:214`). Validates `groupId` only — spec input includes `sport, whenAtIso, durationMin?, venueId?, customLocationText?, title?` but the impl ignores client overrides and uses `defaultEventTime()` + group sport + seeded venues. Effectively `autoSetupEventForGroupAction` semantics under a different name. |
| `updateEventAction` | MISSING | — | No update flow. |
| `cancelEventAction` | MISSING | — | No cancel flow. |
| `respondToEventAction` | MISSING | — | RSVP not exposed; attendees auto-set to `going` at creation (`events.ts:271`). |
| `autoSetupEventForGroupAction` | PARTIAL | `src/lib/events.ts:184` | The actual `createGroupEventAction` *is* the auto-setup path (seeded venues, vote, system messages). No deterministic ranking explanation, no Groq captain brief in the action return. |
| `searchVenuesAction` | MISSING | — | `getNearbyVenuesAction` (`venues.ts:65`) is map-side only; no Overpass call, no `near/sport/radiusM` shape. |
| `getEventWeatherAction` | MISSING | — | `weather.ts` exists but has no exported action. |
| `exportEventIcsAction` | DONE | `src/app/api/events/[eventId]/ics/route.ts:84` | Implemented as the route handler the spec points to. No action wrapper needed. |

### 2.8 Voting (spec'd at `src/server/actions/vote.ts`; lives in `src/lib/votes.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `createVoteAction` | PARTIAL | — | No standalone action; the venue vote is created inline in `createGroupEventAction` (`events.ts:327`) as a side effect. |
| `castVoteAction` | DONE | `src/lib/votes.ts:18` (`castVenueVoteAction`) | Auth + RSVP-status ownership. Validates option index against candidates. Idempotent via `onConflictDoUpdate(voteId,userId)` (`votes.ts:79`). Topic hard-coded to `venue` — spec implies generic. **No rate-limit** despite being a fast write path. |
| `closeVoteAction` | MISSING | — | No close flow. |

### 2.9 Notifications (spec'd at `src/server/actions/notify.ts`; lives in `src/lib/notification-actions.ts`)

| Action | Verdict | Path:line | Notes |
|---|---|---|---|
| `listNotificationsAction` | PARTIAL | `src/lib/notification-actions.ts:19` (`fetchNotificationsAction`) | Auth-checked. **Returns custom shape `{ ok: true, notifications }` instead of `actionOk({ notifications })`** (`notification-actions.ts:13-15,26`) — drift from §1 contract. No `limit?, unreadOnly?` inputs. |
| `markNotificationReadAction` | DONE | `src/lib/notification-actions.ts:38` | Auth-checked, zod via `markReadInputSchema`. Returns `actionOk({ updated })`. |
| `markAllNotificationsReadAction` | DONE | `src/lib/notification-actions.ts:57` | Auth-checked. Returns `actionOk({ updated })`. |
| `setEmailRemindersAction` | MISSING | — | No action; no `notification_prefs` writes from the client. |
| `subscribeWebPushAction` | MISSING | — | Spec marks stretch. |
| `unsubscribeWebPushAction` | MISSING | — | Spec marks stretch. |

### 2.10 Strava (`src/server/actions/strava.ts`)

| Action | Verdict | Notes |
|---|---|---|
| `startStravaConnectAction` | MISSING | Stretch only per spec; no implementation. |
| `disconnectStravaAction` | MISSING | Stretch only. |
| `syncStravaActivitiesAction` | MISSING | Stretch only. |

### 2.11 Admin (`src/server/actions/admin.ts`)

| Action | Verdict | Notes |
|---|---|---|
| `listUsersAction` | MISSING | No admin actions module. |
| `banUserAction` | MISSING | — |
| `forceMatchAction` | MISSING | — |
| `seedDemoAction` | PARTIAL | Available only as the HTTP route `/api/demo/seed` (see §3.6). No corresponding server action. |
| `resetDemoAction` | PARTIAL | Same — only as `/api/demo/reset`. |
| `getScoringStatusAction` | PARTIAL | Same — only as `/api/demo/scoring-status`. |

### 3. Route handlers

| Path | Method | Verdict | File:line | Notes |
|---|---|---|---|---|
| `/api/stream/messages?scope=group` | GET (SSE) | MISSING | — | No SSE stream. Real-time delivery is not implemented; pages re-fetch. |
| `/api/stream/messages?scope=event` | GET (SSE) | MISSING | — | Same. |
| `/api/stream/today` | GET (SSE) | MISSING | — | Same. |
| `/api/upload/photo` | POST multipart | PARTIAL | `src/lib/upload-actions.ts:21` (server action), `src/lib/uploads.ts:1-142` | Implemented as a **server action**, not a route handler. Uses `sharp`, sniffs magic bytes (`uploads.ts:20`), strips metadata via `.rotate()` then `.webp()` (`uploads.ts:91-97`), writes to R2 (`uploads.ts:103-123`), persists to `profile_photos`. Object key is `profile/{userId}/{uuid}.webp` instead of spec's `profile-photos/{userId}/{uuid}.webp`. **`MAX_BYTES` is 8 MiB (`uploads.ts:8`) — spec mandates 5 MB.** Resize is 512×512 cover, not "1024px max edge" per spec. **Does not delete the replaced object** (writes a new R2 object every upload but only updates `users.photo_url`; old objects orphan). **No rate-limit** on the action. Returns `{ photoUrl }`, not `{ photoId, url, aiStatus }`. |
| `/api/strava/callback` | GET | MISSING | — | Stretch. |
| `/api/webhooks/strava` | POST | MISSING | — | Stretch. |
| `/api/events/[id]/ics` | GET | DONE | `src/app/api/events/[eventId]/ics/route.ts:84` | Zod params, builds `text/calendar`, locale-aware description, no auth (matches spec — link is the secret). Selected venue picked by vote count then rank (`route.ts:146-156`). Sets `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`. **No `Origin` check** for state-changing calls (this is GET, so OK). |
| `/api/u/[username]/og` | GET | MISSING | — | No OG image route. Public profile page exists at `src/app/[locale]/u/[username]/page.tsx`. |
| `/i/[token]` | GET page | DONE | `src/app/[locale]/i/[token]/page.tsx` | Lives under `[locale]` so the path is `/{locale}/i/[token]`, not `/i/[token]` per spec. Uses `getEventInvitePreview` (`invites.ts:168`) which is rate-limited by IP and only exposes whitelisted preview fields. |
| `/api/demo/seed` | POST | DONE | `src/app/api/demo/seed/route.ts:27` | Guarded by `isDemoModeEnabled() \|\| canReadDemoEndpoint(request)` plus `isDemoSeedEnabled` check. IP-bucket rate-limited (5/hr). No `Origin` verification (spec §6 says route handlers should verify `Origin` against `PUBLIC_BASE_URL` for state-changing methods — missing here). |
| `/api/demo/reset` | POST | DONE | `src/app/api/demo/reset/route.ts:46` | Same guards + same rate-limit. Cascading delete keyed by `demoRunId` matches AGENTS rule. Same missing `Origin` check. |
| `/api/demo/scoring-status` | GET | DONE | `src/app/api/demo/scoring-status/route.ts:31` | Guarded by `canReadDemoEndpoint`. Returns rubric summary + counts. |
| `/api/health` | GET | DONE | `src/app/api/health/route.ts:1-15` | Returns `getHealthStatus()` with `Cache-Control: no-store`, status 200/503. |

### 4. Cron entrypoint

| File | Verdict | Notes |
|---|---|---|
| `scripts/prompt-cron.ts` | MISSING | Spec requires Railway cron script invoking `getOrCreatePrompt` + `formGroups`. Only `seed-demo.ts`, `seed.ts`, `migrate.mjs`, etc. exist under `scripts/`. |

### 5. Error model

PARTIAL. Discriminator `{ ok, error, fieldErrors?, retryAfterSeconds? }` matches spec. **Codes outside the spec union** appear in production paths and would not be representable on a strict `ActionError`:

- `invalid_credentials` (`auth.ts:184`), `invalid_recovery` (`auth.ts:220`)
- `invalid_prompt` (`prompt.ts:188`)
- `too_large` / `unsupported_mime` / `upload_failed` (`upload-actions.ts:41,57,58,111`)
- `venues.unavailable` (`venues.ts:77,81,162`)
- `not_found` is used (✓), `forbidden` is **not** used anywhere despite being in the spec union.
- `upstream_failed` is **not** used despite Groq/Open-Meteo upstreams being called.

### 6. CSRF / Origin

PARTIAL. Server actions inherit Next.js' built-in origin check. Route handlers that mutate state (`/api/demo/seed`, `/api/demo/reset`) **do not verify `Origin` against `PUBLIC_BASE_URL`** — spec §6 explicitly requires this for state-changing methods.

### 7. Observability

MISSING. No structured `{ ts, action, userId?, durationMs, ok, error? }` log line wrapper, no `Server-Timing` header on responses, no Sentry instrumentation. Errors are silently caught (e.g., `upload-actions.ts:46-48,57-58,110-112`, `venues.ts:79-81,162-164`), `scoring-status/route.ts:25-28`).

## Findings (severity-ordered)

### High

1. **`formGroupsForPromptAction` has no auth/role check** (`src/lib/matching.ts:255`). Spec marks it admin/cron/manual demo. It currently writes groups, members, achievements, and updates `availability_responses`. Anyone with a session (or even no session — `getCurrentUser` is never called here) can submit any `promptId`. Mitigation: gate with `getCurrentUser()` + `isAdmin`, or only export an internal version called from `respondToPromptAction` and the cron.

2. **`getOrCreateActivePromptAction` has no auth check and no zod** (`src/lib/prompt.ts:69`). Allows anonymous prompt-row creation. Low blast radius (idempotent on conflict), but lets unauthenticated callers shape the demo state and the `prompts` table.

3. **`postMessageAction` / `postEventMessageAction` use `recordAuthFailure` for rate-limiting** (`chat.ts:475`, `chat.ts:571`). `recordAuthFailure` increments unconditionally, so legitimate users hit the limit at 20 sends/min instead of `>20`. The correct call pattern is `checkAuthRateLimit` (return early if limited) **then** `recordAuthFailure` after success — auth.ts uses this two-step pattern but chat.ts skips the check.

4. **Profile photo upload is missing the spec's expensive-image guards.** `uploads.ts` validates magic bytes and size but does not reject pixel bombs / unsafe dimensions before sharp decode. `sharp(buffer, { failOn: "truncated" })` will still attempt decode of pathological large-dimension inputs. Spec §3.2 mandates "rejects extension spoofing and unsafe dimensions/pixel bombs before expensive processing."

5. **Old R2 objects orphan on photo replace** (`upload-actions.ts:62-93`). The new object is uploaded and `users.photo_url` is updated, but the previous object key is never deleted. Spec §3.2: "deletes the replaced object."

6. **`MAX_BYTES = 8 MiB`** (`uploads.ts:8`) — spec says 5 MB cap.

### Medium

7. **No SSE streams implemented** (`/api/stream/messages`, `/api/stream/today`). Realtime UI cannot work; group/event chat will appear stale until a manual refresh. AGENTS.md explicitly lists "two-browser realtime proof for group chat" as a demo-readiness requirement.

8. **No cron entrypoint** (`scripts/prompt-cron.ts` missing). Without it, prompts won't auto-mint and matching only runs when a user clicks Yes.

9. **Many spec actions are absent**: `removeProfilePhotoAction`, `requestPhotoSportSuggestionsAction`, `geocodeCityAction`, `getCompatibleTeammatesAction`, `previewCompatibilityAction`, `joinGroupAction`, `leaveGroupAction`, `electCaptainAction`, `loadMessagesPageAction`, `markThreadReadAction`, `updateEventAction`, `cancelEventAction`, `respondToEventAction`, `searchVenuesAction`, `getEventWeatherAction`, `createVoteAction`, `closeVoteAction`, `setEmailRemindersAction`, every admin action, every Strava action, OG image route. Each is a missed point in §3 of the rubric or a UX gap.

10. **Result-shape drift**: spec uses `{ ok, recoveryCode }`, code uses `{ ok, data: { recoveryCode } }` (auth flows). `fetchNotificationsAction` uses bespoke `{ ok, notifications }` (`notification-actions.ts:13-15`). Form-action wrappers (`auth-form-actions.ts:55`, etc.) read `result.data.recoveryCode`, so the shape is internally consistent — but the spec table is wrong or the code is wrong; pick one.

11. **Error codes outside spec union** as listed above. Either expand the spec union or remap (`invalid_credentials`→`unauthorized`, `too_large`→`validation`+fieldError, `venues.unavailable`→`upstream_failed: 'open_meteo'`, etc.).

12. **`/api/demo/seed` and `/api/demo/reset` don't verify `Origin`** (spec §6).

### Low

13. `respondToPromptAction` never returns `state: 'queued'` (`prompt.ts:155`). Either remove from spec or add the path (e.g., when matching is deferred).

14. `castVenueVoteAction` is not rate-limited; spam votes possible.

15. `extractSportsForCurrentUserAction` returns a custom shape and skips zod/rate-limit even though it calls Groq. Use `actionOk/actionError` and add a per-user bucket.

16. `getNearbyVenuesAction` validates inline (`venues.ts:28`); should live under `src/lib/contracts/`.

17. `events.ts` outer `transaction` call is not wrapped in a try/catch; any DB blip throws across the action boundary, contradicting §1 "actions throw only on programmer error."

18. `confirmMembershipAction` and `declineMembershipAction` map both to `actionError("conflict")` but lose the `reason` (`match-confirm-actions.ts:21-30,57,87`) — the helper builds `{ error, conflict }` but the action throws away the conflict. UI cannot distinguish `not_invited` vs `group_inactive`.

19. Spec says actions live in `src/server/actions/*` (also referenced in §1, §2.x, AGENTS Expected Layout). Code lives in `src/lib/*`. Either move or update the spec — current state contradicts both `docs/specs/01-architecture.md` and `AGENTS.md` ("`src/server/actions/` for server actions").

20. Public invite route is `/{locale}/i/[token]` not `/i/[token]` (spec §3.5). Probably fine as i18n side-effect; flag for spec update.

## Quick wins

1. Add a `requireAdmin()` guard at the top of `formGroupsForPromptAction` and `getOrCreateActivePromptAction`. ~5 lines each.
2. Replace `recordAuthFailure(...)` with `checkAuthRateLimit(...)` + `recordAuthFailure(...)` in `chat.ts:475` and `chat.ts:571`. ~10 lines.
3. Drop `MAX_BYTES` to 5 MB in `uploads.ts:8`.
4. After `users.photo_url` update in `upload-actions.ts:71-93`, capture the prior `objectKey` and `DeleteObjectCommand` it.
5. Add `Origin` check to demo POST routes.
6. Stub `removeProfilePhotoAction` and `loadMessagesPageAction` — both are small wins for the rubric.
7. Standardize Auth result shape: either return `{ ok, recoveryCode }` (matches spec) or update spec to `{ ok, data: { recoveryCode } }`.

## File index

- Actions (server): `src/lib/auth.ts`, `src/lib/onboarding.ts`, `src/lib/settings-actions.ts`, `src/lib/upload-actions.ts`, `src/lib/ai-actions.ts`, `src/lib/prompt.ts`, `src/lib/matching.ts`, `src/lib/chat.ts`, `src/lib/events.ts`, `src/lib/votes.ts`, `src/lib/invites.ts`, `src/lib/match-confirm-actions.ts`, `src/lib/notification-actions.ts`, `src/lib/venues.ts`, `src/lib/profile-public.ts`, `src/lib/leaderboard.ts`, `src/lib/groups.ts`.
- Form-action wrappers: `src/lib/auth-form-actions.ts`, `src/lib/onboarding-form-actions.ts`, `src/lib/prompt-form-actions.ts`, `src/lib/chat-form-actions.ts`, `src/lib/event-form-actions.ts`.
- Route handlers (present): `src/app/api/health/route.ts`, `src/app/api/events/[eventId]/ics/route.ts`, `src/app/api/demo/seed/route.ts`, `src/app/api/demo/reset/route.ts`, `src/app/api/demo/scoring-status/route.ts`.
- Route handlers (missing): `/api/stream/messages`, `/api/stream/today`, `/api/upload/photo`, `/api/strava/callback`, `/api/webhooks/strava`, `/api/u/[username]/og`.
- Cron (missing): `scripts/prompt-cron.ts`.
- Shared: `src/lib/action-result.ts`, `src/lib/auth-rate-limit.ts`, `src/lib/auth-current-user.ts`, `src/lib/contracts/*`.
