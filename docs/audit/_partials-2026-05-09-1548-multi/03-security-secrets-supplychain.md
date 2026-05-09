# 03 - Secrets, Env Vars, Dependencies, Supply Chain

Audit run: 2026-05-09 15:48 - branch HEAD `5fd053a feat(demo): walkthrough nav for scripted demo`.
Scope: secret leakage, env handling, public-env exposure, package + lockfile risk, Dockerfile, CSP, R2 client, session secret rotation, husky pre-push, AGENTS/CLAUDE/CI.

## TL;DR

- **No live secrets in the working tree, git history, build output, HAR, or test artefacts.** Only placeholder values in `.env.example` and a hardcoded `DEV_SESSION_SECRET` in `src/lib/session.ts:18` (gated to `NODE_ENV !== production`).
- Env validation in `src/lib/env.ts` correctly fails fast in prod for `DATABASE_URL`, `SESSION_SECRET`, `PUBLIC_BASE_URL` (commit `4ae8f16`).
- Two transitive `pnpm audit` advisories (both `moderate`, both dev-only via `drizzle-kit > @esbuild-kit/* > esbuild` and `next > postcss`); no production-path criticals.
- Dockerfile runs as **root**, base image **tag-pinned but not digest-pinned**, no `.dockerignore` (could pull `.env.local` into build context).
- CSP exists with sensible directives but uses `'unsafe-inline'` + `'unsafe-eval'` for `script-src` (Next.js requirement; not regressing further).
- **No SESSION_SECRET rotation strategy** in code or docs; iron-session `password` is a single string, not the rotation array form.
- HAR file `/Users/flv/hackathon_haufe/showup2move.up.railway.app.har`: zero `Set-Cookie` / `Authorization` / `x-api-key` headers, no token-shaped strings - clean.
- CI uses no secrets (`secrets.*` count = 0); fork-PR-safe by construction.

Severity counts: **P0=0, P1=2, P2=6, P3=3.**

---

## P0 - Secret leaked or RCE-class supply chain

None.

Verifications run:

- `git grep -nE 'sk-[A-Za-z0-9]|gsk_[A-Za-z0-9]|aws_secret|access_key_id|R2_SECRET|SESSION_SECRET=|DATABASE_URL=postgres://[^$]'` excluding lockfile + markdown returned only:
  - `.env.example:15` `DATABASE_URL=postgres://postgres:postgres@localhost:5432/showup2move` (placeholder local URL)
  - `.env.example:19` `SESSION_SECRET=replace-with-64-plus-random-hex-characters-...` (placeholder)
  - `.env.example:45` `R2_SECRET_ACCESS_KEY=` (empty)
  - `src/lib/r2.ts:13,30,34` documentation/source references to the var name, not values.
- `git log --all --diff-filter=A -- '*.env' '.env' '.env.local' '.env.production'` returned **nothing**. Only `.env.example` ever entered VCS.
- `find .next/static -name '*.js' -exec grep -lE 'GROQ_API_KEY|R2_SECRET_ACCESS_KEY|SESSION_SECRET' {} \;` returned **nothing**: no server secrets inlined into the client bundle.
- HAR file: 0 hits for `set-cookie|authorization|x-api-key` (case-insensitive); no token-shaped substrings.
- `.playwright-cli/*.log`, `playwright-report/`, `test-results/`: no `gsk_`, `sk-[A-Z]`, `GROQ_API_KEY`, `password`, or `recoveryCode` matches.
- `pnpm-lock.yaml`: zero `git+ssh://`, zero `github:`, zero `tarball:` entries; every `resolution:` carries an `integrity:` hash (sha512 from npm registry).

---

## P1 - Secret-handling gap that bites in prod

### P1-1 - Hardcoded `DEV_SESSION_SECRET` lives in the source tree

- `src/lib/session.ts:17-22`
  ```ts
  const DEV_SESSION_SECRET =
    "dev-only-showup2move-session-secret-64-characters-minimum-value";
  ...
  const password = env.SESSION_SECRET ?? DEV_SESSION_SECRET;
  ```
