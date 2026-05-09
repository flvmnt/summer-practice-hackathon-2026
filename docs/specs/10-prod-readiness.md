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

## 2. Security

### 2.1 Secrets

Never commit:

- `DATABASE_URL`
- `SESSION_SECRET`
- `GROQ_API_KEY`
- OAuth secrets
- email API keys
- VAPID private key

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
- never serve original filename
- delete old photo when replaced

### 2.4 CSRF

- server actions rely on same-site session cookie plus Next origin protections
- route handlers verify `Origin` for state-changing requests
- OAuth callback verifies state HMAC

## 3. GDPR / Privacy

Data minimization:

- username-first signup
- email optional
- exact location private
- public profile only shows city-level info

User rights:

- export account JSON
- delete/anonymize account
- remove photo
- disconnect Strava

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
| Strava | keep manual sports, show reconnect |
| Email provider | in-app reminder still works |

No external API failure should block signup, prompt response, chat, or manual event creation.

## 6. Performance

Rules:

- server render hot path
- lazy-load map and charts
- image optimize uploads
- cache venue/weather responses
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
- GiST indexes for geography fields

## 8. Demo Data

`scripts/seed-demo.ts` should create:

- 20 realistic users in Timisoara
- sports distribution across football, tennis, basketball, running
- profiles in Romanian and English
- accepted AI suggestions
- one active prompt
- multiple yes/no responses
- one almost-full football group
- one tennis group
- venues with price tiers
- one active event with vote

Seed command must be safe:

- only runs when `ALLOW_DEMO_SEED=true`
- refuses production unless `DEMO_SEED_CONFIRM=showup2move`

## 9. Launch Checklist

- `pnpm check` passes
- `pnpm test:e2e` smoke passes
- Railway build green
- `/api/health` green
- migrations applied
- demo seed loaded
- env vars present
- no `.env` in git
- mobile screenshots checked
- README updated with setup/run/demo

