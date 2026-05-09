# OWASP / Auth + AI wiring audit

Read-only snapshot at T+1h23m (worktree clean, `pnpm typecheck` passes). Cites `file:line` for every claim.

---

## 1. OWASP / Auth status snapshot

| Check | Status | Evidence / one-liner |
|---|---|---|
| bcrypt cost (target ≥ 12) | PASS | `BCRYPT_COST = 12` for both password and recovery — `src/lib/auth-crypto.ts:4`, used by `hashPassword:13` / `hashRecoveryCode:23` |
| `requireUser()` / `requireAdmin()` adoption | FAIL | Defined at `src/lib/auth-current-user.ts:66,74` but **0 callers across `src/lib/**`**. Every server-action module hand-rolls `getCurrentUser()` + null check (16 callers across 13 files). See section "requireUser adoption" below for the full list. |
| x-forwarded-for trust | PARTIAL | `src/lib/request-ip.ts:25-36` prefers `cf-connecting-ip` / `x-real-ip` / `fly-client-ip` first, then takes the **last** comma-separated `x-forwarded-for` IP. Last-segment is correct *if* the app is always behind a single trusted proxy (Railway/Cloudflare). No env switch to disable trust in non-proxied dev — minor risk if the app is ever hosted behind 0 proxies, but acceptable for this hackathon deploy target. |
| Session revocation on recovery | PASS | `recoverAccountAction` writes `updatedAt: new Date()` (`src/lib/auth.ts:234`) and `getCurrentUser()` clears the cookie when `session.userUpdatedAt !== user.updatedAt.toISOString()` (`src/lib/auth-current-user.ts:44-47`). Old sessions are killed on next request. NOTE: commit `5714172` is a **UX gate only** (hides step 2 until username+code filled in `RecoverForm.tsx`); the server-side revocation predates it but is still verified working. |
| CSP / HSTS in `next.config.ts` | PARTIAL | Both set at `next.config.ts:8-39`. CSP includes `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (`:13`) which is required by Next 16 RSC but is the weakest CSP knob. HSTS is `max-age=31536000; includeSubDomains; preload` — solid. `frame-ancestors 'none'`, `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, Referrer-Policy, Permissions-Policy all set. |
| Recovery-code logging | PASS | Grep across `src/lib/**` and `src/app/**` for `console.*` finds **zero hits** near recovery-code paths. Only `console.warn` is in `src/lib/upload-actions.ts:144` (R2 delete) and a few `error.tsx` digest dumps. |
| Rate-limit coverage | PARTIAL | Coverage matrix below. Auth/chat/invite/demo are covered; **uploads, AI requests, and onboarding writes are NOT**. |

### `requireUser` adoption

`requireUser`/`requireAdmin` are defined but **never called outside `auth-current-user.ts` itself** (`requireAdmin:75` calls `requireUser`). Every module re-implements `const user = await getCurrentUser(); if (!user) return actionError("unauthorized")` by hand:

- `src/lib/prompt.ts:123`
- `src/lib/match-confirm-actions.ts:36, 66`
- `src/lib/upload-actions.ts:25`
- `src/lib/ai-actions.ts:17, 43`
- `src/lib/photo-actions.ts:23`
- `src/lib/manual-event-actions.ts:71`
- `src/lib/chat.ts:120, 149`
- `src/lib/events.ts:194, 589`
- `src/lib/notification-actions.ts:20, 48, 60`
- `src/lib/votes.ts:26`
- `src/lib/settings-actions.ts:50, 68, 84`
- `src/lib/invites.ts:67`
- `src/lib/venues.ts:45`
- `src/lib/leaderboard.ts:83`

Also `src/app/[locale]/u/[username]/page.tsx:125` (RSC). The hand-rolled pattern is consistent and correct, so this is a **code-hygiene gap, not a vulnerability** — but it means a future contributor who forgets the null check has no compile-time safety net.

### Rate-limit coverage by route

