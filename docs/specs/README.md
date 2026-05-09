# ShowUp2Move — Planning Specs

Single source of truth for what we're building, why, how, and in what order.

> **Status:** planning. No code yet. The implementation plan in [`12-implementation-plan.md`](12-implementation-plan.md) is the order of operations.

## How to read this set

Read in order on first pass. After that, jump to whatever you need.

| # | Doc | What it answers |
|---|---|---|
| 00 | [overview](00-overview.md) | What is ShowUp2Move, what's the scope, **how do we hit max points** |
| 01 | [architecture](01-architecture.md) | Stack, single-app shape, deploy target |
| 02 | [data model](02-data-model.md) | Postgres schema (Drizzle), ER diagram |
| 03 | [server actions & routes](03-server-actions-and-routes.md) | Every server action + route handler |
| 04 | [auth & profile](04-auth-and-profile.md) | curbe-pattern auth (iron-session + recovery code) |
| 05 | [AI features](05-ai-features.md) | Groq usage, prompts, vision, fallbacks |
| 06 | [UI flows](06-ui-flows.md) | Every screen, ASCII wireframes, navigation |
| 07 | [design system](07-design-system.md) | Tokens, components, motion, accessibility |
| 08 | [bonus features](08-bonus-features.md) | Calendar, weather, gamification, i18n, sharing, Strava |
| 09 | [testing strategy](09-testing-strategy.md) | Unit, integration, E2E, CI gates |
| 10 | [prod readiness](10-prod-readiness.md) | Security, GDPR, observability, rate limiting |
| 11 | [deployment (Railway)](11-deployment-railway.md) | Services, envs, CI/CD, secrets |
| 12 | [implementation plan](12-implementation-plan.md) | Phases, atomic tasks, hour budget |
| 13 | [scoring coverage](13-scoring-coverage.md) | Every rubric row mapped to feature, proof, and fallback |
| 14 | [matching & event algorithm](14-matching-and-event-algorithm.md) | Exact group formation, captain, venue, price, weather, and team-balance rules |

## TL;DR

- **What:** sports group-matching platform — describe yourself, set sports, answer "ShowUpToday?", get matched, chat, show up.
- **Stack:** Next.js 16 App Router + Drizzle + Postgres + iron-session + Groq + Tailwind 4 + shadcn/ui. One process. Deploys to Railway.
- **Auth:** curbe-pattern — username + password + one-time recovery code (no email required).
- **AI:** Groq (`llama-3.3-70b-versatile` for text + `meta-llama/llama-4-scout-17b-16e-instruct` for vision) for sport extraction, compatibility scoring, and recommendations. Keep model IDs configurable because Groq permissions can vary by project.
- **Realtime:** SSE for chat & prompts (no socket.io, no Redis).
- **Scoring target:** **~13,500 / 16,600 max** with full coverage of every category. See [00-overview.md §4](00-overview.md#4-scoring-strategy).

## Reference projects

- **`curbe`** — profile + auth shape (iron-session, recovery code, Drizzle, server actions).
- **`Glamingo` / `Cadentra`** — code-organization discipline (zod everywhere, lib/ split, contracts pattern, lint/format/test gates).

## Conventions in these docs

- ASCII diagrams over images. Render fine in any markdown viewer.
- "MUST", "SHOULD", "MAY" follow RFC 2119.
- Code samples are illustrative — they live in specs, not in source. Source comes later.
- Every cross-doc link is relative.
