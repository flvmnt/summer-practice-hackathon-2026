# 11 - Deployment: Railway

## 1. Target Topology

Railway project: `showup2move`

Services:

| Service | Type | Purpose |
|---|---|---|
| `web` | app service | Next.js app |
| `cron-prompts` | cron service | creates prompt windows and reminders |
| `postgres` | managed plugin | app database |
| `uploads` | Cloudflare R2 bucket | profile photos |

## 2. Runtime

| Setting | Value |
|---|---|
| Node | 20 LTS or 22 LTS |
| Package manager | pnpm |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm db:migrate && pnpm start` |
| Health path | `/api/health` |

`railway.toml` sketch:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install --frozen-lockfile && pnpm build"

[deploy]
startCommand = "pnpm db:migrate && pnpm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 120
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
numReplicas = 1
```

## 3. Environment Variables

Required:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Railway Postgres |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `GROQ_API_KEY` | server-side only |
| `GROQ_MODEL_TEXT` / `GROQ_TEXT_MODEL` | default `llama-3.3-70b-versatile`, override per Groq project |
| `GROQ_MODEL_VISION` / `GROQ_VISION_MODEL` | default `meta-llama/llama-4-scout-17b-16e-instruct`, override per Groq project |
| `GROQ_TIMEOUT_MS` | optional, defaults to 8000 |
| `PUBLIC_BASE_URL` | production URL |
| `R2_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_BUCKET` | Cloudflare R2 bucket name |
| `R2_ACCESS_KEY_ID` | bucket-scoped access key |
| `R2_SECRET_ACCESS_KEY` | bucket-scoped secret |
| `PUBLIC_UPLOAD_BASE_URL` | public upload base URL |
| `ALLOW_DEMO_MODE` | `true` only for judged demo deployments |
| `ALLOW_DEMO_SEED` | `true` only when seeding/resetting demo data |
| `DEMO_SEED_CONFIRM` | must equal `showup2move` for demo seed/reset |
| `NODE_ENV` | `production` |

Optional:

| Var | Feature |
|---|---|
| `RESEND_API_KEY` | email reminders; optional only if in-app reminders are the sole demo proof |
| `DEMO_MODE_SECRET` | optional demo endpoint secret when no admin session is available |
| `STRAVA_CLIENT_ID` | Strava bonus |
| `STRAVA_CLIENT_SECRET` | Strava bonus |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Strava webhook |
| `WEB_PUSH_VAPID_PUBLIC` | web push stretch |
| `WEB_PUSH_VAPID_PRIVATE` | web push stretch |
| `WEB_PUSH_SUBJECT` | `mailto:` subject for web push stretch |
| `OPEN_METEO_BASE_URL` | override only if the public endpoint changes |
| `OVERPASS_BASE_URL` | override only if the public endpoint changes or a mirror is used |
| `SENTRY_DSN` | observability |

## 4. Database Setup

Railway Postgres does **not** need PostGIS. Proximity uses numeric lat/lng plus Haversine in application code.

Migration order:

1. create tables
2. create indexes
3. seed demo data

Command:

```bash
pnpm db:migrate
ALLOW_DEMO_SEED=true DEMO_SEED_CONFIRM=showup2move pnpm db:seed:demo
```

## 5. Storage

Locked production setup:

- Cloudflare R2 bucket for uploaded photos
- signed server-side upload/write
- public read through generated object URLs or CDN base URL
- no Railway volume for uploads

Reason: R2 survives app restarts, preview deployments, and future horizontal scaling better than a mounted volume. It is S3-compatible, so the app can use the normal AWS S3 SDK with a Cloudflare endpoint and the `auto` region.

## 6. Cron

Schedule:

```text
0 6,12,16 * * *
```

This corresponds roughly to Romania morning, afternoon, evening windows when Railway runs cron in UTC.

Command:

```bash
node --import tsx scripts/prompt-cron.ts
```

Cron responsibilities:

- create prompt window
- send email reminders if enabled
- form groups for yes responses after a delay
- write system messages into group chat

## 7. Deploy Flow

1. Push to fork.
2. GitHub Actions runs checks.
3. Railway deploys from `main` only after green checks.
4. Migrations run through the start command. If disabled for any reason, run `pnpm db:migrate` manually before smoke testing.
5. Seed demo data.
6. Verify `/api/health`.
7. Run smoke demo.

## 8. Domain

Optional custom domain:

- add Railway generated domain first
- later add custom domain through Railway
- if using Cloudflare, keep Railway verification TXT DNS-only
- proxy the app CNAME only after Railway verifies

## 9. Rollback

If deployment fails:

1. Railway rollback to previous deployment.
2. Check logs.
3. If migration caused issue, apply forward-fix migration.
4. Never manually edit production DB during demo unless there is no other option.

## 10. Production Smoke

After every deploy:

- `/api/health`
- `/`
- `/signup`
- `/today` logged in
- photo upload
- prompt response
- group formation
- chat SSE
- event chat SSE
- event page
- calendar export
- `/demo` Judge Mode scoring status when enabled
