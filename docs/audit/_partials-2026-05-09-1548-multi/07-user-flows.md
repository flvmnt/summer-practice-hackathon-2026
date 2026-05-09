# 07 - User-Flow Integrity Audit

Audit window: 2026-05-09 ~15:48
Scope: end-to-end happy-path traversal of the seven canonical flows. No source mutations.

## TL;DR

The build is wired well at the **edges** (signup, onboarding navigation, prompt response, RSVP, ICS, notifications, walkthrough nav) but two of the four post-match user-actions are completely **dead** in production code paths:

1. **Venue voting is a no-op** in the only UI that surfaces it. `EventScreen` mounts `VoteCard` without an `onVote` callback (`src/components/event/EventScreen.tsx:265-282`); the working `VenueVoteForm.tsx` is defined but never imported. Tapping a venue option does nothing, no DB write, no toast, no error. P0.
2. **Confirm/decline membership UI is structurally unreachable.** Matched users are inserted with `status="confirmed"` (DB default in `src/db/schema.ts:204`; `insertDraftGroup` doesn't override), but the entire confirm/decline UX requires `status="invited"`. No code path writes "invited" anywhere in `src/`. The new buttons (`src/app/[locale]/groups/[groupId]/page.tsx:142-200`) and the `match-confirm` server action (`src/lib/match-confirm.ts:41,74`) are dead code. P0.
3. **Captain "Confirm plan" and "Close vote" are stubs.** `CaptainAutoEventReveal.onConfirm` only fires a toast (`src/components/event/CaptainAutoEventReveal.tsx:112-118`); event status never transitions from `"proposed"` to `"confirmed"`. `EventScreen.onClose` is an empty arrow with a TODO comment (`src/components/event/EventScreen.tsx:277-280`); no `closeVoteAction` exists in the codebase. P0/P1.
4. **The `/onboarding/photo` page is reachable but dead-end.** Location-step navigates straight to `/today` (`src/components/onboarding/LocationForm.tsx:111`), so the only entry to the photo page is the Today setup banner; even when reached, the AI sport picks made on that page (`PhotoForm.picked` state, line 156-167) are never persisted on Skip or Finish. P1.
5. **Today setup banner never disappears.** `showSetup` is hard-coded `true` (`src/app/[locale]/today/page.tsx:60`), so even users who upload a photo see "Add your photo" indefinitely. Plus the banner's `nextHref` points to `/onboarding/profile` (the merged step), not `/onboarding/photo`. P2.
6. **Profile photo never preloads on the merged profile step.** `ProfileForm` accepts `defaultPhotoUrl` but `ProfileOnboardingPage` never passes it (`src/app/[locale]/onboarding/profile/page.tsx:22-29`); `getCurrentUser` doesn't even select `photoUrl` (`src/lib/auth-current-user.ts:23-37`). Refresh-resume always shows empty avatar even after a successful upload. P2.

Several of these would have been hidden by the prior audit's "DEAD CODE" labels - they remain dead. The "needs N more" surface is still missing in the queued state. The matching loop is **purely on-demand** (no cron, no polling): a queued user re-attempts only when another user submits "yes". Documented as P1.

---

## Findings

### P0 - Blocks a user from completing the canonical loop

**P0-1. Venue voting click is a no-op.**
File: `src/components/event/EventScreen.tsx:265-282`.
The polished `VoteCard` is mounted with no `onVote` prop. `VoteCard.tsx:106` calls `onVote?.(o.id)` — optional chain swallows it silently. The working `VenueVoteForm` (`src/components/event/VenueVoteForm.tsx:31`) wires `castVenueVoteFormAction` correctly, but is imported nowhere. Effect: every user can see the vote panel and the running tally, but cannot cast a vote through the live UI.

**P0-2. Confirm-membership UX is unreachable.**
- `src/lib/matching.ts:182-218` (`insertDraftGroup`) inserts new members without setting `status`, so the DB default of `"confirmed"` fires (`src/db/schema.ts:204`).
- `src/lib/match-confirm.ts:41,74` requires `status === "invited"` to flip; no code anywhere writes "invited" (verified by `grep -rn 'status.*invited' src/`).
- `src/lib/chat.ts:282-283` filters group members by `status="confirmed"` only, so an invited row would not even appear in `getGroupAction` data.
- `src/lib/chat.ts:137` (`requireGroupMember`) requires `status="confirmed"` to load the group page at all.
- `src/app/[locale]/groups/[groupId]/page.tsx:62` evaluates `viewerMembership?.status === "invited"` which is therefore always false → buttons never render.

The entire flow added by commits `5d9fe0c`, `8941981`, and `85e8929` is dead. The "exclude declined" change (`85e8929`) does mostly hold via `availabilityResponses.answer = 'no'` filtering in `candidatesForPrompt` (`src/lib/matching.ts:118-123`), but the decline-after-match path (`src/lib/prompt.ts:212-223` setting `status="declined"`) never has any "invited" rows to update either, because matching never produces invited rows. Net effect: the decline button is unused **and** the only way to leave a match is to answer "no" before matching runs.

**P0-3. Captain "Confirm plan" never persists.**
`src/components/event/CaptainAutoEventReveal.tsx:112-118` (`onConfirm`): toast + dismiss. No server action, no `events.status` update. Comment on lines 67-68 admits "the actual `confirmEventAction` is owned by the events lib agent. Until that lands we surface a success toast." `grep -rn 'confirmEventAction\|confirmEvent' src/` returns zero hits. Demo seed forces `status="confirmed"` directly (`scripts/seed-demo.ts:293`), so this only matters for live (non-demo) flows; in live use, every captain-created event sits in `proposed` forever, but the surface that consumes `event.status` (RSVP, ICS, captain brief) doesn't gate on it, so the impact is mostly cosmetic - hence demoting if you classify rubric-impact only. Still listed P0 because the captain UX claims to do something it doesn't.

**P0-4. Captain "Close vote" is a no-op.**
`src/components/event/EventScreen.tsx:277-280`: `onClose` is an empty arrow with comment "Close-vote backend lives in votes.ts; this surface just emits the intent." `votes.status` defaults to "open" (`src/db/schema.ts:371`). No code transitions it to "closed" anywhere (`grep -rn 'votes.status\|closeVote' src/lib/` returns only reads, never writes). Combined with P0-1, the vote feature is decorative: open at creation, never receives votes through the canonical UI, never closes. Both flows depend on each other. P0 because it's the rubric-named "venue/map/vote" row.

### P1 - Dead-end / inconsistent state / silently incorrect

**P1-1. `/onboarding/photo` is unreachable from the canonical flow but still mounted.**
Photo step was merged into `/onboarding/profile` (commit `a4c1cee`). `LocationForm` (`src/components/onboarding/LocationForm.tsx:111`) routes location → `/today`. The only paths into `/onboarding/photo` are:
- direct URL,
- the Today setup banner with label "photo" but `nextHref=/onboarding/profile` (so even the banner doesn't link here),
- a stale browser bookmark.

Even if reached, `PhotoForm`'s sport picks (`src/components/onboarding/PhotoForm.tsx:156-167`) feed only local state; `handleSkip` / `handleFinish` (lines 174-184) navigate to `/today` without persisting `picked`. The wizard step indicator says "step 4 of 4" (line 197-198) which contradicts the rest of the merged flow that says "1 of 3".

**P1-2. Today setup banner never closes.**
`src/app/[locale]/today/page.tsx:60`: `const showSetup = true;`. Code comment on lines 58-60 acknowledges this: "We don't have a photoUrl on the onboarding state - the optional step is always surfaced until the user closes it / wires up presence detection." Also the banner's `nextHref={/onboarding/profile}` goes to the merged step, but the user already filled that out — they land in front of a populated profile form, not a photo-specific UI. Effect: every authenticated user sees an "Add your photo" CTA on every Today page load until end of time.

**P1-3. Matching has no scheduler.**
`formGroupsForPromptAction` is invoked exclusively from `respondToPromptAction` (`src/lib/prompt.ts:230`). No cron, no polling, no setInterval (verified). A user who answered "yes" first sits in queued state until **another** user answers "yes" and triggers a new matching attempt; if no one ever does, the user stays queued indefinitely. The Today queued card surfaces an elapsed counter (`src/components/today/TodayPromptCard.tsx:222-231`) that ticks every 15s but no auto re-attempt happens. Symptom: cold-start queued state is permanent until someone else's action.

**P1-4. The `confirmed` derived state in TodayPromptCard is unreachable.**
`src/components/today/TodayPromptCard.tsx:89` declares `"confirmed"` as a state, but `deriveState` (lines 93-134) never returns it. The `TodayConfirmedCard` block (lines 375-405), all its hard-coded labels ("Baza 2", "Tineretului · 2.1 km", "8 going · 2 maybe"), and the entire confirmed → calendar handoff are dead code in this file. This was probably intended to fire after the captain confirms the event, but P0-3 means that transition never persists, and `getMyTodayStateAction` returns `group` whenever `groupMembers.status="confirmed"` (which is the **default** at match creation), so the user is shown `state="found"` immediately on match — never "confirmed".

**P1-5. The walkthrough's Vote step is indistinguishable from Event.**
`src/lib/demo/walkthrough.ts:20` defines step 5 (`vote`) as `/${l}/demo/step/event#vote`. The resolver (`src/app/[locale]/demo/step/[step]/route.ts:55-72`) returns the event URL with no `?tab=vote` query (the EventTabs use a search-param-driven state, `src/components/event/EventScreen.tsx:138-145`), and HTTP 302 redirects strip URL fragments. Result: walkthrough step 4/7 (Event) and step 5/7 (Vote) land on the exact same page in the exact same tab. `resolveStepIndex` (`src/lib/demo/walkthrough.ts:29-38`) doesn't even differentiate them - both `event` and `vote` map to index 3. So clicking → on Event jumps to step 6 (Calendar), not step 5 (Vote). Judges see "Vote" labelled but no obvious vote-tab change.

**P1-6. Demo seed produces no "invited" rows either.**
`scripts/seed-demo.ts:271-280` inserts all demo members with `status="confirmed"`. So in demo mode the same P0-2 dead-UI problem applies: judges navigating the walkthrough never see the new confirm/decline UI surface mid-demo.

### P2 - UX rough edge

**P2-1. Profile photo never preloads on profile resume.**
- `ProfileForm` accepts `defaultPhotoUrl` (`src/components/onboarding/ProfileForm.tsx:76,86,99`).
- `ProfileOnboardingPage` (`src/app/[locale]/onboarding/profile/page.tsx:22-29`) never passes it.
- `getCurrentUser` (`src/lib/auth-current-user.ts:23-37`) does not even select `photoUrl`.

So a user who uploaded a photo, navigated forward, then back, sees the empty-camera placeholder. The DB row is correctly populated (`uploadProfilePhotoAction` in `src/lib/upload-actions.ts:88-91`).

**P2-2. ICS export has two divergent paths.**
- `IcsExportButton` (`src/components/event/IcsExportButton.tsx:54-86`) generates an .ics client-side with no auth check, no line folding, no description, no URL field. Used in the EventDetails panel.
- `/api/events/[eventId]/ics/route.ts` is the canonical, auth-checked, full-featured export. Used... by no UI in `src/`. `grep -rn '/api/events.*ics' src/` returns zero hits.

So Judge Mode and the in-screen one-click both go through the client-side stub; the auth-checked server route is never reached from the app.

**P2-3. EventDetailsPanel directions only links to Google Maps.**
`src/components/event/EventDetailsPanel.tsx:83-86`: hard-coded `https://maps.google.com/?q=...`. No Apple Maps, no Waze. Those exist only on `/map`'s `MapVenueSheet.tsx:44-56`. iOS users get a Maps-app-launch via Google's URL but it's a worse experience than the deep-link triad available in `MapVenueSheet`.

**P2-4. HeaderBell unread is server-rendered only.**
`src/components/layout/HeaderBell.tsx` consumes `unreadCount` as a prop set at server-render time. No SSE/poll. A new notification arriving while the user is on `/today` doesn't update the bell until they navigate or refresh. Per AGENTS.md "SSE polling is enough for hackathon scale" - the polling isn't there yet.

**P2-5. SaidNoCard "Change to Yes" has no handler.**
`src/components/today/TodayPromptCard.tsx:366-373` renders `TodaySaidNoCard` with a `changeLabel="Change to Yes"`, but `TodaySaidNoCard` is rendered statically from copy strings - no callback prop is passed. Users who hit "no" and regret it can only change by submitting the form again from the prompt card, which they won't see.

### P3 - Micro-friction

**P3-1. Wizard step counter inconsistency.**
`ProfileForm` says `step={1} total={3}` (`ProfileForm.tsx:254-258`); `SportsForm` says `step={2} total={3}` (line 240); `LocationForm` says `step={3} total={3}` (line 165). But `PhotoForm` (orphan page) says `step={4} total={4}` (line 196-198). Mixed totals could confuse a tester who lands on the photo page directly.

**P3-2. Today's Confirmed-card placeholders are obviously fake.**
`TodayPromptCard.tsx:391-400` hard-codes "Baza 2", "Tineretului · 2.1 km", "8 going · 2 maybe", and `setHours(18, 30, ...)` regardless of the real event time. Even though the state is unreachable today (P1-4), if it ever becomes reachable, the labels are pure decoration.

**P3-3. PhotoForm "Try the upload" status banner shows `previewOnly` after a successful upload, then clears.**
`PhotoForm.tsx:90-101`: state goes `setStatusBanner({tone:"info", message: t("previewOnly")})` → `setStatusBanner(null)` only after upload success. There's no "uploaded" success message, just a silent clear. Combined with `void uploadState;` (line 187) suppressing lint on the success state, the user has no positive feedback that the photo persisted.

**P3-4. Onboarding Profile photo upload's preview never updates after R2 returns.**
`ProfileForm.tsx:114-125`: sets `photoUrl` to the temp objectURL, then on success only updates `photoUrl` if `result.data.photoUrl` is set. R2 URL replacement should happen but the temp URL stays on screen until next render (works in practice, just relies on optimistic).

---

## Per-flow notes

### Flow 1: Signup → Onboarding (profile → sport → location) → /today
- Signup: form → `signupFormAction` → returns recovery code → `RecoveryCodeReveal` → continue → `/onboarding/profile`. ✓
- Login: `loginFormAction` → `nextPostLoginPath` redirects based on which onboarding fields are missing (`src/lib/auth-form-actions.ts:24-39`). ✓
- Profile (merged with photo): writes `users.fullName`, `users.bio`. AI suggestions persisted as query string `?suggested=...`. ✓ Refresh-resume works for fullName + bio (`getCurrentUser` returns those). ✗ for `photoUrl` (P2-1).
- Sports: writes `userSports` rows. Refresh-resume works (loads from `getOnboardingUserState`). Padel tile silently maps to tennis on submit (`SportsForm.tsx:78`); deduped on collision. ✓
- Location: writes `users.city/homeLat/homeLng/maxDistanceKm`. Geolocation button works with permission/denied/error states. Lands on `/today`. ✓
- Today gate: redirects backwards if any required field is missing (`src/app/[locale]/today/page.tsx:32-46`). ✓
- Photo step: orphan page (P1-1). The merged profile step photo upload writes correctly but never preloads (P2-1).

### Flow 2: /today prompt → match → group formation
- 5 explicit states declared (`TodayPromptCard.tsx:89`); `"confirmed"` is unreachable (P1-4) so really 5/6 are reachable.
- `prompt`: shown when no response yet. ✓
- `searching`: shown while a "yes" submit is pending. ✓
- `found`: shown when matchedGroup or `getMyTodayStateAction` returns a group. ✓
- `queued`: response yes + no group. Elapsed counter ticks every 15s (`TodayPromptCard.tsx:222-231`). No auto re-match (P1-3).
- `said-no`: response no. Change-to-Yes button is decorative (P2-5).
- `confirmed`: dead code path (P1-4).
- "Needs N more" surface: still missing. The 3-step `progress` array in `TodayQueuedCard` shows generic step labels, not membership counts. Prior-audit gap not closed.
- Match algorithm trigger: only on-vote / on-respond (P1-3).

### Flow 3: Match found → confirm/decline membership
- All confirm/decline UI is unreachable (P0-2). The server actions are correct, the card markup is correct, the i18n copy exists, but the precondition (`status="invited"`) is never produced by any code path.
- "Decline excludes from re-match" works via the `availabilityResponses.answer = 'no'` filter inside `candidatesForPrompt` (`src/lib/matching.ts:118-123`), but only if the user had answered "no" themselves; declining a match doesn't remove their "yes" availability response. So the "decline" button (if it ever rendered) would NOT exclude the user from being re-matched into a different group in the same window.

### Flow 4: Group → captain → event creation → venue vote
- Captain selection: earliest `respondedAt` (`src/lib/matching-core.ts:63-65`). Confirmed working.
- Event creation gating: captain-only (`src/lib/events.ts:216`); UI also gates on `isCaptain` (`src/app/[locale]/groups/[groupId]/page.tsx:228,278,471,509`). ✓
- Event creation (`createGroupEventAction`): inserts event, all members as eventAttendees status="going", 3 venue candidates from SEEDED_VENUES, 1 vote row, group system message, event system message. ✓
- One vote per user enforcement: `voteChoices.voteId,userId` PK (`src/db/schema.ts`); server upserts on conflict (`src/lib/votes.ts:78-84`). ✓ - but unreachable through canonical UI (P0-1).
- Vote close: doesn't happen (P0-4).
- Captain brief: generated per page render (`src/app/[locale]/events/[eventId]/page.tsx:96-108`), with deterministic fallback. ✓ Cached per request only (no persistence).

### Flow 5: Event page → RSVP → ICS export → calendar deep-link
- RSVP: `RsvpButtons` (`src/components/event/RsvpButtons.tsx:51-72`) → `updateEventRsvpAction` (`src/lib/events.ts:581-610`). Optimistic + rollback on failure. ✓
- ICS export: `IcsExportButton` is the in-screen path (P2-2). Server route `/api/events/[eventId]/ics/route.ts` does proper auth + line folding but is unused.
- Map deep-links: only Google Maps from EventDetailsPanel (P2-3). `MapVenueSheet` has Google/Apple/Waze; that's the `/map` page only.

### Flow 6: Notifications (header bell → inbox → mark read)
- Bell: server-rendered count (P2-4). Click → `/notifications`.
- Inbox: `NotificationInboxActions` (`src/components/notifications/NotificationInboxActions.tsx`) wires:
  - filter chips (all, unread, match, vote, event, chat) ✓
  - per-item mark-read (`handleMarkRead` line 111-124) → `markNotificationReadAction` ✓
  - mark-all-read (`handleMarkAllRead` line 126-135) → `markAllNotificationsReadAction` ✓
  - optimistic UI with rollback on failure ✓
- Empty + filtered-empty states with EmptyState ✓
- This flow is the **healthiest** in the audit.

### Flow 7: Demo / Judge Mode walkthrough
- `/demo/scripted/route.ts`: guards `isDemoModeEnabled`, calls `ensureDemoSeeded`, signs in as `demo_alex`, sets `s2m_walkthrough` cookie 1h, redirects to `/today`. ✓
- `WalkthroughNav` mounts conditionally on the cookie (`src/app/[locale]/layout.tsx:35`). Floating right-edge nav with prev/next + counter + arrow-key handlers. ✓
- 7 steps: today → groups → group → event → vote → calendar → judge.
- Step `group` and `event` resolvers (`src/app/[locale]/demo/step/[step]/route.ts:46-72`) query the demo user's first group/event and redirect. ✓
- Step `vote` does not differentiate from `event` (P1-5).
- The walkthrough cannot demonstrate confirm/decline (P0-2, P1-6) or actual venue voting (P0-1) because both flows are unreachable. Judges replaying see decorative panels.
- Replay determinism: ✓ for steps 1, 2, 6, 7 (static URLs); ✓ for steps 3, 4 (resolved via DB lookup with deterministic seed); ✗ for step 5 (lands on same URL as step 4).

---

## Verified clean

- Signup → recovery code → continue → onboarding/profile.
- Login → nextPostLoginPath → correct onboarding step or `/today`.
- Onboarding profile/sports/location → DB persist + refresh-resume (except photoUrl, P2-1).
- AI sport extraction from bio → query string → SportsForm pre-selection.
- Padel tile → tennis collision dedupe in submitEntries (`SportsForm.tsx:224-234`).
- Geolocation flow with permission/denied/error states.
- Today redirect gates on missing onboarding fields.
- TodayPromptCard derived states 1-4 (prompt/searching/found/queued).
- "no" answer flips groupMembers.status to "declined" (`src/lib/prompt.ts:212-223`) - useful even though the source rows that match are mostly nonexistent today.
- Captain-only event creation gating (UI and server).
- Auto-attendees as "going" on event creation.
- Per-event venue candidates (3 from SEEDED_VENUES).
- Captain brief generation with AI-then-fallback chain.
- RSVP optimistic + persisted (`updateEventRsvpAction`).
- Notifications: list, filter chips, per-item mark-read, mark-all-read, empty states, optimistic UI.
- Walkthrough mount gating via cookie + arrow-key shortcuts.
- Walkthrough resolver redirects for group/event steps.
- Demo seed insertion with `demoRunId` ownership marker.

End of audit.
