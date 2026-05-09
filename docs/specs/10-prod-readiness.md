# 10 - Production Readiness

## 1. Definition

Production-ready for this hackathon means:

- real hosted deployment on Railway
- database migrations
- health check
- secure session cookies
- secrets outside git
- sane rate limits
- graceful external API failures
- basic observability
- data export/delete paths
- documented demo reset
- guarded Judge Mode with honest scoring proof

## 2. Security

### 2.1 Secrets

Never commit:

- `DATABASE_URL`
- `SESSION_SECRET`
- `GROQ_API_KEY`
- OAuth secrets
- email API keys
- VAPID private key
- R2 access keys

Use Railway variables for production and `.env.local` for local.

### 2.2 Auth

- `iron-session` cookie
- `secure`, `httpOnly`, `sameSite=lax`
- password hashed with bcrypt
- dummy hash compare
- Postgres-backed rate limits
- explicit ownership checks on all group/event/chat mutations

### 2.3 Uploads

- max 5 MB
- allow jpeg, png, webp only
- transcode to webp
- strip metadata
- store under UUID name
- store in Cloudflare R2, never Railway filesystem
- never serve original filename
- delete old photo when replaced
- reject extension spoofing via MIME sniffing
- reject very large dimensions/pixel bombs before expensive processing

### 2.4 CSRF

- server actions rely on same-site session cookie plus Next origin protections
- route handlers verify `Origin` for state-changing requests
- OAuth callback verifies state HMAC

### 2.5 Rate limits

Use a Postgres-backed `rate_limits` table or extend `auth_rate_limits` beyond auth. Required buckets:

| Scope | Limit | Window |
|---|---:|---:|
| login/recovery/signup | see auth spec | see auth spec |
| upload photo | 10 attempts | 15 min |
| photo AI analysis | 3 attempts | 60 min |
| bio AI suggestion | 10 attempts | 60 min |
| message send | 30 messages | 60 sec |
| SSE connection open | 20 connections | 5 min |
| demo seed/reset | 3 attempts | 15 min |

Judge Mode read endpoints require `ALLOW_DEMO_MODE=true` and either an admin session or `DEMO_MODE_SECRET`.
Demo seed/reset require `ALLOW_DEMO_SEED=true`, `DEMO_SEED_CONFIRM=showup2move`, rate limiting, and either an admin session for UI actions or `DEMO_MODE_SECRET` for HTTP demo routes.

## 3. GDPR / Privacy

Data minimization:

- username-first signup with full name collected in onboarding
- email optional
- exact location private
- maps use venue pins and approximate group center, never home pins
- username is a stable handle; full name is editable display copy
- public profile only shows city-level info

User rights:

- export account JSON
- delete/anonymize account
- remove photo
- disconnect Strava if optional integration ships

Retention:

- chat retained for demo
- raw AI analysis not retained unless user accepts suggestions
- failed upload temp files deleted immediately

## 4. Observability

Structured log fields:

```ts
{
  ts: string;
  requestId: string;
  action: string;
  userId?: string;
  durationMs: number;
  ok: boolean;
  error?: string;
}
```

Health endpoint:

```json
{
  "ok": true,
  "db": "up",
  "commit": "abc123",
  "version": "2026-hackathon"
}
```

Optional:

- Sentry for client/server errors
- Railway logs during demo

## 5. External API Failure Policy

| Service | Failure behavior |
|---|---|
| Groq | deterministic matching/suggestions, "AI unavailable" toast |
| Overpass | manual venue entry and cached venues |
| Open-Meteo | hide weather card, no event block |
| Strava | keep manual sports; hide/label wearable proof if OAuth unavailable |
| Email provider | in-app reminder still works |
| R2 | photo upload disabled with manual no-photo onboarding fallback |

No external API failure should block signup, prompt response, chat, or manual event creation.

## 6. Performance

Rules:

- server render hot path
- lazy-load map and charts
- image optimize uploads
- cache venue/weather responses
- cache runtime AI outputs after real Groq calls; do not seed demo AI cache rows
- no blocking AI call on initial `/today` render
- SSE streams reconnect safely

Budgets:

| Page | LCP | JS |
|---|---:|---:|
| `/` | < 1.5s | < 50 KB |
| `/today` | < 2.0s | < 120 KB |
| `/groups/[id]` | < 2.0s | < 150 KB |
| `/events/[id]` | < 2.5s | < 200 KB |

## 7. Database Safety

- migrations checked in
- foreign keys with explicit delete behavior
- unique indexes for idempotency
- cursor pagination for messages
- no unbounded list queries
- btree indexes for lat/lng columns plus Haversine distance checks in application code
- active membership idempotency guard per prompt/user
- event chat scope constraints

## 8. Demo Data

`scripts/seed-demo.ts` should create:

- 20 realistic users in Timisoara
- sports distribution across football, tennis, basketball, running
- profiles in Romanian and English
- accepted AI suggestions
- cached AI outputs for bio/photo/compatibility/captain brief
- one active prompt
- multiple yes/no responses
- one almost-full football group
- one tennis group
- venues with price tiers and confidence labels
- one active event with vote and event-specific chat
- in-app notifications for match, vote, event update, and reminder
- Judge Mode scoring status rows
- optional labeled wearable fixture only if judges explicitly accept fixture proof; otherwise keep wearables hidden or marked stretch when Strava OAuth is unavailable

Seed command must be safe:

- only runs when `ALLOW_DEMO_SEED=true`
- refuses production unless `DEMO_SEED_CONFIRM=showup2move`
- reset deletes only demo-owned rows and refuses broad truncation
- seeded/resettable rows carry `demoRunId` or an equivalent ownership marker

## 9. Launch Checklist

- `pnpm check` passes
- `pnpm test:e2e` smoke passes
- Railway build green
- `/api/health` green
- migrations applied
- demo seed loaded
- Judge Mode rows reviewed for overclaims
- event chat verified separately from group chat
- map directions/list fallback verified
- Groq model envs configured or fallback copy rehearsed
- env vars present
- no `.env` in git
- mobile screenshots checked
- README updated with setup/run/demo