- The runtime guard at `src/lib/session.ts:24-26` does throw in production if `SESSION_SECRET` is missing, AND `src/lib/env.ts:33-39` re-asserts the same at parse time. Belt-and-braces is correct, so this is not exploitable in prod. **But** the constant is exactly 64 chars - it satisfies `z.string().min(64)` if anyone ever copies it into `.env.local` or a secret-manager seed and forgets to rotate. Treat as a foot-gun.
- Fix: replace with `crypto.randomBytes(64).toString("hex")` generated on first dev start and stored under `.next/cache/`, or simply throw in dev too unless `SESSION_SECRET` is set. At minimum, change the literal to obviously-not-real text like `"INSECURE_DEV_ONLY_DO_NOT_USE_IN_PROD_REGENERATE_NOW"` repeated to 64 chars so it can never satisfy a paranoid prod check by accident.

### P1-2 - Dockerfile runs the Next.js server as root and lacks `.dockerignore`

- `Dockerfile:20-31` (`runner` stage): no `USER node` directive; `node:22-alpine` defaults to UID 0.
- Repo root has no `.dockerignore` (`ls -la .dockerignore` -> not found).
  - `Dockerfile:17` does `COPY . .` in the `build` stage. With no `.dockerignore`, this copies `.env.local` (containing the real `GROQ_API_KEY` per `cat .env.local | sed 's/=.*/=<REDACTED>/'`), `.husky/`, `.playwright-cli/` console logs, `playwright-report/index.html`, `test-results/`, and `.next/` (stale local build) into the build context. While these layers don't reach the final `runner` stage, they (a) bloat the build cache, (b) are visible to any process that introspects the build daemon mid-build, and (c) the `.env.local` file would land inside the `build` stage image at `/app/.env.local`.
- Fix:
  1. Add a `.dockerignore` containing at minimum `node_modules`, `.next`, `.env*`, `!.env.example`, `.git`, `.husky`, `.playwright-cli`, `playwright-report`, `test-results`, `docs/audit`, `*.har`.
  2. In `Dockerfile:20-31`, add `USER node` (and `RUN chown -R node:node /app` if needed) before `CMD`.

---

## P2 - Hardening

### P2-1 - No `SESSION_SECRET` rotation strategy

- iron-session 8 supports `password: [{ id: 2, password: NEW }, { id: 1, password: OLD }]` to rotate without logging everyone out. `src/lib/session.ts:28-39` passes a single string.
- `grep -nE 'rotat' docs/specs/04-auth-and-profile.md docs/specs/11-deployment-railway.md docs/specs/10-prod-readiness.md` returns four hits, all about **recovery code** rotation. Zero docs / runbook lines describe rotating `SESSION_SECRET`.
- Impact: rotating the secret on Railway nukes every active session - acceptable for a hackathon, but worth a one-line note in `docs/specs/11-deployment-railway.md`. If the team wants graceful rotation later, they need the array form here.

### P2-2 - `pnpm audit` flags two moderate vulns (both dev-only)

- `pnpm audit` output (full, dev+prod):
  - `esbuild <=0.24.2` GHSA-67mh-4wv8-2f99 - path: `. > drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils > esbuild`. Affects the dev server only; not used in `next build`.
  - `postcss <8.5.10` GHSA-qx2v-qp2m-jg93 - path: `. > next > postcss`. Build-time XSS in CSS stringify, requires attacker-controlled CSS input. Not exploitable in this repo because all CSS is first-party Tailwind.
- `pnpm audit --prod` confirms: only the postcss one shows in production paths (1 moderate).
- `pnpm-lock.yaml:426-431, 4599-4607` show the deprecated `@esbuild-kit/*` packages reaching `drizzle-kit@0.31.10`. drizzle-kit has merged this into `tsx` in newer minor versions; bumping `drizzle-kit` clears the esbuild advisory. Bumping `next` past the patched postcss release clears the other.
- Fix: `pnpm up drizzle-kit next` and re-run `pnpm audit`.

### P2-3 - CSP allows `'unsafe-inline'` + `'unsafe-eval'` in `script-src`

