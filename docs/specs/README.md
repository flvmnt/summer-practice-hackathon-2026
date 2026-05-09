# ShowUp2Move — Planning Specs

Single source of truth for what we're building, why, how, and in what order.

> **Status:** planning. No code yet. The implementation plan in [`12-implementation-plan.md`](12-implementation-plan.md) is the order of operations.

## How to read this set

Read in order on first pass. After that, jump to whatever you need.

| # | Doc | What it answers |
|---|---|---|
| 00 | [overview](00-overview.md) | What is ShowUp2Move, what's the scope, **how do we target a high score without fake credit** |
| 01 | [architecture](01-architecture.md) | Stack, single-app shape, deploy target |
| 02 | [data model](02-data-model.md) | Postgres schema (Drizzle), ER diagram |
| 03 | [server actions & routes](03-server-actions-and-routes.md) | Every server action + route handler |
| 04 | [auth & profile](04-auth-and-profile.md) | curbe-pattern auth (iron-session + recovery code) |
| 05 | [AI features](05-ai-features.md) | Groq usage, prompts, vision, fallbacks |
| 06 | [UI flows](06-ui-flows.md) | Every screen, ASCII wireframes, navigation |
| 07 | [design system](07-design-system.md) | Tokens, components, motion, accessibility |
| 08 | [bonus features](08-bonus-features.md) | Calendar, weather, gamification, i18n, sharing, optional wearables |
| 09 | [testing strategy](09-testing-strategy.md) | Unit, integration, E2E, CI gates |
| 10 | [prod readiness](10-prod-readiness.md) | Security, GDPR, observability, rate limiting |
| 11 | [deployment (Railway)](11-deployment-railway.md) | Services, envs, CI/CD, secrets |
| 12 | [implementation plan](12-implementation-plan.md) | Phases, atomic tasks, demo-critical build order |
| 13 | [scoring coverage](13-scoring-coverage.md) | Every rubric row mapped to feature, proof, and fallback |
| 14 | [matching & event algorithm](14-matching-and-event-algorithm.md) | Exact group formation, captain, venue, price, weather, and team-balance rules |
| 15 | [doc refresh plan](15-doc-refresh-plan.md) | Consolidated decisions from Claude, Codex, and planning-pack review |

## TL;DR

- **What:** sports group-matching platform — describe yourself, set sports, answer "ShowUpToday?", get matched, chat, show up.
- **Stack:** Next.js 16 App Router + Drizzle + Postgres + iron-session + Groq + Tailwind 4 + shadcn/ui. One process. Deploys to Railway.
- **Auth:** curbe-pattern — username + password + one-time recovery code (no email required).
- **AI:** Groq for sport extraction, compatibility scoring, recommendations, and AI Captain Brief. Model IDs are env-configurable because Groq permissions can vary by project.
- **Realtime:** SSE for chat & prompts (no socket.io, no Redis).
- **Scoring target:** **~13,000-13,700 / 16,600 max** with no fake credit. Wearables count only if a real OAuth/import path or clearly accepted demo fixture ships. See [00-overview.md §5](00-overview.md#5-scoring-strategy).

## Reference projects

- **`curbe`** — profile + auth shape (iron-session, recovery code, Drizzle, server actions).
- **`Glamingo` / `Cadentra`** — code-organization discipline (zod everywhere, lib/ split, contracts pattern, lint/format/test gates).

## Current decisions after review

- Keep the repo specs as canonical; the downloaded planning pack is an idea source, not a replacement.
- Use numeric `lat/lng` + Haversine for proximity. Do **not** require PostGIS for this hackathon build.
- Use Cloudflare R2 for profile photos. Do **not** store uploads on Railway disk.
- Use one Next.js app plus an optional Railway Cron script. Do **not** add Redis, BullMQ, socket.io, or a separate worker by default.
- Treat Web Push, Google Calendar OAuth, and live Strava OAuth as stretch. MVP proof is in-app notifications, email reminders if configured, and `.ics` calendar export.
- Add a guarded Judge/Demo mode so scoring proof is visible and resettable during presentation.

## Conventions in these docs

- ASCII diagrams over images. Render fine in any markdown viewer.
- "MUST", "SHOULD", "MAY" follow RFC 2119.
- Code samples are illustrative — they live in specs, not in source. Source comes later.
- Every cross-doc link is relative.
