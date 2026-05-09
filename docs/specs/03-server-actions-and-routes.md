# 03 — Server Actions & Route Handlers

Every mutation is a Next.js **server action** (`"use server"`). Every long-lived stream or external integration is a **route handler** (`app/api/.../route.ts`). Browser → server is fetches via the action runtime; no separate REST API.

## 1. Conventions

- Every action validates with **zod** before touching the DB. Zod schemas live in `src/lib/contracts/` and are imported by both server and client.
- Every action returns a discriminated union: `{ ok: true, data?: ... } | { ok: false, error: string, fieldErrors?: Record<string, string> }`.
- Every action that mutates calls `getCurrentUser()` first. Returns `{ ok: false, error: 'unauthorized' }` if absent.
- Actions throw only on programmer error (assertion failure). User errors return `ok: false`.
- Rate-limited actions wrap with `withRateLimit(bucket, action)`.
- All time inputs are ISO 8601 in UTC. Display layer handles tz.

## 2. Action catalog

### 2.1 Auth (`src/lib/auth.ts` — curbe pattern)

| Action | Input | Output | Notes |
|---|---|---|---|
| `signupAction` | `username, password` | `{ ok, recoveryCode } \| { ok: false }` | Rate-limited. Shows recovery code once. |
| `loginAction` | `username, password` | `{ ok } \| { ok: false }` | Timing-safe (DUMMY_HASH). Rate-limited. |
| `recoverAccountAction` | `username, recoveryCode, newPassword` | `{ ok, newRecoveryCode } \| { ok: false }` | Rotates recovery code. Rate-limited. |
| `logoutAction` | — | redirect `/` | Destroys session. |

See [04-auth-and-profile.md](04-auth-and-profile.md).

### 2.2 Profile (`src/server/actions/profile.ts`)

| Action | Input | Output |
|---|---|---|
| `updateProfileAction` | `{ bio?, city?, skillLevel?, locale?, homePoint? }` | `{ ok }` |
| `setUserSportsAction` | `{ sports: Array<{ sport, level? }> }` | `{ ok }` |
| `removeProfilePhotoAction` | — | `{ ok }` |
| `requestPhotoSportSuggestionsAction` | `{ photoUrl }` | `{ ok, suggestions: Array<{ sport, confidence }> }` — calls Groq vision |
| `requestBioSportSuggestionsAction` | `{ bio }` | `{ ok, suggestions: Array<{ sport, confidence }> }` — calls Groq text |
| `geocodeCityAction` | `{ city }` | `{ ok, point: [lon,lat] }` — Open-Meteo geocoding |

Photo upload itself goes through a **route handler** (multipart form data, see §3).

### 2.3 Availability (`src/server/actions/prompt.ts`)

| Action | Input | Output |
|---|---|---|
| `getOrCreateActivePromptAction` | — | `{ ok, prompt: { id, slot } }` — idempotent per (date, slot) |
| `respondToPromptAction` | `{ promptId, answer: 'yes'\|'no', sportPrefs?: string[] }` | `{ ok, group?: { id } }` — triggers matching if `yes` |
| `getMyTodayStateAction` | — | `{ ok, prompt, response?, group? }` — single-shot for `/today` |

### 2.4 Matching (`src/server/actions/matching.ts`)

| Action | Input | Output |
|---|---|---|
| `formGroupsForPromptAction` | `{ promptId }` | `{ ok, groups: Array<{ id, sport, members }> }` — admin/cron only |
| `getCompatibleTeammatesAction` | `{ sport, limit? }` | `{ ok, suggestions: Array<{ userId, score, reason }> }` |
| `previewCompatibilityAction` | `{ withUserId }` | `{ ok, score, breakdown }` — Groq-backed, cached |

### 2.5 Group (`src/server/actions/group.ts`)

| Action | Input | Output |
|---|---|---|
| `getGroupAction` | `{ groupId }` | `{ ok, group, members, recentMessages }` |
| `joinGroupAction` | `{ groupId }` | `{ ok }` |
| `leaveGroupAction` | `{ groupId }` | `{ ok }` |
| `confirmMembershipAction` | `{ groupId }` | `{ ok }` — match-confirmation flow (300p) |
| `electCaptainAction` | `{ groupId, strategy: 'random'\|'most_active'\|'manual', userId? }` | `{ ok, captainId }` — random by default |

### 2.6 Chat (`src/server/actions/chat.ts`)

