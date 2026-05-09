# 11 - Deployment: Railway

## 1. Target Topology

Railway project: `showup2move`

Services:

| Service | Type | Purpose |
|---|---|---|
| `web` | app service | Next.js app |
| `cron-prompts` | cron service | creates prompt windows and reminders |
| `postgres` | managed plugin | app database with PostGIS |
| `uploads` | object storage or volume | profile photos |

## 2. Runtime

| Setting | Value |
|---|---|
| Node | 20 LTS or 22 LTS |
| Package manager | pnpm |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Health path | `/api/health` |

`railway.toml` sketch:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install --frozen-lockfile && pnpm build"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

## 3. Environment Variables

Required:

| Var | Notes |
|---|---|
| `DATABASE_URL` | Railway Postgres |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `GROQ_API_KEY` | server-side only |
| `PUBLIC_BASE_URL` | production URL |
| `STORAGE_DRIVER` | `r2`, `s3`, or `local` |
| `STORAGE_DIR` | `/uploads` only for `local` |
| `S3_ENDPOINT` | required for R2/S3 |
| `S3_BUCKET` | required for R2/S3 |
| `S3_ACCESS_KEY_ID` | required for R2/S3 |
| `S3_SECRET_ACCESS_KEY` | required for R2/S3 |
| `PUBLIC_UPLOAD_BASE_URL` | public upload base URL |
| `NODE_ENV` | `production` |

Optional:

| Var | Feature |
|---|---|
| `RESEND_API_KEY` | email reminders |
| `STRAVA_CLIENT_ID` | Strava bonus |
| `STRAVA_CLIENT_SECRET` | Strava bonus |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Strava webhook |
| `WEB_PUSH_VAPID_PUBLIC` | web push stretch |
| `WEB_PUSH_VAPID_PRIVATE` | web push stretch |
| `SENTRY_DSN` | observability |

## 4. Database Setup

Railway Postgres must enable PostGIS.

Migration order:

1. create extension `postgis`
2. create tables
3. create indexes
4. seed demo data

Command:

```bash
pnpm db:migrate
ALLOW_DEMO_SEED=true DEMO_SEED_CONFIRM=showup2move pnpm db:seed:demo
```

## 5. Storage

Preferred production setup:

- R2/S3-compatible bucket for uploaded photos
- signed server-side upload/write
- public read through generated object URLs or CDN base URL
- Railway volume only as fallback for a single-instance demo

Reason: object storage survives app restarts, preview deployments, and future horizontal scaling better than a mounted volume.

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
4. Run migrations.
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
- event page
- calendar export
