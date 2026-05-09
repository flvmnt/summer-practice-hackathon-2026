# 13 - Scoring Rubric Coverage Audit

Audit timestamp: 2026-05-09 14:32
Specs verified against:
- `docs/specs/13-scoring-coverage.md` (rubric coverage table - canon)
- `docs/specs/00-overview.md` (per-category targets)
Cross-ref:
- `docs/audit/_partials-2026-05-09-1423/01-score-delta.md` (prior delta)
- `docs/audit/_partials-2026-05-09-1423/03-ai-wiring.md`
- `docs/audit/_partials-2026-05-09-1432-full-audit/05-phase4-ai.md`

Judge Mode page (rubric proof surface): `src/app/[locale]/demo/page.tsx` - rubric data sourced from `src/lib/demo/scoring-proofs.ts`.

## Headline

**Rubric coverage is internally inconsistent.** `13-scoring-coverage.md` enumerates 36 rubric rows; `scoring-proofs.ts` exposes 31 different categorized rows on the Judge Mode page. The two do not line up 1:1.

Of the rows that judges will inspect on `/demo`:

- **2 rows are overclaimed** (status = `live` or `seeded` in the proof data, but the underlying feature is missing or stubbed).
- **5 rows are subtly overclaimed via deceptive demo path** (status = `fallback`, but the AI/external path was never wired even once - the "fallback" is the entire feature; this is allowed by the spec but the row label implies an AI surface that does not exist).
- **8 rows on the spec rubric have no corresponding live UI surface and are silently absent from `/demo`** (e.g., Smart teammate recommendations, Photo→sport, AI Captain Brief Groq path, Match confirmation, Real-time SSE, Description matching with AI, Bio→sport AI in onboarding, Notifications/SSE reminders).

If the judge follows every `evidence` link from the Judge Mode page, **9 of the linked screens do not show the feature the row label promises**. This is the core risk surface.

The Judge Mode page itself is live and renders cleanly. The demo guard (`isDemoModeEnabled`) is in place so the page only renders under demo flag.

---

## 1. Mandatory Foundation (rubric §1, cap 1,300)

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| Application runs successfully | Railway service + `/api/health` | `src/app/api/health/route.ts`, `src/lib/health.ts` | `/api/health` (proof row "deployable-shell" 500p `live`) | **DONE** - health route + DemoHealth component on `/demo` show probe result. Railway service real. |
| Frontend/backend integration | Server actions + Drizzle | `src/lib/*-actions.ts` (auth, prompt, chat, vote, upload, notif), `src/db/schema.ts` (21 `pgTable` defs) | repo evidence link | **DONE** - every authed page server-action-driven. |
| Clean architecture | `src/app`/`src/lib`/`src/db` boundaries, zod contracts | `src/lib/contracts/*.ts` (auth/prompt/chat/vote/profile/event/invite/ai/demo) | `https://github.com/flvmnt/summer-practice-hackathon-2026` | **DONE** - boundaries respected; zod present in actions. |
| Responsive/mobile UI | 360px-first + bottom nav + desktop split | `src/components/layout/MobileTabBar.tsx`, `AppHeader.tsx`; group/event split-pane layouts | `/today` (proof row "responsive-mobile" 500p `live`) | **DONE** - visible across all main screens. |

Foundation: clean. No overclaims here.

---

## 2. User Profiles (rubric §2, cap 1,300)

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| Registration/login | iron-session + bcryptjs + recovery code | `src/lib/session.ts:2-3` (iron-session), `src/lib/auth.ts:100-142` (`signupAction` with bcrypt + `recoveryCodeHash`) | `/signup` (proof row "auth-core" 600p `live`) | **DONE** |
| Profile creation | Onboarding profile fields | `src/components/onboarding/ProfileForm.tsx` + `src/lib/onboarding.ts` | `/onboarding/profile` (proof row "profile-onboarding" 600p `live`) | **DONE** |
| Sports preferences | Sport chips + per-sport skill | `src/components/onboarding/SportsForm.tsx`, `src/lib/sports.ts` | `/onboarding/sports` (proof row "skill-level" 200p `live`) | **DONE** |
| Profile photo upload | upload, sharp re-encode, R2 | `src/lib/upload-actions.ts:21` (`uploadProfilePhotoAction`), `src/lib/uploads.ts` (sharp+webp), `src/lib/r2.ts` | `/onboarding/photo` (proof row "photo-upload" 500p **`pending`**) | **PARTIAL** - server action ships and is correct (MIME sniff + sharp + webp + R2 + DB row in `profile_photos`). PhotoForm.tsx **does NOT call it** (line 82-86 status banner literally reads "Photo uploads are being wired up - your photo will save in a later step"). Honestly labeled as `pending` on `/demo`. |
| Skill level/preferences | beginner/casual/competitive or 1..5 | `src/components/onboarding/SportsForm.tsx`; `users.skillLevel` numeric column | `/onboarding/sports` | **DONE** |

