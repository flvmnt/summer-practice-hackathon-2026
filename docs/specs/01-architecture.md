# 01 — Architecture

## 1. Shape: single Next.js app

**Form factor:** mobile-first responsive web app. Design starts at 360px wide and scales up to desktop. **Not a PWA** — no service worker, no install prompt, no offline shell. Reminders (300p) are covered by in-app SSE banner + email; service-worker-driven web push is a stretch upgrade in [08-bonus-features.md](08-bonus-features.md).

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│         Next.js 16 client · React 19 · Tailwind 4                │
│                shadcn/ui · MapLibre GL                           │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS · cookies (iron-session)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                NEXT.JS 16 SERVER (Node, App Router)              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Server Actions    Route Handlers    SSE Streams        │    │
│  │  (mutations)       (uploads, OAuth)  (chat, prompts)    │    │
│  └────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  lib/  · auth · session · groq · matching · rate-limit │    │
│  │        · storage · maps · weather · calendar · strava  │    │
│  └────────────────────────────────────────────────────────┘    │
└────┬─────────────────┬────────────────────┬────────────────┬────┘
     │                 │                    │                │
     ▼                 ▼                    ▼                ▼
┌──────────┐  ┌─────────────────┐  ┌────────────────┐  ┌───────────┐
│ Postgres │  │   Groq API      │  │ Open-Meteo /   │  │  Strava   │
│ (Drizzle)│  │ text + vision   │  │ Overpass /     │  │  OAuth    │
│          │  │                 │  │ Open Street Map│  │           │
└──────────┘  └─────────────────┘  └────────────────┘  └───────────┘

  ▲
  │ (separate process, optional)
