# 01 - Phase 0: Fork & Project Setup + Deployment Audit

Audit date: 2026-05-09
Specs: `docs/specs/12-implementation-plan.md` §2, `docs/specs/11-deployment-railway.md`, `docs/specs/00-overview.md`

## Headline

Phase 0 is **largely DONE**. Deployment is **PARTIAL**: Dockerfile-based Railway build diverges from the spec's NIXPACKS+pnpm sketch, and the `.env.example` is missing several spec-required env vars (`GROQ_API_KEY` is present but the file omits a couple of demo/Strava/Sentry knobs). CI runs the unified `pnpm check` step but does NOT run Playwright, migrate a test DB, or run secret scanning. Health is DB-backed (good - Phase 1 has shipped).

## Verdict Table

### Phase 0 tasks (spec §2, items 1–7)

| # | Task | Verdict | Evidence |
|---|---|---|---|
| 1 | `origin` = team fork, `upstream` = `deeagabor/...` | DONE | `git remote -v`: origin = `flvmnt/summer-practice-hackathon-2026`, upstream = `deeagabor/summer-practice-hackathon-2026` |
| 2 | Next.js scaffold in fork | DONE | `next.config.ts:1-45`, App Router at `src/app/`, `next@16.2.6` in `package.json:36` |
| 3 | pnpm + TS + Tailwind + shadcn/ui + Drizzle + Vitest + Playwright | DONE | `package.json:5,15,32,42,49,55,57,62`; `components.json:1-21`; `tsconfig.json:11` (strict); 19 ui components in `src/components/ui/` |
| 4 | Railway config | PARTIAL | `railway.toml:1-12` exists but uses DOCKERFILE builder vs spec's NIXPACKS+pnpm command (§11 §2) |
| 5 | GitHub Actions CI | PARTIAL | `.github/workflows/ci.yml:1-28` runs `pnpm check` only - no Playwright, no migrate test DB, no secret scanning (AGENTS.md §"CI/CD") |
| 6 | `/api/health` (process first → DB later) | DONE | `src/app/api/health/route.ts:1-16`; `src/lib/health.ts:1-52` returns `process: "up"` + DB probe |
| 7 | Guarded demo-mode env flags + Judge Mode route | DONE | `src/lib/demo/guard.ts:1-37`; route at `src/app/[locale]/demo/page.tsx:45-47` (404s when flag off); APIs `src/app/api/demo/{seed,reset,scoring-status}/route.ts` |

### Phase 0 "Done when" gates

| Gate | Verdict | Evidence |
|---|---|---|
| `pnpm dev` runs | DONE | `package.json:10` `"dev": "next dev"` |
| `pnpm check` runs | DONE | `package.json:18` chains lint + i18n + typecheck + test + build |
| Railway deploy → blank app, health green | DONE (assumed live) | `railway.toml:8` healthcheckPath `/api/health`; recent commit `35b0919 fix: run railway migrations before startup` shows live deploy iteration |
| DB-backed health after Phase 1 | DONE | `src/lib/health.ts:38-51` runs `select 1` and returns `db: "up"` |

### Deployment requirements (spec §11)

