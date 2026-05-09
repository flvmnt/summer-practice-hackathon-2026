# 15 - Doc Refresh Plan

This file captures the merged review decisions from the repo specs, Claude synthesis, Codex review, and the downloaded planning pack. It is a control document for implementation and future spec edits.

## 1. Canonical Source

- Canonical docs: `docs/specs/*.md` in this repo.
- Planning pack: idea source only.
- Official rubric cap: **16,600p**.
- Do not use the pack's `16,900p` total. It counted Smart Matching as 2,800p; the upstream challenge uses 2,600p.

## 2. Non-Negotiable Product Loop

The demo must prove this loop:

```text
signup -> onboarding -> ShowUpToday -> match -> group chat -> event chat -> event plan -> venue/map/vote -> calendar/export -> Judge Mode proof
```

Everything else supports this loop or stays stretch.

## 3. Adopted Decisions

- Mobile-first responsive web app, not PWA.
- Curbe-style username/password/recovery-code auth with `iron-session`, `bcryptjs`, Drizzle, and server actions.
- Glamingo-style onboarding mechanics: URL-persisted steps, setup banner, sticky mobile action bar, strong empty/loading/error states.
- Cadentra/Glamingo discipline: zod contracts, typed env, CI gates, Playwright smoke, visual QA, production-shaped deploy.
- Cloudflare R2 for uploads; no Railway filesystem uploads.
- Railway web service plus optional Railway Cron; no Redis, BullMQ, socket.io, or separate worker by default.
- Numeric lat/lng plus Haversine for proximity; no PostGIS requirement.
- Groq text and vision models are env-configurable.
- Deterministic-first matching and event planning; AI explains and improves, but does not own hard gates.
- Real event-scoped chat keyed by `eventId`; group system messages alone do not satisfy event chat.
- Persistent in-app notification center; Web Push is stretch only.
- `.ics` calendar export is the committed calendar proof; Google Calendar OAuth is stretch.
- Wearables score is claimed only with working Strava OAuth/import or an explicitly accepted labeled fixture.
- Judge Mode shows rubric rows, live/seeded/fallback proof, health, AI cache status, and demo seed/reset.

## 4. Rejected Pack Scope

- Redis/BullMQ as required infra.
- PWA/Web Push as MVP.
- Google Calendar OAuth-first.
- Broad wearable provider abstraction.
- Facility owner dashboard.
- Payments or split settlement.
- Generic social feed/follows/stories.
- Dark-mode-first brand system.

## 5. Proof Requirements

Each claimed rubric row needs one of:

- live user action in the demo,
- seeded deterministic proof in Judge Mode,
- visible fallback state that honestly explains the limitation.

Rows that must not be overclaimed:

- Wearables/fitness: 0 unless working OAuth/import or accepted fixture.
- Web Push: stretch only; reminder proof comes from in-app/email.
- Event chat: must be event-scoped, not merely event messages in group chat.
- Proximity: must show near pass and out-of-radius fail.
- Maps: must show venue pins/list fallback/directions/privacy-safe location, not just a static map.

## 6. Final Build Order

1. Scaffold deployable Next.js app, CI, Railway health, typed env.
2. Auth/session/recovery and onboarding.
3. R2 photo upload and profile photo records.
4. Sports, location, max distance, and prompt response.
5. Deterministic matching, captain assignment, queue/no-match state.
6. Group chat, event chat, notifications.
7. Event creation, RSVP, venue candidates, price confidence, maps/directions.
8. Groq bio/photo extraction, compatibility explanations, AI Captain Brief, AI cache.
9. Calendar, weather, team balancing, i18n, sharing, achievements.
10. Judge Mode, demo seed/reset, scoring status, visual QA, Lighthouse, Railway smoke.
11. Optional Strava/wearables only after honest proof is possible.

## 7. Contradiction Watchlist

Future edits must not reintroduce:

- PostGIS/geography/GiST as required setup.
- Filesystem upload paths like `STORAGE_DIR/photos`.
- Group-only `messages` schema without `eventId`.
- `respondToPromptAction` and cron using different matching logic.
- Random-only captain assignment.
- Strava credit without proof.
- Web Push/PWA language as MVP.
- hour-budget-driven cuts as source of truth.
