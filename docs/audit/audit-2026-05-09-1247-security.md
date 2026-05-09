# ShowUp2Move - Pre-Deploy Security Audit (10 lanes, parallel)

**Generated:** 2026-05-09 12:47 local
**Scope:** Pre-Railway-push security + deploy verdict
**Method:** 10 parallel read-only Explore agents (A01, A02, A03, A04, A05, A06, A07, A09, A10, plus deploy-readiness)
**HEAD:** `2f79714 feat: add persisted group chat`

---

## TL;DR - **Push to Railway: SAFE TO DEPLOY**

The deploy will succeed. There are no production-blocking security issues. Five high-value hardening fixes (≤30 min total) raise the security floor from "MVP-good" to "production-grade" before judges hit the URL.

| Lane | Grade | Verdict |
|---|---|---|
| **A01 Access Control** | C | One CRITICAL pattern (mutate-before-ban-check); page guards 100%, ownership 90% |
| **A02 Crypto/Secrets** | B+ | No leaks. Missing HSTS. Env schema doesn't enforce DATABASE_URL/GROQ_API_KEY/R2_* in prod |
| **A03 Injection** | **A** | 100% zod on 21 server actions. No XSS/SQL/cmd injection. Drizzle parameterized everywhere |
| **A04 Rate-Limit / DoS** | C | 60% coverage (6/10 surfaces). Onboarding + prompt-response + match formation unguarded |
| **A05 HTTP Headers / CSP** | C | X-Frame/Referrer/Permissions OK; **no CSP, no HSTS, no robots.txt** |
| **A06 Dependencies** | **A** | Lockfile frozen, no known CVEs in versions used, no typosquats, MIT/Apache only |
| **A07 Auth/Session** | C | Bcrypt cost still **10** (should be 12). Session-revoke (Codex C1) only partially fixed via `userUpdatedAt` comparison; no explicit session-id rotation |
| **A09 Logging/Privacy** | **A** | Zero `console.*` calls in src/. ActionResult discriminates errors. Recovery codes never logged |
| **A10 SSRF** | **A** | No external `fetch()` calls yet - SSRF-safe by design at Phase 1 |
| **Deploy Readiness** | **A** | Migrations forward-only, Dockerfile correct, `/api/health` DB-aware, 14 Railway env vars list ready |

**Composite security grade: B** (was C+ pre-commits; the post-12:06 fix wave moved A02/A07/A04 up materially).

---

## 1. Will the deploy work? - **YES, if you set the env vars**

The deploy-readiness lane (Grade A, verdict `DEPLOY_OK`) verified:

- `railway.toml` - `pnpm install --frozen-lockfile && pnpm build` build, `pnpm db:migrate && pnpm start` start, `/api/health` healthcheck with 120s timeout
- `Dockerfile` - multi-stage Alpine + pnpm + standalone Next output. `public/` exists with `.keep` so `COPY` won't fail
- `next.config.ts` - `output: "standalone"` set; standalone build script `scripts/prepare-standalone.mjs` copies `public/` + `static/` at runtime
- 5 migrations (`0000` → `0004`) all forward-only, no destructive `DROP TABLE`/unsafe `ALTER`, FK cascades clean, CHECK constraints valid
- `/api/health` is now DB-aware (post `95fd74b`) - returns `{ ok, db: "up"|"down"|"not_configured", commit, version, phase }`
- Node 22 selected via `engines`

### Required Railway env vars (set BEFORE first push)

| Var | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **YES** | Auto-injected if Railway Postgres is linked |
| `SESSION_SECRET` | **YES** | 64+ random hex chars: `openssl rand -hex 32` |
| `PUBLIC_BASE_URL` | **YES** | `https://<your-railway-domain>` |
| `GROQ_API_KEY` | YES (for AI rows) | Already in `.env.local` for dev; copy to Railway |
| `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `PUBLIC_UPLOAD_BASE_URL` | YES (for photo upload row) | Cloudflare R2 |
| `RESEND_API_KEY` | optional | only if email reminders used |
| `ALLOW_DEMO_MODE`, `DEMO_MODE_SECRET`, `ALLOW_DEMO_SEED`, `DEMO_SEED_CONFIRM` | YES (for Judge Mode) | demo gating |
| `GROQ_TEXT_MODEL`, `GROQ_VISION_MODEL`, `OPEN_METEO_BASE_URL`, `OVERPASS_BASE_URL` | optional | sane defaults in code |

**If `DATABASE_URL` is missing or Postgres is unlinked**, `pnpm db:migrate` fails silently and the app 503s on `/api/health`. Verify the Postgres service link first.

---

## 2. Security risks ranked by severity

### 🟥 BEFORE DEPLOY - fix in the next 15–30 min (high-value, low-risk)

1. **Bcrypt cost 10 → 12** in `src/lib/auth-crypto.ts:4` - 1-line change. Adds ~100 ms per signup; OWASP-recommended. **OWASP A07.**
2. **Add CSP + HSTS to `next.config.ts` headers** - copy a starter CSP for Tailwind 4 + shadcn + Groq/Open-Meteo/Overpass `connect-src`. **OWASP A05.**
3. **Add HSTS** (separate from CSP): `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`. **OWASP A02 + A05.**
4. **Move banned/deleted check ABOVE the mutation** in `src/lib/onboarding.ts` (profile lines 40-68, sports 95-135, location 175-189). Currently mutates first, then validates active user - banned users can race-mutate. **OWASP A01.**
5. **Build `requireUser()` helper** in `src/lib/auth-current-user.ts` that throws/redirects. Adopt across all server actions. Currently each action hand-rolls. **Code quality + A01.**

These five changes take ≤30 min and lift the composite grade from B to A−.

### 🟧 SOON - within first deploy iteration

6. **Rate-limit onboarding + prompt-response + match formation** - only 60% of mandated surfaces are covered. Onboarding spam can exhaust DB; prompt-response flood triggers expensive matching. **OWASP A04.**
7. **Strengthen env validation** in `src/lib/env.ts`: enforce `DATABASE_URL` + `GROQ_API_KEY` + `R2_*` presence in production (currently `.optional()`). **OWASP A02.**
8. **Add `public/robots.txt`** with `Disallow: /api/, /admin/, /onboarding/`. Stops accidental search-engine indexing of mid-flow URLs.
9. **Explicit session-id rotation on recovery** (Codex C1 partial fix only): `808cbcf` uses `userUpdatedAt` comparison to invalidate, which works on next request. For belt-and-braces, rotate the iron-session sealed cookie too. **OWASP A07.**
10. **Add `pnpm audit --audit-level high || true` to CI** for ongoing dependency monitoring (deps lane is A today; CVE shows up tomorrow).

### 🟩 NICE-TO-HAVE - post-hackathon

11. SECURITY.md disclosure policy, Dependabot/Renovate, security audit log table, `/.well-known/security.txt`.

---

## 3. Lane Highlights

### A03 Injection (Grade A) - the standout

- **100% zod coverage** across 21 server actions (auth, onboarding × 3, prompt, matching, chat)
- Drizzle parameterized SQL everywhere; raw `sql` template literals only used with zod-validated UUIDs (e.g., `matching.ts:255` advisory-lock query is safe because `promptId` is UUID-validated upstream)
- No raw HTML injection sinks, no `eval`, no `child_process`, no path traversal
- `redirect()` calls use hardcoded paths only

### A05 Headers - biggest pre-deploy fix

Currently set: `X-Content-Type-Options=nosniff`, `X-Frame-Options=DENY`, `Referrer-Policy=strict-origin-when-cross-origin`, `Permissions-Policy=camera=(), microphone=(), geolocation=(self)`.

**Missing:** CSP and HSTS. Suggested starter for `next.config.ts`:

```js
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload',
},
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "img-src 'self' https: data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "font-src 'self' data:",
    "connect-src 'self' https://api.groq.com https://api.open-meteo.com https://overpass-api.de",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}