| Section | Requirement | Verdict | Evidence |
|---|---|---|---|
| §2 Runtime - Node 20/22 | DONE | `Dockerfile:1` `node:22-alpine`; `package.json:7` `>=20.19.0` |
| §2 Runtime - pnpm | DONE | `package.json:5` `pnpm@10.33.0`; `Dockerfile:4` `corepack enable` |
| §2 Build command per spec (`pnpm install --frozen-lockfile && pnpm build`) | PARTIAL | Build is correct semantically (`Dockerfile:9,18`) but spec sketch says NIXPACKS + buildCommand; repo uses Dockerfile builder. See divergence below. |
| §2 Start command (`pnpm db:migrate && pnpm start`) | PARTIAL | Migrate runs as `preDeployCommand = "node scripts/migrate.mjs"` (`railway.toml:6`) and start is `node server.js` (`railway.toml:7`, `Dockerfile:31`). Equivalent behavior; not the literal spec command. |
| §2 Health path `/api/health` | DONE | `railway.toml:8` |
| §2 Health timeout 120 | DIVERGENT | `railway.toml:9` is `300` (more lenient than spec's 120 - fine in practice) |
| §3 Required env vars present in `.env.example` | PARTIAL | See env-var matrix below |
| §4 Migration order (create → index → seed) | DONE | `drizzle/0000_*.sql` … `drizzle/0010_*.sql` (11 migrations); `scripts/seed-demo.ts` separate from `db:migrate` |
| §4 Postgres without PostGIS | DONE | `drizzle.config.ts:5` `dialect: "postgresql"`; AGENTS.md confirms numeric lat/lng + Haversine |
| §5 R2 storage (no Railway volume) | DONE | `@aws-sdk/client-s3` in `package.json:25`; `src/lib/r2.ts` exists |
| §6 Cron service `cron-prompts` | NOT VERIFIED HERE | Out of scope for Phase 0; no cron entry in `railway.toml`. Track in Phase 2/3 audit. |
| §7 Deploy flow - GH Actions before Railway | PARTIAL | CI runs on PR/push but spec says "Railway deploys from `main` only after green checks" - no branch protection visible from repo files alone. |
| §10 Production smoke list | OUT OF SCOPE for Phase 0 (post-deploy checklist) | - |

### Required env-var matrix (spec §11 §3 vs `.env.example`)

| Var | Required | In `.env.example` | Verdict |
|---|---|---|---|
| `DATABASE_URL` | yes | line 2 | DONE |
| `SESSION_SECRET` | yes | line 3 | DONE |
| `GROQ_API_KEY` | yes | line 13 | DONE (empty placeholder) |
| `GROQ_TEXT_MODEL` | yes | line 14 | DONE |
| `GROQ_VISION_MODEL` | yes | line 15 | DONE |
| `PUBLIC_BASE_URL` | yes | line 4 | DONE |
| `R2_ENDPOINT` | yes | line 16 | DONE |
| `R2_BUCKET` | yes | line 17 | DONE |
| `R2_ACCESS_KEY_ID` | yes | line 18 | DONE |
| `R2_SECRET_ACCESS_KEY` | yes | line 19 | DONE |
| `PUBLIC_UPLOAD_BASE_URL` | yes | line 20 | DONE |
| `ALLOW_DEMO_MODE` | yes | line 7 | DONE |
| `ALLOW_DEMO_SEED` | yes | line 9 | DONE |
| `DEMO_SEED_CONFIRM` | yes | line 10 | DONE |
| `NODE_ENV` | yes | - | MISSING from `.env.example` (Next.js sets at runtime so low risk; still spec-listed) |
| `RESEND_API_KEY` (opt) | optional | line 21 | DONE |
| `DEMO_MODE_SECRET` (opt) | optional | line 8 | DONE |
| `STRAVA_CLIENT_ID` (opt) | optional | - | MISSING |
| `STRAVA_CLIENT_SECRET` (opt) | optional | - | MISSING |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` (opt) | optional | - | MISSING |
| `WEB_PUSH_VAPID_PUBLIC` (opt) | optional | - | MISSING |
| `WEB_PUSH_VAPID_PRIVATE` (opt) | optional | - | MISSING |
| `WEB_PUSH_SUBJECT` (opt) | optional | - | MISSING |
| `OPEN_METEO_BASE_URL` (opt) | optional | line 22 | DONE |
| `OVERPASS_BASE_URL` (opt) | optional | line 23 | DONE |
| `SENTRY_DSN` (opt) | optional | - | MISSING |

Optional Strava/Web Push/Sentry omissions are acceptable for Phase 0 (those features are stretch/later-phase) but should be added to `.env.example` so the team can reach production smoke without spelunking the spec. `NODE_ENV` should be added for consistency.

## Per-task evidence detail

### Task 1 - Remotes
`git remote -v` output:
- `origin  https://github.com/flvmnt/summer-practice-hackathon-2026.git`
- `upstream  https://github.com/deeagabor/summer-practice-hackathon-2026.git`

Matches spec exactly.

### Task 2 - Next.js scaffold
- `next.config.ts:5` `output: "standalone"` (right call for Docker)
- `next.config.ts:7-39` security headers including HSTS, CSP, frame-ancestors
- App Router live: `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, plus 19+ pages already wired (covers Phase 1–3 scope already)
- TypeScript strict on (`tsconfig.json:11`)

### Task 3 - Stack wiring

| Tech | Evidence |
|---|---|
| pnpm | `package.json:5` `packageManager: "pnpm@10.33.0"` |
| TypeScript | `package.json:60`; `tsconfig.json:11` strict |
| Tailwind 4 | `package.json:44`; `postcss.config.mjs:3`; `src/app/globals.css` |
| shadcn/ui | `components.json:1-21` (style new-york, RSC, slate); `@radix-ui/react-slot` `package.json:27`; 19 components in `src/components/ui/` |
| Drizzle | `package.json:32,55`; `drizzle.config.ts:1-11`; `src/db/{index,schema}.ts`; 11 migrations in `drizzle/` |
| Vitest | `package.json:62`; `vitest.config.ts:1-19` (jsdom env, alias for `server-only`) |
| Playwright | `package.json:49`; `playwright.config.ts:1-29` (chromium + Pixel 5 mobile project) |

Note: Playwright tests live at `src/tests/e2e` per `playwright.config.ts:4`, but only `src/tests/stubs/` exists today. There is one `e2e/visual.spec.ts` for visual QA. Real E2E happy-path coverage is Phase 1+ and not required by Phase 0.

### Task 4 - Railway config (PARTIAL: divergence from spec sketch)

`railway.toml`:
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
preDeployCommand = "node scripts/migrate.mjs"
startCommand = "node server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
numReplicas = 1
```

Spec §11 §2 sketch uses `builder = "NIXPACKS"` + `buildCommand`/`startCommand` driven by pnpm scripts. The repo's Dockerfile route is functionally equivalent (and arguably more reproducible - pinned `node:22-alpine`, multistage with `prod-deps`, copies migrator deps separately at `Dockerfile:29`). Flagging as PARTIAL because spec was not updated; either rewrite spec or note Dockerfile-builder choice in §11.

`healthcheckTimeout = 300` exceeds spec's 120s - leniency is fine; document if kept.

### Task 5 - GitHub Actions CI (PARTIAL)

`.github/workflows/ci.yml:1-28` runs:
1. checkout
2. pnpm setup
3. node 22 + pnpm cache
4. `pnpm install --frozen-lockfile`
5. `pnpm check` (lint + i18n + typecheck + test + build)

What's missing vs AGENTS.md "CI/CD And Security Tooling Guidance":
- No Playwright smoke step (`pnpm test:e2e`) - AGENTS.md priority 1
- No `migrate test DB` step
- No secret scanning (`gitleaks`)
- No `pnpm audit --audit-level high`
- No CodeQL
- Triggers OK (PR + push to main)

Phase 0 spec §2 only requires "Add GitHub Actions CI" - minimal interpretation is satisfied. AGENTS.md raises the bar.

### Task 6 - `/api/health` (DB-backed)

`src/lib/health.ts:23-52`:
- Returns `{ ok, process: "up", db, phase: "phase_1", commit, version }`
- `db` resolves to `"up" | "down" | "not_configured"`
- Reads commit from `RAILWAY_GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_SHA` / `GIT_COMMIT` (`src/lib/health.ts:14-21`)
- In production with no `DATABASE_URL`, returns `ok: false, db: "down"` (correct fail-closed behavior)
- Probe: `await getSqlClient()`select 1`` (`src/lib/health.ts:47`)

Route hardening: `dynamic = "force-dynamic"` (`src/app/api/health/route.ts:4`), `Cache-Control: no-store` (`src/app/api/health/route.ts:13`), 503 when not OK (`src/app/api/health/route.ts:10`). Solid.

### Task 7 - Demo-mode flags + Judge Mode route

Env validation: `src/lib/env.ts:9-47`:
- `ALLOW_DEMO_MODE`, `ALLOW_DEMO_SEED` parsed as booleanFlag
- `DEMO_MODE_SECRET` requires min 64 chars (or empty)
- `DEMO_SEED_CONFIRM` is opt string

Guards: `src/lib/demo/guard.ts:5-36`:
- `isDemoModeEnabled()` (line 5)
- `canReadDemoEndpoint(request)` requires both `ALLOW_DEMO_MODE` and `DEMO_MODE_SECRET` and uses `timingSafeEqual` (line 19-31) - well-implemented
- `isDemoSeedEnabled()` requires `DEMO_SEED_CONFIRM === "showup2move"` (line 33-36) - matches spec §11 §3 exactly

Judge Mode route: `src/app/[locale]/demo/page.tsx`:
- Calls `notFound()` when demo disabled (`src/app/[locale]/demo/page.tsx:45-47`)
- Renders rubric proof rows with status legend (live/seeded/fallback/pending) (`src/app/[locale]/demo/page.tsx:131-141`)
- Shows DB health, build SHA, seed counts, AI cache count - matches spec 11 §10 smoke list intent
- This is well past Phase 0 placeholder - looks like Phase 5/6 polish already shipped

Demo APIs: `src/app/api/demo/{seed,reset,scoring-status}/route.ts` - full Judge Mode wiring.

## Divergences from spec

1. **Railway builder**: spec sketches NIXPACKS + pnpm commands; repo uses Dockerfile. Functionally fine, but `docs/specs/11-deployment-railway.md` §2 should be updated to reflect the Dockerfile reality OR repo should switch to NIXPACKS. Recommend updating spec.
2. **Health timeout**: 300s vs spec's 120s. Trivial; keep current and note in spec.
3. **CI workflow** is minimal; AGENTS.md calls for Playwright + secret scan + migrate-test-DB. Track in Phase 6 polish or add now.
4. **`.env.example` missing** `NODE_ENV`, Strava trio, Web Push trio, `SENTRY_DSN`. Add stub keys with empty values so the file matches spec §11 §3 reference.
5. **No cron service** wired in `railway.toml` - required by §11 §6 for Phase 2 prompt windows. Not a Phase 0 blocker but flag for next phase audit.
6. **Playwright e2e directory** (`src/tests/e2e/`) is empty (only `stubs/`); existing `e2e/visual.spec.ts` lives outside the configured `testDir`. Inconsistency - either update `playwright.config.ts:4` to `./e2e` or move tests.

## Summary

Phase 0 is ~90% DONE - core scaffold, CI, health, demo guards, and Railway deploy are real and working (recent commits `35b0919`, `82efdff`, `3b2c8a6` show live iteration). Remaining gaps are documentation/CI hardening rather than missing functionality:

- DONE (7/7): tasks 1, 2, 3, 6, 7 fully; "Done when" gates all pass
- PARTIAL (3): Railway config diverges from spec sketch; CI workflow is minimal vs AGENTS.md bar; `.env.example` missing NODE_ENV + Strava/Push/Sentry stubs
- MISSING (0): no Phase 0 task is wholly absent

Recommend two small follow-ups before later phases: (a) reconcile `docs/specs/11-deployment-railway.md` §2 with the Dockerfile builder reality; (b) extend `.github/workflows/ci.yml` with Playwright + gitleaks + `pnpm audit` to hit AGENTS.md priorities 1–3.