| Route | Status | File:line |
|---|---|---|
| Signup | PASS | `src/lib/auth.ts:107` (`checkSignupAttempt`, IP bucket, 10/h) |
| Login | PASS | `src/lib/auth.ts:159-181` (`loginIpUserBucket` 5/15m + `loginUserBucket` 10/15m, `recordLoginFailure`) |
| Recovery | PASS | `src/lib/auth.ts:201-220` (`recoveryIpUserBucket` 3/30m) |
| Group chat send | PASS | `src/lib/chat.ts:482` (`chatUserGroupBucket` 20/60s) |
| Event chat send | PASS | `src/lib/chat.ts:578` (`chatUserEventBucket` 20/60s) |
| Invite create | PASS | `src/lib/invites.ts:108` (`inviteUserEventBucket` 6/h) |
| Invite preview | PASS | `src/lib/invites.ts:172-214` (`invitePreviewIpBucket` 60/60s) |
| Demo seed | PASS | `src/app/api/demo/seed/route.ts:48-70` (5/h IP) |
| Demo reset | PASS | `src/app/api/demo/reset/route.ts:67-79` (5/h IP) |
| **Profile photo upload** | **FAIL** | `src/lib/upload-actions.ts:22` (`uploadProfilePhotoAction`) — auth-checked but NO rate-limit. AGENTS.md explicitly lists "uploads" in the rate-limit list. |
| **AI bio extraction** | **FAIL** | `src/lib/ai-actions.ts:16, 35` — auth-checked but NO rate-limit. Each call is a Groq round-trip; abuse risk = burning the API key. |
| **AI photo extraction** | **FAIL** | `src/lib/photo-actions.ts:20` — auth-checked but NO rate-limit. Same Groq abuse risk + 4MB upload per call. |
| **Manual event create** | **FAIL** | `src/lib/manual-event-actions.ts:63` — auth-checked but NO rate-limit. |
| **Onboarding writes** (`updateOnboardingProfileAction`, sports, location) | **FAIL** | `src/lib/onboarding-form-actions.ts` — no rate-limit. AGENTS.md doesn't list onboarding explicitly, so this is a watch-item not a hard gap. |
| SSE opens | N/A | No `text/event-stream` route exists yet — SSE proof is "still pending" per `src/lib/demo/scoring-proofs.ts:152`. Cannot fail what doesn't ship. |

**Composite OWASP grade: B-.** Strong primitives (bcrypt-12, session revocation, CSP/HSTS, deterministic recovery flow). Top remaining gaps are (1) AI/upload routes have no rate-limit despite AGENTS.md mandating it, and (2) `requireUser()` is dead code — every module hand-rolls auth checks.

---

## 2. `createManualEventAction` security (`src/lib/manual-event-actions.ts`)

| Check | Status | Evidence |
|---|---|---|
| Auth check before any DB write | PASS | `getCurrentUser()` at `:71`, returns `actionError("unauthorized")` at `:73` before the transaction at `:101`. |
| zod input validation | PASS | `createManualEventInputSchema.safeParse(input)` at `:66`. Schema at `:14-19` enforces sport enum, `whenAt` 1-40 chars, customLocationText 1-160 chars nullable, title ≤120. Additional `Number.isNaN(whenAt.getTime())` guard at `:77`. |
| Anonymous events impossible | PASS | Auth gate is *before* the prompt fetch and DB transaction. |
| Captain identity | PASS | `captainUserId: user.id` at `:112` and `userId: user.id` at `:123` are pulled from the verified session — there is no captain field in the input schema, so IDOR via spoof is structurally impossible. |
| Owner-checked membership | PASS | The auto-created group is one-row, captain = caller; nothing pulls another user's identity from the request. |
| Rate-limit applied | **FAIL** | No rate-limit. A logged-in user can spam-create events + groups + system messages indefinitely. Should reuse the `auth-rate-limit` infra with a `manual_event:user` bucket. |

Verdict: **action is auth-correct and IDOR-safe; missing only rate-limit.**

---

## 3. AI wiring verification

| Feature | Status | UI caller | Server action | Lib |
|---|---|---|---|---|
| `extractSportsFromBioTextAction` | **WIRED** | `src/components/onboarding/ProfileForm.tsx:145` (Suggest button), also `:224` calls `extractSportsForCurrentUserAction()` post-save | `src/lib/ai-actions.ts:35-50` (zod-validated, auth-gated) | `src/lib/ai/bio-extract.ts:53` — fires Groq when `isGroqConfigured()` (`:61`), falls back to keyword-match |
| `generateCaptainBrief()` | **WIRED** | `src/app/[locale]/events/[eventId]/page.tsx:96` (server-rendered, `groupSize > 0` guard, try/catch belt-and-suspenders) | (called directly from RSC, no separate action wrapper — fine for read-only briefs) | `src/lib/ai/captain-brief.ts:123` — `getOrCompute()` cache by `JSON.stringify(input)` (`:133`), TTL 24h |
| `extractSportsFromPhotoAction` | **WIRED** | `src/components/onboarding/PhotoForm.tsx:128` (Analyze button) | `src/lib/photo-actions.ts:20-55` (auth-gated, MIME-sniffed, MAX_BYTES enforced, FormData blob → Uint8Array) | `src/lib/ai/photo-extract.ts:23` — base64-encodes (`:33`), data-URL builds at `:34`, calls vision model via `chatJson` (`:39-53`), 0.35 confidence floor |
| `scoreCompatibility()` | **WIRED** | `src/app/[locale]/u/[username]/page.tsx:137` via `getCompatibilityForViewer` → `src/lib/profile-public.ts:203` | (RSC, no separate action) | `src/lib/ai/compat-score.ts:192` — runs deterministic baseline first (`:196`), only calls Groq when configured (`:198`); always trusts deterministic `sharedSports`/`proximityFit` (`:251-253`) |

