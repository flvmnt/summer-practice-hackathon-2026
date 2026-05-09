# 03 - Server Actions & Route Handlers

Every mutation is a Next.js **server action** (`"use server"`). Every long-lived stream or external integration is a **route handler** (`app/api/.../route.ts`). Browser → server is fetches via the action runtime; no separate REST API.

## 1. Conventions

- Every action validates with **zod** before touching the DB. Zod schemas live in `src/lib/contracts/` and are imported by both server and client.
- Every action returns a discriminated union: `{ ok: true, data?: ... } | { ok: false, error: string, fieldErrors?: Record<string, string> }`.
- Every action that mutates calls `getCurrentUser()` first. Returns `{ ok: false, error: 'unauthorized' }` if absent.
- Actions throw only on programmer error (assertion failure). User errors return `ok: false`.
- Rate-limited actions wrap with `withRateLimit(bucket, action)`.
- All time inputs are ISO 8601 in UTC. Display layer handles tz.

## 2. Action catalog

### 2.1 Auth (`src/lib/auth.ts` - curbe pattern)

| Action | Input | Output | Notes |
|---|---|---|---|
| `signupAction` | `username, password` | `{ ok, recoveryCode } \| { ok: false }` | Rate-limited. Shows recovery code once. |
| `loginAction` | `username, password` | `{ ok } \| { ok: false }` | Timing-safe (DUMMY_HASH). Rate-limited. |
| `recoverAccountAction` | `username, recoveryCode, newPassword` | `{ ok, newRecoveryCode } \| { ok: false }` | Rotates recovery code. Rate-limited. |
| `logoutAction` | - | redirect `/` | Destroys session. |

See [04-auth-and-profile.md](04-auth-and-profile.md).

### 2.2 Profile (`src/server/actions/profile.ts`)

| Action | Input | Output |
|---|---|---|
| `updateProfileAction` | `{ fullName?, bio?, city?, skillLevel?, locale?, homeLat?, homeLng?, maxDistanceKm? }` | `{ ok }` |
| `setUserSportsAction` | `{ sports: Array<{ sport, level? }> }` | `{ ok }` |
| `removeProfilePhotoAction` | - | `{ ok }` |
| `requestPhotoSportSuggestionsAction` | `{ photoId }` | `{ ok, suggestions: Array<{ sport, confidence }> }` - calls Groq vision, cached, rate-limited |
| `requestBioSportSuggestionsAction` | `{ bio }` | `{ ok, suggestions: Array<{ sport, confidence }> }` - calls Groq text, rate-limited |
| `geocodeCityAction` | `{ city }` | `{ ok, location: { lat, lng } }` - Open-Meteo geocoding |

Photo upload itself goes through a **route handler** (multipart form data, see §3).

### 2.3 Availability (`src/server/actions/prompt.ts`)

| Action | Input | Output |
|---|---|---|
| `getOrCreateActivePromptAction` | - | `{ ok, prompt: { id, slot } }` - idempotent per (date, slot) |
| `respondToPromptAction` | `{ promptId, answer: 'yes'\|'no', sportPrefs?: string[], lat?, lng?, maxDistanceKm? }` | `{ ok, state: 'queued'\|'matched'\|'no_match'\|'unavailable', group?: { id } }` - records the answer, verifies the prompt is the active scoped window, then calls the same idempotent matching engine used by cron when `yes`; `no_match` means the response was considered but not enough nearby compatible players exist yet |
| `getMyTodayStateAction` | - | `{ ok, prompt, response?, group? }` - single-shot for `/today` |

### 2.4 Matching (`src/server/actions/matching.ts`)

| Action | Input | Output |
|---|---|---|
| `formGroupsForPromptAction` | `{ promptId }` | `{ ok, groups: Array<{ id, sport, members }> }` - admin/cron/manual demo rerun; idempotent and safe if `respondToPromptAction` already ran it |
| `getCompatibleTeammatesAction` | `{ sport, limit? }` | `{ ok, suggestions: Array<{ userId, score, reason }> }` |
| `previewCompatibilityAction` | `{ withUserId }` | `{ ok, score, breakdown }` - Groq-backed, cached |

### 2.5 Group (`src/server/actions/group.ts`)

| Action | Input | Output |
|---|---|---|
| `getGroupAction` | `{ groupId }` | `{ ok, group, members, recentMessages }` |
| `joinGroupAction` | `{ groupId }` | `{ ok }` |
| `leaveGroupAction` | `{ groupId }` | `{ ok }` |
| `confirmMembershipAction` | `{ groupId }` | `{ ok }` - match-confirmation flow (300p) |
| `electCaptainAction` | `{ groupId, strategy?: 'heuristic'\|'manual', userId? }` | `{ ok, captainId }` - heuristic by default: fast confirmer, prior captain signal, central location, random tie-break |

### 2.6 Chat (`src/server/actions/chat.ts`)