```

### A04 Rate-limit gaps

| Surface | Status | Recommended policy |
|---|---|---|
| signup / login / recover | ✅ | already done |
| chat send | ✅ | 20 / 60s already done |
| **onboarding profile/sports/location** | ❌ | 30 / 5min per user |
| **prompt response (Yes/No)** | ❌ | 5 / 60s per user-per-prompt |
| **match formation** | ❌ | 1 / 30s per prompt (deduplication via advisory lock helps) |
| photo upload | (not wired yet) | when wired: 10 / 60s + 5MB cap |
| SSE opens | (not implemented) | when wired: 10 concurrent / IP |

### A07 Auth - what shipped vs what's still open

| Issue | Pre-12:06 | Post-12:06 | Verdict |
|---|---|---|---|
| Bcrypt cost | 10 | 10 | **Still 10** - fix required |
| Session revocation on recovery | Static, no rev | `userUpdatedAt` invalidates next request | Partial; works in practice |
| `x-forwarded-for` spoofing | Trusts first hop | `isIP()` validation, rightmost valid IP | **Fixed** |
| Recovery code (entropy 25 bits, single-display, bcrypt-hashed) | OK | OK | OK |
| Login error generic | Yes | Yes | OK |
| Username enumeration on signup | Yes (`username_taken`) | Yes | Acceptable for social app - flag in ADR |
| `requireUser()` helper | Missing | Missing | Build it |
| Per-user lockout separate from rate-limit | None | None | Rate-limit is enough |

---

## 4. Suggested deploy sequence

1. **Generate SESSION_SECRET locally:** `openssl rand -hex 32` - copy to clipboard
2. **Link Railway Postgres** to the web service (Railway dashboard)
3. **Set the 14 env vars** in Railway dashboard (use the Groq key from local `.env.local` - never echo it to chat)
4. **Push to Railway** (`git push`) - Railway runs `pnpm install --frozen-lockfile && pnpm build`, then `pnpm db:migrate && pnpm start`
5. **Wait for healthcheck** (`/api/health` should return `{ ok: true, db: "up", … }` within 120s)
6. **Smoke test** `/`, `/ro/login`, `/ro/signup` from incognito
7. **Apply the 5 pre-deploy fixes** (§2 🟥) and push again

If any fix in §2 is too risky to ship in the next push, ship without it; the deploy will still work. The fixes harden the floor; they're not gates.

---

## 5. Lane Reports

Each agent's full report lives in `docs/audit/_partials-2026-05-09-1247-security/`:

- `01-auth-session.md` - A07
- `02-injection.md` - A03
- `03-secrets-env.md` - A02
- `04-access-control.md` - A01
- `05-headers-csp-csrf.md` - A05
- `06-ssrf.md` - A10
- `07-deploy-readiness.md` - Railway push
- `08-logging-privacy.md` - A09
- `09-rate-limit-dos.md` - A04
- `10-deps-supply-chain.md` - A06

(Heads-up: the audit dir is untracked - these will get scrubbed by the next `git clean`. To preserve: `git add docs/audit/ && git commit -m "docs: track audit history"`.)

---

## 6. Bottom Line

- **Deploy: GO.** Set the env vars, push, watch the healthcheck.
- **Production-grade vs MVP-grade: 30 min apart.** The 5 fixes in §2 🟥 close the gap.
- **A03 / A06 / A09 / A10 are already A.** That's a strong floor for a hackathon submission.
- **No CRITICAL deploy blockers.** Every issue surfaced is fixable in ≤ 30 min and none gates the first push.