| Action | Input | Output |
|---|---|---|
| `postMessageAction` | `{ groupId, body }` | `{ ok, message }` |
| `loadMessagesPageAction` | `{ groupId, before?: string, limit?: number }` | `{ ok, messages, nextBefore? }` |
| `markGroupReadAction` | `{ groupId, lastMessageId }` | `{ ok }` |

Real-time delivery is via SSE — see §3.

### 2.7 Event (`src/server/actions/event.ts`)

| Action | Input | Output |
|---|---|---|
| `createEventAction` | `{ groupId?, sport, whenAtIso, durationMin?, venueId?, customLocationText?, title? }` | `{ ok, event }` |
| `updateEventAction` | `{ eventId, ...patch }` | `{ ok }` |
| `cancelEventAction` | `{ eventId, reason? }` | `{ ok }` |
| `respondToEventAction` | `{ eventId, status: 'going'\|'maybe'\|'declined' }` | `{ ok }` |
| `autoSetupEventForGroupAction` | `{ groupId }` | `{ ok, event }` — picks venue + time via Groq + Overpass |
| `searchVenuesAction` | `{ near: [lon,lat], sport, radiusM? }` | `{ ok, venues }` — Overpass query |
| `getEventWeatherAction` | `{ eventId }` | `{ ok, forecast }` — Open-Meteo, cached on event row |
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
| `subscribeWebPushAction` | `{ subscription }` | `{ ok }` (stretch) |
| `unsubscribeWebPushAction` | `{ endpoint }` | `{ ok }` |
| `setEmailRemindersAction` | `{ enabled }` | `{ ok }` |

### 2.10 Strava (`src/server/actions/strava.ts`)

| Action | Input | Output |
|---|---|---|
| `startStravaConnectAction` | — | `{ ok, redirectUrl }` |
| `disconnectStravaAction` | — | `{ ok }` |
| `syncStravaActivitiesAction` | — | `{ ok, importedCount, suggestedSports }` |

OAuth callback is a route handler (`/api/strava/callback`).

### 2.11 Admin (`src/server/actions/admin.ts`)

| Action | Input | Output |
|---|---|---|
| `listUsersAction` | `{ q?, limit? }` | `{ ok, users }` |
| `banUserAction` | `{ userId, reason }` | `{ ok }` |
| `forceMatchAction` | `{ promptId }` | `{ ok }` |

Gated by `getCurrentUser().isAdmin === true`.

## 3. Route handlers (HTTP)

### 3.1 SSE streams

| Path | Method | Stream events |
|---|---|---|
| `/api/stream/messages?groupId=X` | GET | `message`, `vote_started`, `vote_closed`, `event_proposed`, `member_joined`, `member_left` |
| `/api/stream/today` | GET | `prompt_open`, `group_formed`, `reminder` |

**Implementation note.** Each SSE handler:
1. Verifies session.
2. Verifies user is a group member (for chat).
3. Sends `: keep-alive\n\n` every 25s.
4. Polls `messages` table on a 1.5s tick using a per-connection cursor (last `created_at`); sends new rows.
5. Closes on client disconnect or after 5min idle (client auto-reconnects).

We're not using LISTEN/NOTIFY in MVP — polling at 1.5s is good enough at hackathon scale. Easy upgrade path later.

### 3.2 Uploads

| Path | Method | Notes |
|---|---|---|
| `/api/upload/photo` | POST multipart | Auth required. `image/jpeg\|png\|webp` max 5 MB. Resizes to 1024px max edge. Stores under `STORAGE_DIR/photos/<uuid>.webp`. Returns `{ url }`. |

Uses [`sharp`](https://sharp.pixelplumbing.com) for resize/transcode.

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

### 3.6 Health

| Path | Method | Notes |
|---|---|---|
| `/api/health` | GET | Returns `{ ok: true, db: 'up', commit }`. Used by Railway healthcheck. |

## 4. Cron entrypoint (separate process)

`scripts/prompt-cron.ts` — invoked by Railway Cron, **not** an HTTP endpoint. Railway cron schedules are treated as UTC. Use `0 6,12,16 * * *` for a Romania-friendly morning / afternoon / evening cadence, then compute the displayed local slot inside the script with `Europe/Bucharest`.

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
// 30 min later: form groups for everyone who said yes
const yesUsers = await yesResponsesForPrompt(prompt.id);
await formGroups({ promptId: prompt.id, users: yesUsers });
```

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