┌─┴────────────────────────┐
│  scripts/prompt-cron.ts  │   ← Railway Cron, every 6h
│  generates "ShowUpToday" │     prompts for active users
│  and triggers reminders  │
└──────────────────────────┘
```

**One Next.js process for everything user-facing.** One small Node script as a Railway Cron worker for periodic prompts. No separate API service, no Redis, no message broker.

## 2. Why this shape over Cadentra-style monorepo

| Concern | Cadentra (NestJS + Redis + BullMQ) | This (Next.js solo) |
|---|---|---|
| Time to first running E2E flow | days | hours |
| Services to deploy | 4-5 | 1-2 |
| Auth ergonomics | JWT issuance + refresh | iron-session cookie, single line |
| Background jobs | BullMQ workers | Railway Cron + idempotent on-visit generation |
| Realtime | NestJS WS gateway | SSE route handler |
| Cost on Railway | ~$30/mo | ~$5/mo |
| What we lose | Strict service boundaries | (acceptable for hackathon) |

We keep Cadentra's **discipline** (zod everywhere, lib/ split by concern, tests in CI) without its **operational weight**.

## 3. Project layout

```
summer-practice-hackathon-2026/
├── docs/
│   └── specs/                    ← these planning docs
├── public/
│   ├── icons/                    ← favicon, og images
│   └── locales/                  ← i18n JSON (ro, en)
│   (manifest.webmanifest, sw.js, push assets — stretch only)
├── src/
│   ├── app/                      ← Next.js App Router
│   │   ├── (marketing)/          ← landing, /despre
│   │   ├── (auth)/
│   │   │   ├── signup/
│   │   │   ├── login/
│   │   │   └── recuperare/
│   │   ├── (app)/                ← authed shell
│   │   │   ├── today/            ← daily prompt + active group
│   │   │   ├── groups/[id]/      ← group view + chat
│   │   │   ├── events/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── settings/         ← profile edit, sports, recovery
│   │   │   └── u/[username]/     ← public profile
│   │   ├── api/
│   │   │   ├── upload/photo/     ← multipart upload
│   │   │   ├── strava/callback/  ← OAuth redirect
│   │   │   ├── webhooks/         ← strava activity webhook
│   │   │   ├── stream/messages/  ← SSE chat
│   │   │   └── stream/prompts/   ← SSE prompt push
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                   ← shadcn primitives
│   │   ├── chat/
│   │   ├── map/
│   │   ├── prompt/
│   │   └── profile/
│   ├── db/
│   │   ├── index.ts              ← Drizzle client
│   │   └── schema.ts             ← see 02-data-model.md
│   ├── lib/
│   │   ├── auth.ts               ← signup/login/recovery actions
│   │   ├── session.ts            ← iron-session
│   │   ├── auth-rate-limit.ts    ← curbe pattern
│   │   ├── recovery.ts
│   │   ├── groq.ts               ← Groq SDK wrapper
│   │   ├── matching.ts           ← compatibility, group formation
│   │   ├── proximity.ts          ← Haversine, geocoding
│   │   ├── venues.ts             ← Overpass API
│   │   ├── weather.ts            ← Open-Meteo
│   │   ├── calendar.ts           ← .ics generation
│   │   ├── push.ts               ← stretch-only web push helpers
│   │   ├── strava.ts             ← OAuth + activity sync
│   │   ├── storage.ts            ← R2/S3 preferred, Railway volume fallback
│   │   ├── i18n.ts
│   │   └── safe-redirect.ts      ← curbe pattern
│   ├── server/
│   │   ├── actions/              ← user-callable server actions
│   │   │   ├── profile.ts
│   │   │   ├── prompt.ts
│   │   │   ├── group.ts
│   │   │   ├── chat.ts
│   │   │   ├── event.ts
│   │   │   └── vote.ts
│   │   └── sse/                  ← SSE handlers shared logic
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/                  ← Playwright
├── scripts/
│   ├── prompt-cron.ts            ← Railway Cron job (UTC schedule)
│   ├── seed.ts
│   └── seed-demo.ts
├── drizzle/                      ← generated migrations
├── drizzle.config.ts
├── next.config.ts
├── package.json                  ← pnpm
├── pnpm-lock.yaml
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── Dockerfile
├── railway.toml                  ← Railway service config
├── .github/workflows/ci.yml
├── README.md
└── CLAUDE.md
```

## 4. Runtime topology on Railway

```
Railway project: showup2move
├── Service: web         (Next.js, Node 20, exposes :3000 → public domain)
├── Service: cron        (Node, runs scripts/prompt-cron.ts on schedule)
├── Plugin:  Postgres    (managed, with pgvector if we add embeddings later)
└── Storage: R2/S3 preferred for photos; Railway volume fallback
```

Stretch: a second `worker` service if we move chat off SSE to socket.io.

## 5. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | web, cron | Postgres |
| `SESSION_SECRET` | web | iron-session, 64+ char hex |
| `GROQ_API_KEY` | web, cron | Groq inference |
| `STRAVA_CLIENT_ID` | web | OAuth |
| `STRAVA_CLIENT_SECRET` | web | OAuth |
| `WEB_PUSH_VAPID_PUBLIC` | web, cron | Push subscriptions (stretch) |
| `WEB_PUSH_VAPID_PRIVATE` | web, cron | Push signing (stretch) |
| `WEB_PUSH_SUBJECT` | web, cron | `mailto:` for VAPID (stretch) |
| `RESEND_API_KEY` | web, cron | Email reminders (primary reminder channel) |
| `OPEN_METEO_BASE_URL` | web | default to public |
| `OVERPASS_BASE_URL` | web | default to public |
| `STORAGE_DRIVER` | web | `s3`, `r2`, or `local` |
| `STORAGE_DIR` | web | `/uploads` only when `STORAGE_DRIVER=local` |
| `S3_ENDPOINT` | web | R2/S3 endpoint when object storage is used |
| `S3_BUCKET` | web | upload bucket |
| `S3_ACCESS_KEY_ID` | web | upload bucket key |
| `S3_SECRET_ACCESS_KEY` | web | upload bucket secret |
| `PUBLIC_UPLOAD_BASE_URL` | web | public base URL for stored photos |
| `PUBLIC_BASE_URL` | web, cron | absolute URL for emails / OG / push |
| `NODE_ENV` | both | `production` in prod |

## 6. Key technical decisions

### 6.1 Drizzle over Prisma
curbe's choice. Faster schema iteration. SQL-first stays close to Postgres (we use PostGIS for proximity).

### 6.2 iron-session over JWT
curbe's choice. Encrypted cookie, server-side rotation trivial, no token exfil concern.

### 6.3 SSE over WebSocket
- One-way fits chat-receive + prompt-receive perfectly.
- Sending = HTTP server action (already needed).
- Survives every load balancer.
- No socket.io dependency, no Redis pub/sub.

### 6.4 PostGIS for proximity
- `geography(Point)` for user `home` and event `location`.
- `ST_DWithin` for "within 5km" queries indexed by GiST.
- curbe already runs PostGIS — same docker image works.

### 6.5 No service worker in MVP
- Not a PWA. No SW, no install prompt, no offline shell.
- Mobile-first responsiveness comes from Tailwind alone (`min-w-[360px]`, breakpoint-up at `sm`/`md`/`lg`).
- If we add web push (stretch), it's a hand-rolled minimal SW that handles `push` events only — no fetch interception (avoids cache-staleness bugs during demo).

### 6.6 next-intl for i18n
- RO + EN at launch. Romanian primary (Haufe is in Romania).
- Locale in URL: `/ro/today`, `/en/today`.

## 7. Performance budget

| Page | LCP target | Bundle JS | Notes |
|---|---:|---:|---|
| `/` (landing) | < 1.5s | < 50 KB | static, no auth check |
| `/today` | < 2.0s | < 120 KB | hot path, server-rendered |
| `/groups/[id]` | < 2.0s | < 150 KB | chat lazy-loads |
| `/events/[id]` | < 2.5s | < 200 KB | map lazy-loaded |

Lighthouse target: **≥ 95 on both mobile and desktop** across the four categories. Mobile is the primary form factor; desktop should clear the same bar with margin to spare. To hit this with MapLibre on event pages, we **defer-load** the map JS only when the user scrolls/clicks into it — landing/today/groups/chat pages stay map-free.

## 8. Out of this doc

- Per-table schema → [02](02-data-model.md)
- Per-endpoint contracts → [03](03-server-actions-and-routes.md)
- Deploy steps → [11](11-deployment-railway.md)
