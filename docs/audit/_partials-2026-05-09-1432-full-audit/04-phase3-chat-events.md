# Phase 3 Audit — Chat & Events

Spec sources: `docs/specs/12-implementation-plan.md` §5, `docs/specs/03-server-actions-and-routes.md` §2.6/§2.7/§2.9/§3.1, `docs/specs/06-ui-flows.md` §8/§8.1/§9/§10.0.

## Verdict Table

| Phase 3 Task | Status | Evidence |
|---|---|---|
| Group page | DONE | `src/app/[locale]/groups/[groupId]/page.tsx:30-435` (Plan/Chat/Players tabs, captain, members, formation timeline) |
| Persisted chat | DONE | `src/lib/chat.ts:462-556` (group), `:558-652` (event); messages table writes scoped to `groupId`/`eventId` |
| **SSE message stream** | **MISSING** | No `src/app/api/stream/...` route exists; `find` returns zero matches for `*stream*`/`*sse*` files; `GroupChatForm` and `EventChatForm` have no `EventSource` or polling timer; no `revalidatePath` anywhere |
| Event creation | PARTIAL | Captain auto-event server action exists at `src/lib/events.ts:184-368` (`createGroupEventAction`); UI surfaces at `src/app/[locale]/events/new/page.tsx:86-282` and `src/components/group/CreateGroupEventForm.tsx`. **Spec contract `createEventAction` (full input including sport/whenAt/venueId/title) is not implemented — only a captain-only auto-spawn is wired.** No `updateEventAction`/`cancelEventAction`. |
| Event RSVP | PARTIAL | UI exists at `src/components/event/RsvpButtons.tsx:27-82` but is **local-state only with toast**. No `respondToEventAction` server action; `eventAttendees` rows are written only at event creation time (`src/lib/events.ts:271-278`). RSVP buttons do not call any server action. |
| Event chat as separate `eventId` thread | DONE | DB-level isolation: `src/db/schema.ts:409-438` (CHECK constraint `(scopeType='group' AND groupId IS NOT NULL AND eventId IS NULL) OR (scopeType='event' AND eventId IS NOT NULL AND groupId IS NULL)`); query in `src/lib/chat.ts:171-214` uses `scopeType` + `eventId` filter; system messages on creation written to **both** scopes (`src/lib/events.ts:336-352`) so the group thread shows the proposal and the event thread is its own. |
| In-app notification center | PARTIAL | Schema + read API exist (`src/db/schema.ts:444-466`, `src/lib/notifications.ts`); inbox UI at `src/app/[locale]/notifications/page.tsx:34-163` and `src/components/notifications/NotificationInboxActions.tsx`. **However: (a) notifications are never created — `grep "insert(notifications)"` returns 0 hits in `src/`; (b) mark-read is local-state only (TODOs at `NotificationInboxActions.tsx:88,95`) despite `markNotificationReadAction`/`markAllNotificationsReadAction` existing in `src/lib/notification-actions.ts`; (c) demo seed has no notifications.** |
| Header bell entry point | PARTIAL | `HeaderBell` and `AppHeader` components exist (`src/components/layout/HeaderBell.tsx`, `AppHeader.tsx`) but are **not used in any page** — `grep "AppHeader\|HeaderBell"` finds zero call-sites in `src/app/`. The notifications page draws its own header. Mobile/desktop authed pages have no bell. |
| In-app/email reminders | MISSING | No reminder generator. Settings UI literally says "Email reminders coming soon" / "We'll surface this once Resend is wired in" (`src/app/[locale]/settings/page.tsx:62-63,151-152`). No `setEmailRemindersAction`, no nodemailer/resend imports, no cron entrypoint creating reminders. |
| Two-browser chat works | MISSING | No SSE, no polling, no `revalidatePath`. After `postMessageAction` succeeds, the source page is `force-dynamic` but the form uses `useActionState` which does **not** revalidate the route. New messages persist to DB but neither browser will see them without a manual hard refresh. See blocker analysis below. |
| Visibly separate group vs event chat | PARTIAL | Threads are separate at the data layer (see above) and the `EventScreen` Chat tab shows event-scoped messages only. **However the lack of live updates means demonstrating separation requires manual reloads in two tabs**, which works but is not the spec promise of "real-time". |

Overall Phase 3: **NOT DONE**. The two locked deliverables — "two-browser chat works" and "real-time updates" — both fail. Group page, event chat scoping, and event creation through captain auto-spawn are in place. RSVP, notification creation, the bell mount, reminders, and the SSE/polling layer all need work.

## Evidence Detail

### 1. SSE endpoint is missing

Spec `03-server-actions-and-routes.md §3.1` mandates three SSE routes:

- `/api/stream/messages?scope=group&groupId=X`
- `/api/stream/messages?scope=event&eventId=X`
- `/api/stream/today`