- `next.config.ts:13` `"script-src 'self' 'unsafe-inline' 'unsafe-eval'"`.
- Next.js 16 with React 19 still ships inline runtime; tightening to nonce-based CSP requires `nonce` middleware wiring. Acceptable for hackathon but worth documenting as a known gap. `style-src 'unsafe-inline'` is similarly Tailwind-driven.
- The rest is solid: `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, HSTS preload, `X-Frame-Options DENY`, `Permissions-Policy camera=(), microphone=(), geolocation=(self)`.

### P2-4 - Husky pre-push can be bypassed silently

- `.husky/pre-push:1-15` runs `pnpm check`, prints `[pre-push] FAILED. Push blocked.` and exits non-zero - good. It also explicitly tells the user `to bypass for emergencies, use: git push --no-verify`, which conflicts with the user-memory rule "never push without `pnpm check` passing; do not suggest --no-verify" (per `~/.claude/projects/-Users-flv-hackathon-haufe/memory/MEMORY.md`).
- Server-side bypass detection requires a CI gate. `.github/workflows/ci.yml:23-28` runs `pnpm check` on every PR + push to main, so a `--no-verify` push to `main` still gets caught (CI will fail), but no branch protection rule is visible. Recommend enabling "Require status checks to pass before merging" in GitHub settings (out-of-repo).
- Fix: drop the `--no-verify` hint from the hook message, or change the message to "use only with explicit approval".

### P2-5 - Demo seed credentials are hardcoded constants in the script

- `scripts/seed-demo.ts:19-20`
  ```ts
  const DEMO_PASSWORD = "Showup2move!";
  const DEMO_RECOVERY_CODE = "DEMO-RECOV-2026";
  ```
- These are used for hash-and-store at `scripts/seed-demo.ts:180-181`, never logged. The seed script is double-gated by `ALLOW_DEMO_SEED=true` AND `DEMO_SEED_CONFIRM=showup2move` (`src/lib/demo/guard.ts:51-54`), and demo mode itself requires `ALLOW_DEMO_MODE=true` plus `DEMO_MODE_SECRET` for read endpoints (`src/lib/demo/guard.ts:19-31`, with `timingSafeEqual` - good).
- Risk: if a production env ever flips `ALLOW_DEMO_SEED=true` and `DEMO_SEED_CONFIRM=showup2move`, anyone who knows the values from the public repo can log in as `demo_alex` etc. This is the intended "Judge Mode" tradeoff but should be called out in `docs/specs/11-deployment-railway.md`.

### P2-6 - Dockerfile base image is tag-pinned, not digest-pinned

- `Dockerfile:1` `FROM node:22-alpine AS base`. `node:22-alpine` is a moving tag; today's `:22-alpine` is not tomorrow's. For reproducible builds and supply-chain pinning, switch to `FROM node:22-alpine@sha256:<digest>`.
- Low priority for hackathon; included for completeness.

---

## P3 - Cosmetic

### P3-1 - Three `NEXT_PUBLIC_*` vars used by code are not in `.env.example`

- `src/app/[locale]/page.tsx:43` reads `NEXT_PUBLIC_GITHUB_URL`.
- `src/app/[locale]/demo/page.tsx:87` reads `NEXT_PUBLIC_BUILD_SHA`.
- `src/components/map/MapInner.tsx:65` reads `NEXT_PUBLIC_MAPTILER_KEY`.
- None appear in `.env.example` (verified by `grep -nE 'NEXT_PUBLIC_GITHUB_URL|NEXT_PUBLIC_BUILD_SHA|NEXT_PUBLIC_MAPTILER_KEY' .env.example` -> 0 hits).
- All three are intentionally public (GitHub URL, build SHA, MapTiler key with optional fallback) - not a leak. Just document them so onboarding doesn't have to grep for them.

### P3-2 - `getR2Bucket` and `getPublicUploadBaseUrl` throw plain `Error` instead of validating in `env.ts`

- `src/lib/r2.ts:55-72` defers env validation to call-time. This is consistent with the lazy-init pattern but means an upload-path misconfig surfaces only when a user attempts to upload, not at boot. Adding `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `PUBLIC_UPLOAD_BASE_URL` to the conditional `superRefine` block in `src/lib/env.ts:22-47` (gate by "uploads enabled" flag if you want it skippable) gives fail-fast at boot.

### P3-3 - `pnpm-lock.yaml` shows `package.json` modified but with empty diff

- `git status` reports `M package.json` and `M pnpm-lock.yaml`; `git diff HEAD -- package.json` returns 0 lines. Looks like a stat-cache mismatch from `pnpm install`. Run `git update-index --refresh` to clear it. Pure cosmetic.

---

## Diff notes