| Action | Input | Output |
|---|---|---|
| `postMessageAction` | `{ scopeType: 'group'\|'event', groupId?, eventId?, body, clientId }` | `{ ok, message }` - rate-limited |
| `loadMessagesPageAction` | `{ scopeType: 'group'\|'event', groupId?, eventId?, before?: string, limit?: number }` | `{ ok, messages, nextBefore? }` |
| `markThreadReadAction` | `{ scopeType: 'group'\|'event', groupId?, eventId?, lastMessageId }` | `{ ok }` |

Real-time delivery is via SSE - see §3.

### 2.7 Event (`src/server/actions/event.ts`)

| Action | Input | Output |
|---|---|---|
| `createEventAction` | `{ groupId?, sport, whenAtIso, durationMin?, venueId?, customLocationText?, title? }` | `{ ok, event }` |
| `updateEventAction` | `{ eventId, ...patch }` | `{ ok }` |
| `cancelEventAction` | `{ eventId, reason? }` | `{ ok }` |
| `respondToEventAction` | `{ eventId, status: 'going'\|'maybe'\|'declined' }` | `{ ok }` |
| `autoSetupEventForGroupAction` | `{ groupId }` | `{ ok, event, venueCandidates, captainBrief }` - deterministic ranking plus optional Groq explanation |
| `searchVenuesAction` | `{ near: { lat, lng }, sport, radiusM? }` | `{ ok, venues }` - seeded/cache first, then Overpass query |
| `getEventWeatherAction` | `{ eventId }` | `{ ok, forecast }` - Open-Meteo, cached on event row |
| `exportEventIcsAction` | `{ eventId }` | redirect to `/api/events/[id]/ics` |

### 2.8 Voting (`src/server/actions/vote.ts`)

| Action | Input | Output |
|---|---|---|
| `createVoteAction` | `{ groupId, eventId?, topic, options, closesAtIso? }` | `{ ok, vote }` |
| `castVoteAction` | `{ voteId, optionIdx }` | `{ ok }` |
| `closeVoteAction` | `{ voteId }` | `{ ok, results }` |

### 2.9 Notifications (`src/server/actions/notify.ts`)

| Action | Input | Output |
|---|---|---|
| `listNotificationsAction` | `{ limit?, unreadOnly? }` | `{ ok, notifications }` |
| `markNotificationReadAction` | `{ notificationId }` | `{ ok }` |
| `markAllNotificationsReadAction` | - | `{ ok }` |
| `setEmailRemindersAction` | `{ enabled, email? }` | `{ ok }` |
| `subscribeWebPushAction` | `{ subscription }` | `{ ok }` (stretch) |
| `unsubscribeWebPushAction` | `{ endpoint }` | `{ ok }` |

### 2.10 Strava (`src/server/actions/strava.ts`)

Optional stretch only. Do not claim wearables points unless OAuth/import or an accepted labeled fixture ships.

| Action | Input | Output |
|---|---|---|
| `startStravaConnectAction` | - | `{ ok, redirectUrl }` |
| `disconnectStravaAction` | - | `{ ok }` |
| `syncStravaActivitiesAction` | - | `{ ok, importedCount, suggestedSports }` |

OAuth callback is a route handler (`/api/strava/callback`).

### 2.11 Admin (`src/server/actions/admin.ts`)

| Action | Input | Output |
|---|---|---|
| `listUsersAction` | `{ q?, limit? }` | `{ ok, users }` |
| `banUserAction` | `{ userId, reason }` | `{ ok }` |
| `forceMatchAction` | `{ promptId }` | `{ ok }` |
| `seedDemoAction` | `{ confirm: 'showup2move' }` | `{ ok }` |
| `resetDemoAction` | `{ confirm: 'showup2move' }` | `{ ok }` |
| `getScoringStatusAction` | - | `{ ok, rows }` |

Non-demo admin actions are gated by `getCurrentUser().isAdmin === true`.
Demo read/write actions additionally use the shared demo guard: `ALLOW_DEMO_MODE=true`; seed/reset also require `ALLOW_DEMO_SEED=true`, `confirm === 'showup2move'`, the demo rate-limit bucket, and an admin session. HTTP demo routes may use either an admin session or a valid `DEMO_MODE_SECRET`.

## 3. Route handlers (HTTP)

### 3.1 SSE streams

| Path | Method | Stream events |
|---|---|---|
| `/api/stream/messages?scope=group&groupId=X` | GET | `message.created`, `vote.started`, `vote.closed`, `event.proposed`, `member.joined`, `member.left` |
| `/api/stream/messages?scope=event&eventId=X` | GET | `message.created`, `notification.created`; event/vote/attendee updates are mirrored as system messages/notifications |
| `/api/stream/today` | GET | `prompt_open`, `group_formed`, `reminder` |

**Implementation note.** Each SSE handler:
1. Verifies session.
2. Verifies user is a group member or event attendee.
3. Checks the SSE connection rate-limit bucket by user/IP before opening the stream.
4. Sends `: keep-alive\n\n` every 25s.
5. Polls `messages` and `notifications` on a 1.5s tick using per-table cursors (`created_at`, `id`); sends new rows. Event/vote/attendee changes that need realtime UI also write a system message or notification.
6. Closes on client disconnect or after 5min idle (client auto-reconnects).