**Scorecard: 4 wired / 0 shipped-not-wired / 0 dead.** All four AI features have UI entry points, server-action wrappers (where appropriate), and verified lib paths.

---

## 4. Determinism + safety re-check

| Check | Status | Evidence |
|---|---|---|
| Short-circuit when `GROQ_API_KEY` unset | PASS | `isGroqConfigured()` checks `process.env.GROQ_API_KEY` at `src/lib/groq.ts:51`. All four AI modules gate on it: `bio-extract.ts:61`, `photo-extract.ts:27`, `captain-brief.ts:126`, `compat-score.ts:198`. |
| No raw input logged in AI paths | PASS | Zero `console.*` calls across `src/lib/ai/**`, `src/lib/groq.ts`, `src/lib/ai-actions.ts`, `src/lib/photo-actions.ts`. Errors are silently swallowed via `try { ... } catch { /* fall through */ }` to deterministic fallbacks. |
| Cache-by-hash works | PASS | `src/lib/ai/cache.ts:13-20` SHA-256 hashes parts; `getOrCompute` at `:22` reads from `aiCache` table by `inputHash`, writes with `onConflictDoUpdate` (`:60`). Best-effort writes — won't fail the request if DB hiccups. |
| Demo can preload cache rows | PASS | `aiCache` is a normal Drizzle table (`src/db/schema.ts` has it; cache writes use `db.insert(aiCache)` at `cache.ts:58`). Seed script can write deterministic rows keyed by the same `hashKey(parts)` used at runtime. |
| Demo-safe fallback per feature | PASS | `bio-extract`: `extractSportsByKeyword` returns rule-based suggestions (`bio-extract.ts:32-51`). `photo-extract`: empty suggestions array (acceptable — UI shows "fallback hint"). `captain-brief`: `buildFallbackCaptainBrief` builds a deterministic summary from inputs (`captain-brief.ts:79-105`). `compat-score`: `scoreCompatibilityDeterministic` is the **baseline**, AI only enriches `score`/`reason`/`scheduleFit` (`compat-score.ts:113-179, 251-258`). Judges can verify each fallback against fixed inputs. |

---

## 5. `.env.local` and key handling

- **`GROQ_API_KEY`**: **set**. Key available, team can wire features now. (Value never echoed to chat/file.)
- **`GROQ_TEXT_MODEL`** and **`GROQ_VISION_MODEL`**: set.
- **R2 vars** (`R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `PUBLIC_UPLOAD_BASE_URL`): **NOT SET in `.env.local`**. Photo upload will fail or fall back at runtime; AI photo extract still works (it doesn't depend on R2, only reads the in-memory bytes). Flag for the deploy lane.
- **`DATABASE_URL`**: **NOT SET in `.env.local`**. Either someone is using the Railway URL via shell env, or local dev is broken. Worth a one-line confirmation before demo.
- **`SESSION_SECRET`**: not visible in `.env.local` (production-required by `getServerEnv()`).
- **Env-validation schema (zod) at boot**: PARTIAL. `src/lib/env.ts:9-47` defines `serverEnvSchema` with proper `superRefine` for production requirements (`DATABASE_URL`, `SESSION_SECRET`, `PUBLIC_BASE_URL` all required when `NODE_ENV === "production"`). However `getServerEnv()` is exported but **not called at app boot** — grep finds zero callers in `src/`. Risk: prod app starts even when `SESSION_SECRET` is missing (cookies fail silently or use a weak default), which is an A02 (Cryptographic Failures) sensitive-data risk. **Recommended fix:** invoke `getServerEnv()` once in `src/app/layout.tsx` or `instrumentation.ts` so misconfiguration fails fast.

**Key-handling verdict:** Groq key is server-side-only (`src/lib/groq.ts:1` uses `"server-only"`, all `process.env.GROQ_API_KEY` reads happen inside server modules). No leak to client bundles. R2 + DB env gaps are operational, not security holes.