Filesystem reality (`find /Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src -path '*/api/*' -type f`):

```
src/app/api/health/route.ts
src/app/api/events/[eventId]/ics/route.ts
src/app/api/demo/seed/route.ts
src/app/api/demo/reset/route.ts
src/app/api/demo/scoring-status/route.ts
```

No stream route, no fallback polling. `grep -rn "EventSource\|setInterval" /Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/group/ /Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/components/event/` returns zero hits aside from `TypeOn.tsx` (decorative animation). `12-implementation-plan.md` Phase 3 task 3 ("SSE message stream") is unstarted; risk-register row 5 ("SSE unstable → polling fallback") was never engaged because there is no first attempt.

### 2. Two-browser chat blocker

Group chat composer (`src/components/group/GroupChatForm.tsx:73-211`) is purely a `useActionState` form. After the action returns, no client side fetch refreshes `messages`. The page is `force-dynamic` (`src/app/[locale]/groups/[groupId]/page.tsx:20`) but server actions only re-render server components when followed by either:

- `revalidatePath`/`revalidateTag` from the action — confirmed absent (`grep` returns 0 hits across `src/`), or
- a navigation that re-runs the RSC payload — not happening, the form just submits to the same path.

Result: Browser A sends a message → row inserted; Browser A's UI does not show the new message until a hard reload; Browser B never sees it without reload. The "two-browser chat works" Done-when criterion of Phase 3 is not satisfiable today.

A minimum viable polling fallback would be a client-side `setInterval(() => loadMessagesPage(...), 1500)` inside `GroupChatForm`/`EventChatForm`. Spec also accepts SSE as the primary path.

### 3. Group chat vs event chat — separation is real, visibility is not

Data-layer separation is correctly enforced:

- `src/db/schema.ts:409-438` — CHECK constraint guarantees mutual exclusivity per row.
- `src/lib/chat.ts:171-214` (`loadScopedMessages`) selects by `scopeType` + the matching id.
- `src/lib/events.ts:336-352` writes a `kind:'event_proposed'` system message to the **group** scope and a `kind:'system'` welcome to the **event** scope at creation time, matching the spec note in `06-ui-flows.md §8.1`.

So when an event is created from a group, the group thread gets a "Plan de eveniment creat: …" system message, and the event has its own thread. That is exactly the behavior `06-ui-flows.md §8.1` calls out. Verifying it visibly across two browsers, however, requires reloads (see blocker §2).

### 4. Event creation server action coverage

`createEventAction` per spec (`§2.7`): inputs `{ groupId?, sport, whenAtIso, durationMin?, venueId?, customLocationText?, title? }`. Reality: only `createGroupEventAction({ groupId })` exists at `src/lib/events.ts:184` — it is captain-only (`src/lib/events.ts:214`), defaults `whenAt` to "tomorrow 16:00 UTC" (`:57-62`), 90 minutes duration, and auto-picks the first three seeded venues. Manual `/events/new` (`src/app/[locale]/events/new/page.tsx`) just lists captain groups and reuses the same one-click form. Public manual events with bespoke time/venue (allowed by spec in §3 of `06-ui-flows.md`) are not implemented.

`updateEventAction`, `cancelEventAction`, `autoSetupEventForGroupAction` — none present.

### 5. RSVP is fake (UI-only)

`src/components/event/RsvpButtons.tsx:27-82` is documented in its own JSDoc as "Local-first RSVP toggle. Optimistic UI; a future server action (owned by the events lib agent) can wire into `onChange` without changing the shape." The button only calls `setValue` and a toast. No `respondToEventAction`, no fetch, no form submission. Backend `eventAttendees` rows are only created on event creation (`src/lib/events.ts:271-278`, status hardcoded `"going"` for every group member).

Consequence: every group member is implicitly "going" forever. Maybe / declined cannot be persisted. The plan-tab "8 going · 2 maybe" counts on `src/app/[locale]/groups/[groupId]/page.tsx:60-65` will always show all members in Confirmed and zero in Maybe/No.

### 6. Notification center

Read path implemented:

- `src/lib/notifications.ts:37-113` — `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `unreadCount`.
- `src/lib/notification-actions.ts:19-67` — `fetchNotificationsAction`, `markNotificationReadAction`, `markAllNotificationsReadAction`.
- `src/app/[locale]/notifications/page.tsx:34-163` — server-rendered inbox with filter chips, kind mapping.

Gaps:

1. **Nothing inserts notifications.** `grep "insert(notifications)"` returns zero non-test hits in `src/` and `scripts/`. The matching engine, captain election, event creation, vote close — none publish a notification. The inbox is structurally empty for any real user; only the demo reset path knows about the table (`src/app/api/demo/reset/route.ts:123` just deletes them).
2. **The wired actions are bypassed by the UI.** `NotificationInboxActions.tsx:88` and `:95` mutate local state with TODO comments saying "persist read state via server action once notifications schema lands" — but the schema and the action exist already. Wiring is one-line.
3. **Header bell is not mounted.** `src/components/layout/HeaderBell.tsx` is wired to `unreadCount` props and `useRouter().push("/{locale}/notifications")`, but `grep AppHeader\|HeaderBell src/app` returns no usages. Today, groups, events, map, profile, settings — none render the bell. Spec `06-ui-flows.md §10.0` mandates "Header bell on mobile and desktop … on every authed page."
4. **Demo seed creates none.** `scripts/seed-demo.ts` (400 lines) has zero references to `notifications` or `messages`. The Judge Mode `/notifications` evidence row (`src/lib/demo/scoring-proofs.ts:301-310`) will land on an empty inbox.

### 7. Reminders (in-app/email)

Spec Phase 3 task 8: "Implement reminders as in-app/email first." Reality:

- `src/app/[locale]/settings/page.tsx:62-63` (EN) and `:151-152` (RO) literally say "Email reminders coming soon — We'll surface this once Resend is wired in."
- No `setEmailRemindersAction` (`grep` 0 hits).
- No mailer integration anywhere (`grep "nodemailer\|resend"` 0 hits).
- No reminder cron / generator / queue. The repo's only cron entrypoint per AGENTS.md is the prompt cron (Phase 2), and `scripts/prompt-cron.ts` does not exist either (separate audit concern).
- In-app reminders also missing: no row in `notifications` is ever created with `type='reminder'`, so the rubric proof of "reminders shipped" cannot be demonstrated.

This is the **stretch wearable-style trap** AGENTS.md warns against — current state would score zero on the reminders rubric row if claimed.

### 8. Other Phase 3 deliverables observed

- **Group page is solid.** `src/app/[locale]/groups/[groupId]/page.tsx:30-435` covers the Plan/Chat/Players tab triad (mobile) and 3-column desktop layout (`:268-433`), captain sticky brief panel, formation timeline, captain-only event creation form, team-balance panel for sports with `evenTeams: true`. Matches `06-ui-flows.md §8`.
- **Event detail screen** is well structured (`src/components/event/EventScreen.tsx`) with details/chat/vote tabs (mobile) and 3-column (desktop). Vote close is a no-op stub (`:255-260`).
- **Vote create** is implicit during event creation (`src/lib/events.ts:326-334`); cast lives in `src/lib/votes.ts`. Vote-row server actions for `closeVote` not surfaced in this audit slice.
- **Auto-event candidate venues** are seeded in code (`src/lib/events.ts:91-151`), not from Overpass (Phase 4 territory).
- **First-match achievement** is awarded somewhere (read at `src/lib/chat.ts:292-303`, displayed at `src/app/[locale]/groups/[groupId]/page.tsx:121-145`); insertion site not in this slice.
- **Tests:** `src/lib/contracts/chat.test.ts` covers zod schemas only. No two-browser e2e test in `e2e/` (only `e2e/visual.spec.ts`). `12-implementation-plan.md` Phase 3 Done-when bullet "two-browser chat works" has no automated proof.

## Recommended next-actions to clear Phase 3

In priority order. Items 1-3 unblock the locked Done-when criteria.

1. **Polling fallback in chat composers**, ~30 lines: client `setInterval` calling a new exported `loadGroupMessagesPageAction` / `loadEventMessagesPageAction` from `src/lib/chat.ts` every 1.5s; merge into local state by id. This alone makes the two-browser demo work while SSE catches up.
2. **`revalidatePath` after chat send** so the sender's page re-renders immediately even before polling.
3. **Implement `respondToEventAction`** in `src/lib/events.ts` and wire `RsvpButtons` to a `useActionState` form. Insert/update on `eventAttendees`.
4. **Auto-create notifications** at the points the rubric will look for: match-ready (matching engine), event-confirmed (event create), vote-closing (cron or close action), chat-mention (post message). Five `db.insert(notifications)` calls.
5. **Mount `HeaderBell`** in a shared authed shell (a small `AuthedHeader` server component) and pass `unreadCount`. Not the locale `layout.tsx` (it's both auth and unauth).
6. **Wire `NotificationInboxActions` to the existing `markNotificationReadAction` / `markAllNotificationsReadAction`** server actions. Replace the two TODOs.
7. **Spec Phase 3 §8 reminders**: cheapest visible proof is in-app — write a `reminders` row with `type='reminder', title='Tonight at 18:30…'` 30 minutes before each confirmed event in a small cron task or at event-create time (deterministic, demo-safe).
8. **SSE upgrade path**: add `/api/stream/messages` route handler conforming to `03-server-actions-and-routes.md §3.1` once polling proves the contract.
9. **Two-browser e2e test** (`e2e/chat.spec.ts`) using Playwright `browser.newContext()` ×2 to lock the regression.