Compared with previous security partial `docs/audit/_partials-2026-05-09-1247-security/`:

- **Improved**: `src/lib/env.ts` gained the production fail-fast `superRefine` block (commit `4ae8f16`); confirmed at `src/lib/env.ts:22-47`. Previous audit's "env not validated in prod" finding is closed.
- **Improved**: Pre-push hook now exists at `.husky/pre-push:1-15` and runs `pnpm check`. Previous audit had no client-side gate.
- **Improved**: Demo guards (`canReadDemoEndpoint` + `canMutateDemoEndpoint`) use `timingSafeEqual` and `ALLOW_DEMO_MODE` gating (`src/lib/demo/guard.ts:19-49`). Previous "Judge Mode unguarded" risk is closed.
- **New gap**: No `.dockerignore` (was not flagged in previous partial; appears to have been overlooked).
- **Persistent gap**: Session secret rotation - same as previous audit's note 9. Still no rotation array, still no doc.
- **Persistent gap**: CSP `'unsafe-inline'`/`'unsafe-eval'` - unchanged; tracked.

---

## Verified clean

- **Git history of env files**: only `.env.example` was ever added. `git log --all --diff-filter=A -- '*.env' '.env' '.env.local' '.env.production'` -> no output.
- **HAR file** `/Users/flv/hackathon_haufe/showup2move.up.railway.app.har`: 0 `set-cookie`, 0 `authorization`, 0 `x-api-key`, 0 token-shaped matches. Skimmed only via `grep -ciE`, did not dump body.
- **Build artefact secret inlining**: `.next/static/**/*.js` contains zero matches for `GROQ_API_KEY|R2_SECRET_ACCESS_KEY|SESSION_SECRET`. Server chunks under `.next/server/chunks/` reference these env names (expected; server-side only).
- **Client component env reads**: only `src/components/map/MapInner.tsx:65` reads `process.env` from a `"use client"` file, and only `NEXT_PUBLIC_MAPTILER_KEY` (intended public).
- **Lockfile supply chain**: 0 git deps, 0 github deps, 0 tarball deps; every package resolves with sha512 integrity from npm registry. Only 11 transitive packages have install scripts: all in the `esbuild|sharp|unrs-resolver|@esbuild-kit/core-utils` family (well-known native-binary packages).
- **CI secret use**: `.github/workflows/ci.yml` references zero `secrets.*` - safe for fork PRs by construction.
- **Auth crypto logging**: zero `console.*` calls in `src/lib/auth-crypto.ts`, `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/groq.ts`. Recovery codes are not logged anywhere (`grep -rE 'console.*recovery' src` -> 0 hits).
- **Image upload safety**: `src/lib/uploads.ts:20-58` magic-byte sniffs MIME (PNG/JPEG/WEBP only), `src/lib/uploads.ts:73` enforces 8 MiB cap, `src/lib/uploads.ts:91-97` re-encodes via `sharp` with `failOn: "truncated"`, strips EXIF (no `withMetadata({})` - default sharp behavior drops metadata), resizes to 512x512 webp. Object key uses `randomUUID()` (`src/lib/uploads.ts:140`) so users cannot collide on storage paths.
- **R2 credentials**: sourced exclusively from `process.env` (`src/lib/r2.ts:28-30`), never hardcoded, never logged. Singleton client (`src/lib/r2.ts:23-26`) prevents repeated key material allocation.
- **R2 access pattern**: server-action only (`src/lib/upload-actions.ts:1`); no presigned URLs issued to clients, so no TTL concerns.
- **Demo gates**: `canReadDemoEndpoint` requires both `ALLOW_DEMO_MODE=true` and a `DEMO_MODE_SECRET` of length >= 64 (Zod validates at `src/lib/env.ts:13`) plus `timingSafeEqual` header check (`src/lib/demo/guard.ts:9-31`). Mutate endpoints require `ALLOW_DEMO_MODE` + same-origin (`src/lib/demo/guard.ts:46-49`).
- **AGENTS.md / CLAUDE.md**: no pasted secrets. AGENTS.md:72 explicitly forbids logging recovery codes/secrets/coords; AGENTS.md:118 calls for gitleaks in CI (still TODO).
- **Cookie attributes**: `src/lib/session.ts:31-37` - `httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "lax"`, 30-day maxAge, `path: "/"`. Defensible.