Photo upload row is honestly classified `pending`. Not an overclaim - but worth noting the server action is fully built and unwired (one-line UI hookup).

---

## 3. Smart Matching (rubric §3, cap 2,600)

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| ShowUpToday availability | prompt windows + Yes/No | `src/lib/prompt.ts:155` (`respondToPromptAction`), `src/components/today/TodayPromptCard.tsx` | `/today` (proof row "today-availability" 500p `live`) | **DONE** |
| Automatic sport matching | group formation after Yes | `src/lib/prompt.ts:215` calls `formGroupsForPromptAction`; `src/lib/matching.ts:255` + `src/lib/matching-core.ts:91` `formDeterministicGroups` | `/today` (proof row "smart-matching" 1500p `seeded`) | **DONE/SEEDED** - deterministic, runs against seeded users when user answers Yes. Honestly labeled `seeded`. |
| Description/interests matching | AI bio extraction + compatibility | bio: lib only (see Row 4 below); compat: `src/lib/profile-public.ts:200` calls `scoreCompatibility` | `/groups` (proof row "compatibility-explanation" 500p **`pending`**) | **OVERCLAIMED IN SPEC, HONEST IN CODE** - spec row promises "bio creates sport chips and reason"; in onboarding the bio→chip path is a **client stub** (`localBioSuggest` in `ProfileForm.tsx:56-85`), not Groq. Compat reason text is generated on `/u/[username]` but the spec says `/groups`. `/demo` row is `pending` - accurate. |
| Group-size aware matching | sport config min/ideal/max | `src/lib/sports.ts` (per-sport sizeMin/sizeIdeal); `matching-core.ts:107` enforces sizeMin | implicit via `/today` matching | **DONE** - config-driven, but no UI surfaces "needs N more" message |
| Nearby/proximity matching | numeric lat/lng + maxDistanceKm + Haversine | `src/lib/matching-core.ts:35-49` `haversineKm`; `users.maxDistanceKm` column; `compatibleByDistance` line 51 | implicit via `/today` matching | **DONE** |
| Match confirmation workflow | `confirmMembershipAction` user confirms spot | `src/lib/match-confirm-actions.ts:33` defined; `src/lib/match-confirm.ts` lib backed | `/groups` (proof row "match-confirmation" 300p **`pending`**) | **PARTIAL** - actions exist; ZERO UI callers (grep'd: only definition + spec note + scoring-proofs description). `TodayFoundCard` and `TodayConfirmedCard` show match outcome but contain no Confirm/Decline buttons calling these actions. Honestly classified as `pending`. |

---

## 4. AI / Smart Enhancements (rubric §4, cap 1,600) - MOST FRAGILE LANE

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| Identify sports from profile description | Groq text extraction; fallback keyword | Lib **DONE**: `src/lib/ai/bio-extract.ts:53` `extractSportsFromBio` (Groq + cache + fallback). Server action **DONE**: `src/lib/ai-actions.ts:15` `extractSportsForCurrentUserAction`. UI path **STUB**: `src/components/onboarding/ProfileForm.tsx:56-85` `localBioSuggest` - pure regex client side, never invokes server action. | `/onboarding/profile` (proof row "ai-bio-extraction" 500p **`fallback`**) | **OVERCLAIM (subtle).** Status `fallback` implies "AI tried, fell back to keywords." In reality the AI path is **never invoked** - the deterministic keyword stub runs in the browser on every submit. The judge clicking `/onboarding/profile` will never see an AI call. The 500p row is at risk. |
| Identify sports from profile photo | Groq vision extraction; fallback manual chips | Lib **MISSING**: no `photo-extract.ts` exists. `getVisionModel()` is exported (`src/lib/groq.ts:38`) but **0 callers** in src. UI stub: `src/components/onboarding/PhotoForm.tsx:48-54` `localPhotoAnalyze` returns hardcoded `[tennis, running, football]`. Comment at line 42-46 admits this is a stub. R2 photo upload also unwired (line 82 banner). | `/onboarding/photo` (proof row "ai-photo-extraction" 500p **`pending`**) | **MISSING - honest pending.** No vision lib, no server action, no caller. Demo row honestly `pending`. The 500p is unclaimed. |
| AI compatibility scoring | cached pair/group explanation; fallback deterministic | Lib **DONE**: `src/lib/ai/compat-score.ts:113` deterministic, `:192` AI-or-fallback. Caller **WIRED**: `src/lib/profile-public.ts:200` calls `scoreCompatibility`, surfaced on `/u/[username]` via `MatchPercentPanel` (page line 185). | `/groups` (proof row "ai-compatibility-score" 300p **`pending`**) | **MISCLAIMED PATH** - feature is wired but on `/u/[username]`, NOT on `/groups`. Demo row points judge to `/groups` where there is no compat surface. Score % is real and AI-backed when key present, deterministic otherwise. Row should be `live` (or `fallback` if no key) and link `/u/[username]`. |
| Smart teammate recommendations | ranked candidates; invite drawer | **MISSING** - no recommendations module, no ranking lib, no invite drawer, no UI surface. | `/groups` (proof row "ai-recommendations" 200p **`pending`**) | **MISSING - honest pending.** Note in scoring-proofs: "Ranked candidate suggestions land with invite drawer in Wave 3." 200p–300p unclaimed. |

The AI lane has 1,000p–1,300p sitting in working library code that was never wired to a UI caller (bio-extract action, captain brief, vision model). This is the biggest available point pool.

---

## 5. Communication (rubric §5, cap 1,600)

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| Group chat | persisted messages + send action | `src/lib/chat.ts` (postMessageAction), `src/lib/chat-form-actions.ts:16` `postGroupMessageFormAction`, `src/components/group/GroupChatForm.tsx` | `/groups` (proof row "group-chat" 500p **`fallback`**) | **PARTIAL** - chat send/persist works. SSE receive does NOT exist (see below). Status `fallback` = chat works without realtime. |
| Event-specific group chat | separate `eventId` message scope | `src/lib/chat.ts:558` `postEventMessageAction`, `eventId` keyed; `src/components/event/EventChatForm.tsx` separate composer | `/events` (proof row "event-chat" 500p `live`) | **DONE** - separate eventId-scoped posting verified by code inspection. |
| Notifications/reminders | persistent center + SSE reminder + email if configured | Center: `src/lib/notifications.ts` (listNotifications, markRead), `src/lib/notification-actions.ts` (3 actions). UI: `src/app/[locale]/notifications/page.tsx` + `NotificationInboxActions` (calls `markNotificationReadAction`, `markAllNotificationsReadAction`). | `/notifications` (proof row "notifications" 300p `live`) | **PARTIAL→OK** - notification center and read actions are wired (corrects the 14:23 score-delta partial which said unwired). Email/SSE reminder paths **MISSING** entirely. Status `live` is fair for the center; the broader rubric row claims more than what ships. |
| Real-time updates | SSE streams for chat/prompt/votes | **MISSING** - `grep -rn "EventSource\|text/event-stream" src/` returns zero. No SSE route. | (no proof row) | **MISSING - silently absent from /demo.** Spec promises "two-browser message appears within 2s" via SSE. None of that is wired. The spec target was 200p of 300p; effective claim is 0. |

---

## 6. Event & Location Coordination (rubric §6, cap 4,100)

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| Automatic captain assignment | heuristic earliest-respondent + tie-break | `src/lib/matching-core.ts:63` `captainFor` sorts by respondedAt; `groups.captainUserId` persisted | `/groups` (proof row "captain-assignment" 500p `live`) | **DONE** - captain pill surfaces on group page line 147 and FormationTimeline explains it. |
| Auto-event setup + AI Captain Brief | deterministic venue/time ranking + AI brief | Deterministic UI shipped: `src/components/group/CaptainBriefPanel.tsx` rendered at `groups/[groupId]/page.tsx:148` with hardcoded suggestedVenue/Time/weather=null. `src/lib/ai/captain-brief.ts:123` `generateCaptainBrief` exists, tested, **0 callers in src**. | `/events` (proof row "auto-event-setup" 1000p **`fallback`**) | **OVERCLAIM (subtle).** Status `fallback` implies "AI brief generated, fell back to deterministic." In reality the AI path **was never invoked once** - `generateCaptainBrief` is dead code (`grep` confirms). The deterministic CaptainBriefPanel renders empty/placeholder ("Pick a venue · Tap to suggest"; weather null). Even the deterministic path is shallow. The 1000p row is at risk; should be downgraded to `pending` or capped at 400p–600p. |
| Manual event creation | event form | `src/app/[locale]/events/new/page.tsx` (captain group picker) + `src/components/group/CreateGroupEventForm.tsx` | `/events` (proof row "manual-event" 500p **`pending`**) | **DONE BUT MISCLASSIFIED** - `/events/new` page exists and renders `CreateGroupEventForm`. Note in scoring-proofs says "standalone /events/new is not wired" but `events/new/page.tsx` IS present (verified by file read). Demo proof should be `live` (or `seeded`). 500p left on the table by overly conservative classification. |
| Venue/location suggestions | seeded + cached + Overpass + manual | Seeded venues only: `src/components/map/seed-venues.ts` (client) and `venues` table seeded. Manual: `customLocationText` in events. **Overpass: NOT IMPLEMENTED** - no `api.overpass`/`overpass-api` URL anywhere in src. | `/map` (proof row "venue-suggestions" 500p **`seeded`**) | **OVERCLAIM (subtle).** Note claims "Seeded venues + Overpass cache + manual entry" - Overpass cache is fictional. Honest reframe: seeded + manual only. Acceptable as `seeded` because the surface works against seed data; but the demo row's note misleads. |
| Price estimation | heuristic price tier + confidence label | `venues.priceTier` column + `PRICE_LABEL` mapping in `MapVenueSheet.tsx:142`. No `priceConfidence` column or "verified/captain_entered/estimated/unknown" labels visible in code. | implicit on `/map` (no separate proof row) | **PARTIAL** - `$/$$/$$$` chip renders; the spec's "verified/captain_entered/estimated/unknown" confidence ladder is **not present** in code. Spec promises more than ships. |
| Group voting/polling system | votes, choices, live counts | `src/lib/votes.ts`, `src/components/event/VoteCard.tsx`, `VenueVoteForm.tsx` calls `castVenueVoteFormAction` | `/events` (proof row "voting" 500p `live`) | **DONE** (counts shown, captain manual decision exists as path) - but live count update needs page refresh (no SSE). |
| Maps/location assistance | MapLibre + list fallback + radius + directions | `src/components/map/MapInner.tsx:58-91` lazy-loads maplibre, places markers; `MapDeniedFallback.tsx` for no-geo state; `MapVenueSheet.tsx:156-194` Google/Apple/Waze deep-link buttons | `/map` (proof row "maps-fallback" 1000p `live`) | **DONE** |

Significant note: the Captain Brief 1000p row is the single biggest overclaim risk in this lane. The CaptainBriefPanel UI renders, so a casual judge sees something - but the AI text path the row description promises is non-existent.

---

## 7. Bonus Features (rubric §7, cap 2,100)

| Rubric row (spec) | Promised feature | Code site | Judge Mode link | Honest verdict |
|---|---|---|---|---|
| Calendar integration | `.ics` export | `src/lib/calendar.ts` (buildIcsCalendar with line folding); `src/app/api/events/[eventId]/ics/route.ts`; `src/components/event/IcsExportButton.tsx` used on `/events` and `/calendar` pages | `/events` (proof row "calendar-export" 300p `live`) | **DONE** - real route, real .ics output, RO/EN locale param. |
| Weather-aware recommendations | Open-Meteo rules | `src/lib/weather.ts:93` `getOpenMeteoForecast` (real fetch with abort signal); called from `src/app/[locale]/events/[eventId]/page.tsx:8` | `/events` (proof row "weather-aware" 300p **`fallback`**) | **DONE/PARTIAL** - Open-Meteo really called, with deterministic null fallback when API stalls or returns malformed. Status `fallback` reflects the per-event uncertainty. Solid. |
| Team balancing by skill | snake-draft teams | `src/lib/team-balance.ts` (tested in `team-balance.test.ts`), `src/components/group/TeamBalancePanel.tsx` rendered at `groups/[groupId]/page.tsx:208` | `/groups` (proof row "team-balance" 300p `live`) | **DONE** |
| Gamification/achievements | achievements table + badges | `achievements` table (`src/db/schema.ts:297-311`); `getLeaderboardAction` in `src/lib/leaderboard.ts`; First Match badge surfaces on `groups/[groupId]/page.tsx:136-141`; `/leaderboard` page wired | `/groups` (proof row "achievements" 300p `live`) | **DONE for First Match only** - note in scoring-proofs honestly limits to First Match; "Showed Up 3 Times" is unclaimed. Leaderboard at `/leaderboard` is real. |
| Multi-language support | RO/EN with next-intl | `src/i18n/routing.ts:4` (locales: ro, en); `src/i18n/request.ts`; `messages/{ro,en}/` JSONs | `/en` (proof row "i18n" 200p `live`) | **DONE** |
| Social sharing/invites | event invite link + share sheet | `src/lib/invites.ts` (token generation); `src/app/[locale]/i/[token]/page.tsx` invite preview with OG metadata + expired state; `src/components/event/EventInvitePanel.tsx:66-74` uses `navigator.share` | `/events` (proof row "invite-share" 100p `live`) | **DONE** |
| Wearables/fitness integrations | Strava OAuth/import OR labeled fixture | `src/app/[locale]/settings/page.tsx:68-69, 157-159, 418-438` shows greyed "Coming soon" Strava button. No OAuth flow, no import. | (no proof row on /demo) | **MISSING - correctly omitted from /demo per AGENTS.md "no fake credit" rule.** Greyed button = 0 points per spec. The Settings page has the row visible to judges; if asked, "Coming soon" badge clearly disclaims it. **No overclaim.** |

Bonus row honesty is good. Gamification and Strava are both classified per the spec's "no fake credit" mandate.

---

## 8. Innovation Bonus (rubric §8, cap 2,000)

The spec is descriptive (8 bullet stories), not enumerated rows. `/demo` rolls innovation into:

| Proof row on /demo | Points | Status | Underlying claim | Verdict |
|---|---:|---|---|---|
| `clean-architecture` | 500 | `live` | `src/app + src/lib + src/db boundaries; zod-validated server actions` | **DONE** |
| `responsive-mobile` | 500 | `live` | "360px-first; bottom nav; sticky composers; Playwright screenshots" | **DONE** in code; Playwright screenshots referenced in `e2e/` and `.playwright-cli/` artifacts |
| `judge-mode` | 200 | `live` | "Guarded route, live/seeded/fallback per row, no false-green claims" | **DONE** - page renders, demo guard live, but **the proof rows themselves contain mislabeled `fallback` rows** (see §4 + §6 of this audit). The "no false-green claims" promise is partially betrayed. |

Innovation lane is acceptable. The "Group Formation Timeline" row promised in spec §8.8 is a real component (`FormationTimeline.tsx`, used on `/groups/[groupId]:160`) but has no dedicated proof row in `/demo`.

---

## 9. Cross-cutting: Judge Mode page integrity

`src/app/[locale]/demo/page.tsx`:
- ✅ Demo guard via `isDemoModeEnabled()` (line 45) - won't render in prod without flag.
- ✅ DemoHealth shows `users / groups / events / aiCacheEntries` counts via `safeCount` (lines 73-79).
- ✅ Each rubric row gets its own card via `RubricSection` → `ScoringProofRow`.
- ✅ Status legend ("Live / Seeded / Fallback / Pending") with point counts in footer.
- ⚠️ `aiCacheEntries` count probably **always shows 0** - `scripts/seed-demo.ts` doesn't preload `ai_cache` rows, per phase4-ai partial (line 30). DemoHealth will surface this honestly but visitors may misread it as "AI not configured."
- ⚠️ Two evidence links (`compatibility-explanation` + `ai-compatibility-score`) point to `/groups` but the actual feature lives on `/u/[username]`. Judge clicking these sees nothing.
- ⚠️ Two evidence links (`ai-bio-extraction`, `auto-event-setup`) labeled `fallback` imply an AI path that was never invoked once.

---

## 10. Rubric-row × verdict matrix (consolidated)

Cap totals from spec §00 overview (per-category targets table).

| # | Rubric row (spec) | Cap | Demo proof status | Live UI? | Verdict | Pts at risk |
|---|---|---:|---|---|---|---:|
| 1 | App runs successfully | 500 | `live` | ✅ /api/health | DONE | 0 |
| 2 | Frontend/backend integration | 300 | (covered by clean-arch) | ✅ | DONE | 0 |
| 3 | Clean architecture | 300 | `live` | ✅ repo | DONE | 0 |
| 4 | Responsive/mobile UI | 200 | `live` | ✅ /today | DONE | 0 |
| 5 | Registration/login | 300 | `live` | ✅ /signup | DONE | 0 |
| 6 | Profile creation | 300 | `live` | ✅ /onboarding/profile | DONE | 0 |
| 7 | Sports preferences | 300 | `live` | ✅ /onboarding/sports | DONE | 0 |
| 8 | Profile photo upload | 200 | `pending` | ❌ stubbed UI | PARTIAL (lib ready) | ~120 still recoverable |
| 9 | Skill levels | 200 | `live` | ✅ /onboarding/sports | DONE | 0 |
| 10 | ShowUpToday availability | 500 | `live` | ✅ /today | DONE | 0 |
| 11 | Auto sport matching | 500 | `seeded` | ✅ seeded /today→Yes | DONE | 0 |
| 12 | Description matching (AI) | 500 | `pending` (also `fallback` for bio-extraction row) | ❌ AI never invoked; client stub | **MISSING - masked as fallback** | up to 500 |
| 13 | Group-size aware matching | 300 | (implicit) | ✅ in matching algo | DONE (no UI banner) | 0–50 |
| 14 | Proximity matching | 500 | (implicit, real Haversine) | ✅ | DONE | 0 |
| 15 | Match confirmation | 300 | `pending` | ❌ actions exist, no UI button | PARTIAL (lib ready) | ~250 |
| 16 | Bio→sport (AI) | 500 | `fallback` | ❌ stub never calls Groq | **OVERCLAIM** | 500 |
| 17 | Photo→sport (vision) | 500 | `pending` | ❌ no lib, no surface | MISSING | 500 |
| 18 | AI compatibility scoring | 300 | `pending` (proof row points to wrong page) | ✅ on /u/[username] | **MISCLASSIFIED** (should be `live`) | reverse: ~200 recoverable |
| 19 | Smart teammate recommendations | 300 | `pending` | ❌ no module | MISSING | 300 |
| 20 | Group chat | 500 | `fallback` | ✅ post works, no SSE | PARTIAL | 0–100 |
| 21 | Event-specific chat | 500 | `live` | ✅ separate eventId scope | DONE | 0 |
| 22 | Notifications/reminders | 300 | `live` | ✅ center + mark-read; ❌ SSE/email reminder | PARTIAL | ~100 |
| 23 | Real-time updates | 300 | (no proof row) | ❌ no SSE anywhere | **MISSING - silently absent** | 200 |
| 24 | Auto captain | 300 | `live` | ✅ captain pill | DONE | 0 |
| 25 | Auto-event setup + AI brief | 1000 | `fallback` | ✅ deterministic panel; ❌ AI path never invoked | **OVERCLAIM** | up to 600 |
| 26 | Manual event creation | 500 | `pending` (proof row outdated) | ✅ /events/new exists | **MISCLASSIFIED** (should be `live`) | reverse: ~470 recoverable |
| 27 | Venue suggestions | 500 | `seeded` (note mentions Overpass - not implemented) | ✅ seeded only | PARTIAL (note misleads) | 0–150 |
| 28 | Price estimation | 300 | (covered by venue-suggestions) | ✅ tiers shown; ❌ no confidence ladder | PARTIAL | ~100 |
| 29 | Voting | 500 | `live` | ✅ vote + counts (no SSE) | DONE | 0 |
| 30 | Maps assistance | 1000 | `live` | ✅ MapLibre + fallback + 3 directions providers | DONE | 0 |
| 31 | Calendar (.ics) | 300 | `live` | ✅ /events + /calendar | DONE | 0 |
| 32 | Weather-aware | 300 | `fallback` | ✅ Open-Meteo real call | DONE | 0 |
| 33 | Team balancing | 300 | `live` | ✅ /groups | DONE | 0 |
| 34 | Gamification | 300 | `live` (capped to First Match) | ✅ badge + leaderboard | DONE | 0 |
| 35 | Multi-language | 200 | `live` | ✅ /en, /ro | DONE | 0 |
| 36 | Social sharing/invites | 200 | `live` | ✅ /i/[token] + share sheet | DONE | 0 |
| 37 | Wearables (Strava) | 500 | (omitted - correct) | ❌ greyed "Coming soon" | MISSING (correctly omitted) | 0 |
| 38 | Innovation: Captain Brief story | (~) | (folded into auto-event-setup) | ❌ AI never runs | rolled into row 25 | (already counted) |
| 39 | Innovation: Group Formation Timeline | (~) | (no dedicated proof row) | ✅ FormationTimeline component | DONE (uncredited) | reverse: 50–100 recoverable in innovation lane |

---

## 11. Overclaim list (the headline output)

These are rows where the Judge Mode page or spec promises more than the code delivers. **Total overclaim count: 5 hard overclaims + 4 soft/spec-vs-code drift items = 9 issues.**

### Hard overclaims (judge-visible, fix-or-relabel before demo)

1. **`ai-bio-extraction` (500p, status=`fallback`, evidence=`/onboarding/profile`)**
   - Implied: Groq attempted, fell back to keywords.
   - Reality: `extractSportsForCurrentUserAction()` is **never called**. UI runs `localBioSuggest()` regex stub on the client. Groq is never reached.
   - Fix: either wire the action (5 min) or downgrade row to `pending`.
   - Files: `src/components/onboarding/ProfileForm.tsx:130-150` (calls stub), `src/lib/ai-actions.ts:15` (the orphan action).

2. **`auto-event-setup` (1000p, status=`fallback`, evidence=`/events`)**
   - Implied: AI Captain Brief generated with deterministic fallback.
   - Reality: `generateCaptainBrief()` has **zero callers** (grep verified). `CaptainBriefPanel.tsx` renders deterministic placeholders only ("Pick a venue · Tap to suggest", `weather={null}`).
   - Fix: wire `generateCaptainBrief` from event creation handler (10 min) or downgrade row + cap row to deterministic ~400p.
   - Files: `src/lib/ai/captain-brief.ts:123` (orphan), `src/app/[locale]/groups/[groupId]/page.tsx:148-157` (placeholder render).

3. **`ai-compatibility-score` (300p, status=`pending`, evidence=`/groups`)**
   - Implied: feature pending.
   - Reality: feature is **WIRED** on `/u/[username]` via `MatchPercentPanel`, just pointed at the wrong route.
   - Fix: change `evidence` to `/u/[username]`, change status to `live` or `fallback`. Recovers ~200p.
   - Files: `src/lib/profile-public.ts:200`, `src/app/[locale]/u/[username]/page.tsx:185`.

4. **`manual-event` (500p, status=`pending`, evidence=`/events`, note "standalone /events/new is not wired")**
   - Implied: only group-captain event creation works.
   - Reality: `src/app/[locale]/events/new/page.tsx` IS shipped and renders captain-group picker → CreateGroupEventForm. The "not wired" note is stale.
   - Fix: change status to `live`, evidence to `/events/new`. Recovers ~470p.

5. **`venue-suggestions` (500p, status=`seeded`, note mentions Overpass cache)**
   - Implied: seeded + Overpass + manual.
   - Reality: no Overpass code (`grep -rn "overpass"` in src returns 0 hits). Seeded-only + custom location text.
   - Fix: rewrite note to "seeded venues + manual entry; Overpass live optional" or implement a thin Overpass fetcher with cache.

### Soft overclaims / spec-vs-code drift

6. **Real-time SSE (300p) silently absent.** Rubric §5 promises "two-browser message appears within 2s" and overview §6.3 lists SSE. Code has zero SSE implementation. No proof row on `/demo` so judge cannot fail it explicitly, but `00-overview.md` claims `200p` of `300p`. Drift between specs and code.

7. **`group-chat` row (500p, `fallback`).** Status implies "fallback to non-realtime"; no SSE means realtime is the only path that was ever planned, and it never shipped. Defensible label, but if a judge tests with two browsers, message won't appear without refresh.

8. **`notifications` row (300p, `live`).** Center is wired; spec promises "in-app SSE reminder + email if configured." Email and SSE reminder paths are absent. Center read state works - `live` is fair for a partial slice.

9. **Price-confidence ladder (rubric §6).** Spec promises confidence labels: `verified / captain_entered / estimated / unknown`. Code shows only `$/$$/$$$` price tier. No `priceConfidence` column or label visible. Spec drift on roughly 100p.

### Net overclaim accounting

If a strict judge audited every claim:

| Direction | Approximate Δ |
|---|---:|
| Lose to overclaims #1, #2 | −500 to −1,100p (bio AI + captain brief AI) |
| Recover from misclassifications #3, #4 | +470 to +670p (manual-event + compat-score relabel) |
| Soft drift items #6–#9 | −200 to −400p depending on judge strictness |
| **Net risk band** | **−230 to −830p** |

The score-delta partial calls today's standing ~12,750p. A strict-judge worst case is ~11,920p; a charitable best case after relabeling and the two ~10-min wiring fixes is ~13,400p.

---

## 12. Recommendations (in priority order, by points-per-minute)

1. **Relabel `manual-event` row** to `live` and point evidence at `/events/new`. Cost: 30 seconds. Recovery: ~470p. (No code change needed - the page exists.)

2. **Relabel `ai-compatibility-score` row** to `live` (or `fallback`) and point evidence at `/u/[username]`. Cost: 30 seconds. Recovery: ~200p.

3. **Wire `extractSportsForCurrentUserAction()`** into `ProfileForm.handleSuggest`. Replace `localBioSuggest` call with a server-action invocation. Cost: ~10 min. Recovery: ~500p (and lifts the ai-bio-extraction row from overclaim → honest `live`/`fallback`).

4. **Wire `generateCaptainBrief()`** from group/event captain reveal in `CaptainAutoEventReveal.tsx` or `groups/[groupId]/page.tsx:148`. Cost: ~15 min. Recovery: ~600p (lifts auto-event-setup from overclaim → honest fallback/live).

5. **Wire `confirmMembershipAction`** as a Confirm/Decline button row inside `TodayFoundCard`. Cost: ~10 min. Recovery: ~250p.

6. **Wire `uploadProfilePhotoAction`** into `PhotoForm.handleFile`. Cost: ~10 min. Recovery: ~120p (and removes the "photo uploads being wired up" status banner that judges will read).

7. **Remove or rewrite the Overpass mention** in `venue-suggestions` proof note. Cost: 30 seconds. Removes a false claim.

If steps 1–6 land, the net swing is roughly **+2,140p** vs current effective claims, lifting the run to ~14,890p / 16,600p (89.7%) - well into the 13,000–13,700p target band with honest claims, headroom to spare.

---

## 13. What is NOT overclaimed (worth keeping front-of-house in the demo)

- `/demo` page itself: clean, guarded, honest layout. The Judge Mode innovation row is genuinely earned.
- Auth (signup/login/recovery): no shortcuts; iron-session + bcrypt + recovery code all real.
- Calendar `.ics`: real route with line folding, locale param, RO/EN descriptions.
- Open-Meteo weather: real network call with timeout fallback.
- MapLibre + 3-provider directions (Google/Apple/Waze): real implementation with denied-location list fallback.
- Invite share with privacy-safe `/i/[token]` preview: real OG metadata + expired state + `noindex`.
- i18n RO/EN with `next-intl`: full coverage in `messages/{ro,en}/`.
- Match algorithm in `matching-core.ts`: real Haversine, real per-sport size config, real captain selection.
- Snake-draft team balance: tested in `team-balance.test.ts`.
- Strava: correctly NOT claimed; "Coming soon" badge per the AGENTS.md "no fake credit" rule.

---

## Appendix A: File index for verifications

- Judge Mode page: `src/app/[locale]/demo/page.tsx:1-242`
- Rubric data: `src/lib/demo/scoring-proofs.ts:1-433`
- AI libs: `src/lib/ai/{bio-extract,compat-score,captain-brief,cache,sport-keywords}.ts`
- AI server-action wrappers: `src/lib/ai-actions.ts`
- Match-confirm: `src/lib/match-confirm.ts`, `src/lib/match-confirm-actions.ts`
- Matching: `src/lib/matching.ts`, `src/lib/matching-core.ts`
- Notifications: `src/lib/notifications.ts`, `src/lib/notification-actions.ts`, `src/app/[locale]/notifications/page.tsx`, `src/components/notifications/NotificationInboxActions.tsx`
- Group page wiring: `src/app/[locale]/groups/[groupId]/page.tsx`
- Event page wiring: `src/app/[locale]/events/[eventId]/page.tsx`, `src/app/[locale]/events/new/page.tsx`
- Onboarding stubs: `src/components/onboarding/{ProfileForm,PhotoForm}.tsx`
- Public profile: `src/lib/profile-public.ts`, `src/app/[locale]/u/[username]/page.tsx`, `src/components/profile/MatchPercentPanel.tsx`
- Calendar export: `src/lib/calendar.ts`, `src/app/api/events/[eventId]/ics/route.ts`, `src/components/event/IcsExportButton.tsx`
- Weather: `src/lib/weather.ts`, called from `src/app/[locale]/events/[eventId]/page.tsx:8`
- Map: `src/components/map/{MapInner,MapVenueSheet,MapPageClient,MapDeniedFallback}.tsx`
- Invites: `src/lib/invites.ts`, `src/app/[locale]/i/[token]/page.tsx`, `src/components/event/EventInvitePanel.tsx`
- Strava (greyed): `src/app/[locale]/settings/page.tsx:68-69, 157-159, 418-438`

## Appendix B: Greps that drove the overclaim findings

- `extractSportsForCurrentUserAction` callers: only the definition + spec. UI uses `localBioSuggest`.
- `generateCaptainBrief` callers: only the definition + tests. **Zero UI callers.**
- `getVisionModel` usages: only in `groq.ts` itself. **Zero usages elsewhere in src.**
- `confirmMembershipAction` / `declineMembershipAction` callers: only in `match-confirm-actions.ts` + spec note + scoring-proofs description.
- `EventSource` / `text/event-stream` in src: **zero matches** → no SSE.
- `overpass` in src: **zero matches** → no Overpass API usage.
- `uploadProfilePhotoAction` callers: only its definition. PhotoForm uses local stub + status banner.