We're not using LISTEN/NOTIFY in MVP - polling at 1.5s is good enough at hackathon scale. Easy upgrade path later.

### 3.2 Uploads

| Path | Method | Notes |
|---|---|---|
| `/api/upload/photo` | POST multipart | Auth required and rate-limited. Sniffs magic bytes; allows `image/jpeg\|png\|webp` max 5 MB; rejects extension spoofing and unsafe dimensions/pixel bombs before expensive processing. Strips metadata, resizes to 1024px max edge, stores under Cloudflare R2 object key `profile-photos/<userId>/<uuid>.webp`, creates `profile_photos` row, and deletes the replaced object. Returns `{ photoId, url, aiStatus }`. |

Uses [`sharp`](https://sharp.pixelplumbing.com) for resize/transcode and the S3-compatible Cloudflare R2 client from `src/lib/storage.ts`. No Railway filesystem storage is allowed.

### 3.3 OAuth

| Path | Method | Notes |
|---|---|---|
| `/api/strava/callback` | GET | `?code=...&state=...`. Exchanges code, stores tokens, redirects to `/settings?strava=connected`. State is HMAC of `userId + nonce`. |

### 3.4 Webhooks

| Path | Method | Notes |
|---|---|---|
| `/api/webhooks/strava` | POST | Strava sends activity events. Verify signature (subscription token). Updates `strava_accounts.last_sync_at`, optionally enqueues a sync. |

### 3.5 Files

| Path | Method | Notes |
|---|---|---|
| `/api/events/[id]/ics` | GET | Returns text/calendar with the event. Anyone with the link can use it (private id is enough). |
| `/api/u/[username]/og` | GET | Public profile OG image (dynamic, edge runtime). |
| `/i/[token]` | GET page | Public event invite preview with limited details, no private chat or exact member list. |

### 3.6 Demo and scoring proof

Guarded by `ALLOW_DEMO_MODE=true` plus admin session or `DEMO_MODE_SECRET`.

| Path | Method | Notes |
|---|---|---|
| `/api/demo/seed` | POST | Creates deterministic Romanian demo users, prompts, groups, event chat, notifications, venues, votes, weather cache, and optional wearable fixture. |
| `/api/demo/reset` | POST | Resets only demo-owned rows. Requires explicit confirmation. |
| `/api/demo/scoring-status` | GET | Returns rubric rows, implemented proof surface, and risk/fallback status for Judge Mode. |

### 3.7 Health

| Path | Method | Notes |
|---|---|---|
| `/api/health` | GET | Returns `{ ok: true, db: 'up', commit }`. Used by Railway healthcheck. |

## 4. Cron entrypoint (separate process)

`scripts/prompt-cron.ts` - invoked by Railway Cron, **not** an HTTP endpoint. Railway cron schedules are treated as UTC. Use `0 6,12,16 * * *` for a Romania-friendly morning / afternoon / evening cadence, then compute the displayed local slot inside the script with `Europe/Bucharest`.

```ts
// pseudo-flow
const slot = currentSlotForUtc(new Date());          // morning|afternoon|evening
const prompt = await getOrCreatePrompt(today, slot);
const candidates = await usersActiveInLast14Days();
await Promise.all(candidates.map(async (u) => {
  if (await alreadyAnswered(prompt.id, u.id)) return;
  if (await hasEmailReminders(u.id)) await sendPromptEmail(u, prompt);
  if (await hasWebPush(u.id))        await sendPromptPush(u, prompt);
}));
// later or immediately in demo: form groups for everyone who said yes
const yesUsers = await yesResponsesForPrompt(prompt.id);
await formGroups({ promptId: prompt.id, users: yesUsers });
```

`respondToPromptAction` may also call `formGroups({ promptId })` immediately after a Yes answer. Both paths call the same locked/idempotent matching function, so inline demo matching and cron matching cannot create duplicate groups.

## 5. Error model

```ts
type ActionError =
  | { ok: false; error: 'unauthorized' }
  | { ok: false; error: 'rate_limited'; retryAfterSeconds: number }
  | { ok: false; error: 'validation'; fieldErrors: Record<string, string> }
  | { ok: false; error: 'not_found' }
  | { ok: false; error: 'forbidden' }
  | { ok: false; error: 'conflict'; reason?: string }
  | { ok: false; error: 'upstream_failed'; service: 'groq'|'overpass'|'open_meteo'|'strava' }
  | { ok: false; error: 'internal' };
```

Client-side error mapping is centralized in `lib/error-messages.ts` so copy stays consistent and i18n-able.

## 6. CSRF & origin checks

Server actions in Next.js 16 carry an automatic origin check. Route handlers explicitly verify `Origin` against `PUBLIC_BASE_URL` for state-changing methods.

## 7. Observability

Every action and route handler:
- emits a structured log line: `{ ts, action, userId?, durationMs, ok, error? }`
- pushes a Vercel-style `Server-Timing` header on responses (handlers only)
- error in any external service → captured to console + (stretch) Sentry
