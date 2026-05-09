# 09 - Testing Strategy

## 1. Quality Bar

The app is demo-first but production-shaped. We need proof that:

- the app runs
- auth works
- AI fallbacks work
- matching creates valid groups
- chat/event workflows work
- Railway deployment has health checks
- mobile and desktop layouts do not break
- scoring claims have matching proof surfaces

## 2. Commands

Expected scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit --incremental false",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "check": "pnpm lint && pnpm typecheck && pnpm test && pnpm build",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "node --env-file=.env.local --import tsx scripts/seed.ts",
  "db:seed:demo": "node --env-file=.env.local --import tsx scripts/seed-demo.ts"
}
```

## 3. Unit Tests

Required:

- auth validation
- recovery code generation
- rate limiting
- safe redirects
- sport config group-size rules
- Haversine distance
- team balancing
- matching distance gate: 1km match, outside-radius no-match
- weather recommendation rules
- `.ics` generation
- AI output schema parsing
- Groq fallback paths
- price confidence labels
- event message scope validation
- upload MIME sniffing vs extension spoofing
- upload dimension/pixel-bomb rejection
- rate-limit bucket selection for auth, upload, AI, chat, demo, and SSE

## 4. Integration Tests

Use Vitest against a test Postgres database.

Required:

- signup/login/recovery
- onboarding profile update
- photo metadata save
- upload rejects unsupported MIME, extension spoof, >5 MB, and unsafe dimensions
- upload strips metadata, writes expected R2 key shape, and deletes old object on replacement
- availability prompt creation is idempotent
- Yes response triggers matching
- group formation respects sport size min/max
- simultaneous Yes responses do not create duplicate groups or memberships
- captain assigned exactly once
- chat message persists
- event-specific chat persists separately from group chat
- in-app notification is created and marked read
- event creation creates attendees
- voting allows one vote per user
- venue search fallback works
- demo seed/reset affects only demo-owned rows
- demo reset preserves a sentinel non-demo row
- AI cache returns seeded fallback when Groq is unavailable
- GDPR export/delete

## 5. E2E Tests

Use Playwright.

### 5.1 Happy Path

1. seed demo users
2. signup as new user
3. complete onboarding
4. use AI bio suggestion
5. answer ShowUpToday Yes
6. match into group
7. confirm participation
8. send chat message
9. create or confirm auto-event
10. send event-specific chat message
11. vote on venue/time
12. export calendar file
13. open Judge Mode scoring proof

### 5.2 Two-Browser Realtime

1. open two authenticated users in same group
2. user A sends chat
3. user B sees message via SSE within 2 seconds
4. captain starts vote
5. both browsers see live vote update
6. user A sends event-chat message
7. user B sees it only in the event thread

### 5.3 Mobile Layout

Viewports:

- iPhone SE width 375
- iPhone 15 width 393
- Android width 360
- tablet width 768
- desktop width 1440

Assertions:

- no horizontal overflow
- bottom nav visible
- prompt buttons are tappable
- chat input not hidden
- map bottom sheet usable
- tabs/segmented controls do not resize or overflow

## 6. Visual QA

Screenshots:

- landing
- signup
- onboarding bio
- onboarding sports
- today unanswered
- today matched
- group chat
- event chat
- notifications inbox
- event page
- map page
- Judge Mode
- settings/profile

Checks:

- no overlapping text
- stable card sizes
- readable contrast
- responsive layout
- logo visible and not distorted
- Judge Mode rows do not overclaim stretch integrations

## 7. Lighthouse

Run against production build:

```bash
pnpm build
pnpm start
pnpm exec lighthouse http://localhost:3000 --preset=desktop
DEMO_COOKIE='showup2move_session=<seeded-demo-session-cookie>'
pnpm exec lighthouse http://localhost:3000/today --preset=desktop --extra-headers "{\"Cookie\":\"$DEMO_COOKIE\"}"
pnpm exec lighthouse http://localhost:3000 --form-factor=mobile --screenEmulation.mobile=true --screenEmulation.width=390 --screenEmulation.height=844
pnpm exec lighthouse http://localhost:3000/today --form-factor=mobile --screenEmulation.mobile=true --screenEmulation.width=390 --screenEmulation.height=844 --extra-headers "{\"Cookie\":\"$DEMO_COOKIE\"}"
```

The `/today` Lighthouse artifacts must use an authenticated seeded demo session and fail if the final URL is `/login` or `/signup`.

Targets:

| Category | Target |
|---|---:|
| Performance | 95+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 95+ |

## 8. CI Gates

GitHub Actions:

1. install with frozen lockfile
2. lint
3. typecheck
4. unit tests
5. start Postgres service
6. run migrations
7. integration tests
8. build
9. Playwright smoke on built app
10. axe accessibility smoke for landing, signup, today, group, event, demo
11. Lighthouse artifact gate for `/` and `/today` on mobile and desktop

No deploy from a failing commit.

## 9. Manual Demo Checklist

Before presenting:

- Railway production URL opens
- `/api/health` returns ok
- seed demo accounts exist
- Groq key present
- photo analysis works or fallback is rehearsed
- map loads and list fallback works
- two-browser chat tested
- event chat tested separately from group chat
- calendar export downloaded
- language switch tested
- Judge Mode scoring status reviewed
- Strava/wearables row is hidden, marked stretch, or backed by real proof
- no visible console errors
