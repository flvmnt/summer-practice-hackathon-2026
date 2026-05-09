# 01 — Auth & Session Security

## TL;DR
Core auth (iron-session + bcryptjs cost 12 + Drizzle, hashed recovery code with one-time rotation, dummy-hash timing-safe missing-user path, sane Zod validators) is solid for hackathon scope. **Worst real finding is the rate-limit IP-spoofing bypass via `cf-connecting-ip` / `x-real-ip` / `fly-client-ip`** — Railway does not strip those headers, so any attacker can rotate the spoofed value to defeat the per-IP login/signup buckets and create unlimited accounts. A close second is the `/[locale]/demo/scripted` GET route, which auto-logs the visitor in as `demo_alex` (session fixation by GET) when `ALLOW_DEMO_MODE=true` is on for judges. Several smaller gaps: `logoutAction` is orphaned (no UI calls it), the `requireUser`/`requireAdmin` helper is dead code, and `DEMO_RECOVERY_CODE` in `scripts/seed-demo.ts` is a malformed string that will throw inside `recoveryCodeSchema.parse`.

## Findings

### [P1] IP-based rate limits trivially bypassed via spoofed proxy headers
**Where:** `src/lib/request-ip.ts:25-36` (`getRequestIpFromHeaders`), consumed by `src/lib/auth.ts:106,158,200` and `src/app/api/demo/seed/route.ts`, `src/app/api/demo/reset/route.ts`.
**What:** `getRequestIpFromHeaders` blindly trusts the first non-empty value of `cf-connecting-ip`, `x-real-ip`, `fly-client-ip` and falls back to the **last** entry of `x-forwarded-for`. Railway's proxy does not strip any of these inbound headers and we have no proxy-trust list. An attacker hitting `/login` directly (or via curl/Burp) can set `cf-connecting-ip: <random>` on every request and never collide with their previous rate-limit bucket.
**Impact:**
- Login: bypasses `loginIpUser` (5/15min) entirely. Falls back to the username-only bucket (`loginUser` 10/15min), but a determined attacker can run 10 attempts/15min/username across the whole user table; combined with `Showup2move!` being a known seeded password (see [P1] below) this is a credential-stuffing channel.
- Signup: `signupIp` (10/hour) is the **only** signup gate. Spoofing the IP gives unlimited account creation, enabling DB-bloat / username-grab DoS.
- Recovery: same — `recoveryIpUser` becomes per-username only, weakening the 3/30min cap into 3/30min/IP-spoof.
- Demo seed/reset and chat throttles inherit the same bypass.
**Fix:** Read IP only from a known-trusted hop. On Railway/Cloudflare, treat the right-most entry of `x-forwarded-for` as untrusted and instead pin to a single header you actually deploy behind (e.g. only `x-forwarded-for` from Railway, last-from-trusted-list); reject `cf-connecting-ip`/`fly-client-ip` unless explicitly enabled by env.

### [P1] Known seeded credentials work against the production login form
**Where:** `scripts/seed-demo.ts:19,38` and `src/lib/demo/scripted-login.ts:9,38-45`.
**What:** Seed creates `demo_alex` (and the rest of `DEMO_USERS`) with the literal password `Showup2move!`. Once the demo run is seeded into the live DB, any unauthenticated visitor can log in via the normal `/login` form using `demo_alex` / `Showup2move!` — `ALLOW_DEMO_MODE` does **not** gate the `/login` form, only the `/demo/*` routes.
**Impact:** Anyone who reads the public repo gains a real authenticated session as `demo_alex` in production whenever the demo seed has been run there. From there: full chat/event/RSVP/leaderboard write-access scoped to the demo run. Not just a backdoor — a published shared password.
**Fix:** Generate a random password per seed run (or per env), or refuse to seed when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` AND a per-deploy random `DEMO_SEED_PASSWORD` is provided; never commit the literal.

### [P1] `/[locale]/demo/scripted` is a GET-driven session-fixation backdoor
**Where:** `src/app/[locale]/demo/scripted/route.ts:11-35` invoking `src/lib/demo/scripted-login.ts:18-48`.
**What:** A plain `GET /<locale>/demo/scripted` (with a working `ALLOW_DEMO_MODE=true`) calls `saveUserSession()` for `demo_alex` and sets the iron-session cookie. There is no CSRF token, no POST requirement, no Origin/Referer check, no captcha, no confirm step. The route is `dynamic = "force-dynamic"`, so a third-party `<img src="https://app/.../demo/scripted">` or a single-click phishing link in any locale (`/ro/demo/scripted` or `/en/demo/scripted`) silently mints an authenticated session for the visitor as `demo_alex`.
**Impact:** Classic session fixation when demo mode is on. Any browser that loads a hostile page on the same TLD or an emailed image preview gets a `demo_alex` session attached, and any subsequent legit-looking screenshots, logs, or actions during the judge presentation are attributable to that hijacked session. Combined with [P1] above this is the same backdoor reachable from two angles.
**Fix:** Make scripted login POST + same-origin (mirror `canMutateDemoEndpoint`'s `isSameOrigin` check), add a CSRF/double-submit token, and short-circuit if a real `session.userId` already exists so a judge mid-walkthrough doesn't get silently re-bound.

### [P2] No UI logout — `logoutAction` is orphaned
**Where:** `src/lib/auth.ts:255-260`. No callers anywhere in `src/components/**`, `src/app/**`, or `messages/**` (verified by full grep for `logout`/`signOut`).
**What:** The new working-tree edit to `logoutAction` (locale-aware redirect) is fine code, but the action is unreachable from the UI. Sessions end only by 30-day `maxAge` or DB-side `bannedAt`/`updatedAt` divergence.
**Impact:** Users on shared/kiosk machines have no way to terminate their session; admins/judges can't sign out between scripted demo and a live test as themselves. Not exploitable, but raises the blast radius of [P1] (scripted demo) — once you're stuck as `demo_alex` you can't get out.
**Fix:** Wire a logout form (POST to `logoutAction`) into the desktop sidebar / mobile tab bar profile area.

### [P2] `auth-current-user.ts` `requireUser`/`requireAdmin` helpers have zero callers
**Where:** `src/lib/auth-current-user.ts:59-80`. Confirmed by grep — every page and action still does manual `getCurrentUser() + null check + redirect`.
**What:** The helpers added in commit `5a0afeb` were never adopted. As a result, `requireAdmin` is dead code and **no admin-only route exists** in the codebase (no `requireAdmin` callers means admin gating is purely by `isAdmin` checks scattered through actions; there are none).
**Impact:** Hardening regression — the centralised auth-throw the helper enables is missing, so any new action author can forget the null check. No exploitable bug today, but raises the chance of one.
**Fix:** Either delete the unused `UnauthorizedError` + `requireUser` + `requireAdmin` to keep the surface honest, or migrate at least the route handlers (`/api/events/[eventId]/ics/route.ts:114`, demo routes) onto them.

### [P2] Page-level auth on `/leaderboard` is missing
**Where:** `src/app/[locale]/leaderboard/page.tsx:90-97` and `src/lib/leaderboard.ts:83-87`.
**What:** `LeaderboardPage` calls `getLeaderboardAction({scope:"all"})` which returns `{ rows, viewer: null }` for unauth callers (the action does not gate on `getCurrentUser`). The page renders the full top-25 list with usernames + points to anyone, no `redirect("/login")`. Every other authed page (`/today`, `/groups`, `/notifications`, `/settings`, `/u/[username]`) does redirect on null user.
**Impact:** Public enumeration of all seeded/real usernames, points, week-streak, and attended-event counts via `GET /<locale>/leaderboard`. AGENTS.md UX rules say "First authed screen is `/today`"; spec `06-ui-flows.md:59` lists `/leaderboard` as an authed surface.
**Fix:** Either explicitly mark leaderboard public in the spec and strip usernames to first-name-only, or add the same `if (!user) redirect("/login")` guard the rest of the authed pages use.

### [P2] `DEV_SESSION_SECRET` is a known constant — protected only by `NODE_ENV` string match
**Where:** `src/lib/session.ts:17-26`.
**What:** `DEV_SESSION_SECRET = "dev-only-showup2move-session-secret-64-characters-minimum-value"` is committed and used whenever `process.env.NODE_ENV !== "production"`. The check is a literal string compare against `"production"`. If a deploy ever boots with `NODE_ENV=staging`, `NODE_ENV=preview`, missing, or accidentally `Production` (case-mismatch — `getServerEnv` validates strict lowercase, so this throws, but only if `getServerEnv()` is reached; `getSessionOptions` calls `getServerEnv` first so OK there), it falls back to the published constant and an attacker who reads the repo can forge any session cookie.
**Impact:** With the published seal-secret an attacker can construct a valid `iron-session` cookie for any `userId` and bypass auth entirely. Today only triggers on misconfig, but the `Dockerfile` hardcodes `ENV NODE_ENV=production` and `railway.toml` doesn't override it, so risk is contained — flagging as P2 hardening.
**Fix:** Remove the dev fallback; require `SESSION_SECRET` always, even in dev. Devs can `openssl rand -hex 32 > .env.local`. The .env.example already explains this.

### [P2] `DEMO_RECOVERY_CODE` violates `recoveryCodeSchema` — seed will throw at runtime
**Where:** `scripts/seed-demo.ts:20` (`DEMO_RECOVERY_CODE = "DEMO-RECOV-2026"`) called from `scripts/seed-demo.ts:181` → `src/lib/auth-crypto.ts:23` → `src/lib/recovery.ts:21` (`recoveryCodeSchema.parse`).
**What:** `recoveryCodeSchema = /^SM2M-[A-Z0-9]{4}-[A-Z0-9]{4}$/`. The literal `"DEMO-RECOV-2026"` (i) doesn't start with `SM2M-`, (ii) middle segment is 5 chars not 4, (iii) trailing `2026` is 4 chars but the segment-count is wrong. `parse` throws → `hashRecoveryCode` rejects → `seedDemo()` aborts before user inserts. `ensureDemoSeeded` will refire on every page load that needs the demo run.
**Impact:** Demo seed silently broken; every demo entrypoint (`/[locale]/demo`, `/[locale]/demo/scripted`, `ensureDemoSeeded` calls in walkthrough routes) errors at the same point. **Side-effect:** [P1] scripted-login becomes a no-op (returns `false`) because `demo_alex` doesn't exist, which masks the session-fixation backdoor — but only because the seed is broken. Fix the seed and the [P1] backdoor reactivates.
**Fix:** Generate a real recovery code via `generateRecoveryCode()` at seed time (or hard-code one matching the regex, e.g. `"SM2M-DEMO-2026"`).

### [P2] No password-strength check beyond min 8 chars
**Where:** `src/lib/contracts/auth.ts:10-14`.
**What:** `passwordSchema` only enforces 8-128 chars and non-whitespace. `Showup2move!` (the seed password) and `12345678` both pass. No common-password list, no entropy check, no breach lookup.
**Impact:** Combined with the rate-limit bypass [P1], 10/15min/username is the only ceiling on credential-stuffing the most-common 8-char passwords. Not exploitable on its own; hardening gap.
**Fix:** Either accept the trade-off explicitly in spec, or add a tiny `top-1000-passwords` deny-list at signup/recovery.

### [P3] `proxy.ts` port-strip preserves the host when `Location` is absolute
**Where:** `src/proxy.ts:11-31`.
**What:** `stripInternalPort` calls `new URL(location, request.nextUrl)`, checks `url.port === internalPort`, and rewrites `location` to `url.toString()`. If next-intl ever produces a redirect Location pointing at an attacker-controlled absolute URL with port `3000` (e.g. `https://evil.example:3000/foo`), the proxy strips the port and writes back `https://evil.example/foo`. next-intl is the source of truth for these Locations and only emits same-host paths today, so this isn't reachable, but the function trusts whatever next-intl gives it without an origin allow-list.
**Impact:** Theoretical open-redirect amplifier. Not exploitable today.
**Fix:** Before rewriting, assert `url.host === request.nextUrl.host` (or `url.host === request.headers.get("x-forwarded-host")`).

### [P3] Username enumeration on signup
**Where:** `src/lib/auth.ts:144-145` (signup) and the message `username_taken` rendered by `src/components/auth/SignupForm.tsx:47`.
**What:** Signup returns a distinct `username_taken` error vs. generic `validation` error, letting an unauth attacker probe whether a username exists. `loginAction` and `recoverAccountAction` correctly return generic errors (good), but signup leaks.
**Impact:** Mass username enumeration, especially valuable combined with the [P1] seeded-creds finding (probe for `demo_*` accounts).
**Fix:** Either accept (signup needs the feedback for UX) or delay the `username_taken` response with a constant timing budget and the same rate-limit bucket.

### [P3] `userUpdatedAt` mismatch silently destroys all other sessions
**Where:** `src/lib/auth-current-user.ts:44-47` and `src/lib/onboarding-state.ts:53-56`.
**What:** Any settings/profile mutation bumps `users.updatedAt`; every other tab/device for the same user fails the strict ISO-string equality and gets `clearSession()`'d on its next request. There is no UI feedback — the user is just unceremoniously bounced to `/login` next click.
**Impact:** Self-DOS / bad UX. Not exploitable from the outside, but a captain editing settings on phone will log themselves out of their laptop mid-event.
**Fix:** Switch the gate from strict equality to "session.userUpdatedAt is older than `users.updatedAt` by more than X seconds" or, better, only refresh the cached username/locale without destroying the session.

## Diff-specific notes (working tree)

- `src/lib/auth.ts` (modified) — only change is `logoutAction` now reads `session.locale` before `clearSession()` and redirects to `/${locale}` instead of `/`. Read order is correct (get-then-clear; iron-session `destroy()` is sync and returns `void` so no missing `await`). Locale fallback is a safe ternary. **However**, the action remains unreachable from the UI (see [P2] orphan-logout). This commit fixes a bug nobody is hitting.
- No other auth-layer files in working tree changes affect security (`src/i18n/routing.ts`, locale-leak fixes elsewhere, demo step route additions). The new `src/app/[locale]/demo/step/[step]/route.ts` is read-only and reuses `getSession()` correctly with a 404 on demo-disabled and a `/login` redirect on no session.

## Last-100-commits notes

- **Pattern: rate-limit-as-an-afterthought** — `auth-rate-limit.ts` got `chatUserGroup`, `chatUserEvent`, `inviteUserEvent`, `invitePreviewIp` added across 4 different commits (`2f79714`, `6eaf47f`, `4aa920f`). Same recordAuthFailure plumbing reused, but the underlying IP-spoof problem ([P1]) is silently inherited every time a new bucket lands. Every future feature with an IP throttle is broken in the same way.
- **`b3c6645` (bcrypt cost 10 → 12) + dummy hashes refresh** — done correctly. Both `DUMMY_PASSWORD_HASH` and `DUMMY_RECOVERY_HASH` are at cost 12 so timing parity with real verifies is preserved. The dummy recovery hash is documented as verifying against `"SM2M-DUMY-CODE"`, which is a valid `recoveryCodeSchema` value (4-4 segments) — confirmed.
- **`5714172` (gate recover step 2 on verified identity)** — the gate is purely client-side in `RecoverForm.tsx:107-114` and the code's own comment says "this is a UX gate, not a security boundary." Server-side verification in `recoverAccountAction` (auth.ts:192-221) is correct and timing-safe (DUMMY_RECOVERY_HASH path on missing user). The fix is real and the security boundary is in the right place. **Verified clean.**
- **`e82ac0d` (redact recovery code placeholder format)** — UI-layer only, removes the `SM2M-XXXX-XXXX` placeholder text that hinted at the format. Defence-in-depth, not a security fix per se. The format is still recoverable from the regex error message and the success-page rendering. **Verified clean for what it is.**
- **`4879a1d` (strip internal port from next-intl redirect)** — see [P3] above; the fix is correct for its intended case (Railway forwarding internal `:3000`) but trusts next-intl's `Location` host without verifying it.
- **`4ae8f16` (require DATABASE_URL, SESSION_SECRET, PUBLIC_BASE_URL in production)** — `src/lib/env.ts:22-47` enforces these via `superRefine` only when `NODE_ENV === "production"`. Good, but see [P2] `DEV_SESSION_SECRET` — the constant fallback in `session.ts` is the actual risk vector and this commit doesn't close it.
- **`5a0afeb` (add `requireUser`/`requireAdmin` helpers)** — added but never adopted (zero callers — see [P2]).
- **`c81a16b` and `8cbf7d5` (DesktopSidebar mounts on 5 authed pages)** — sanity-checked the affected pages: `/today`, `/groups`, `/notifications`, `/settings`, `/u/[username]` all keep their pre-existing auth gates (`getOnboardingUserState` → redirect / `getCurrentUser` → redirect). Layout change did **not** drop any auth checks. **Verified clean.** `/leaderboard` and `/calendar` were also touched but already lacked a redirect (see [P2] leaderboard).
- **`bd2a243` (rebuild auth flow direction B with recovery code reveal)** — `RecoveryCodeReveal.tsx` never logs the code, the gate-to-continue checkbox is purely UX, and the action result returning `{recoveryCode}` over the server-action wire keeps the code in HTTP response payload only (no DB write of the plaintext, no `console.*`). **Verified clean.**

## Verified clean

- bcrypt cost 12 with timing-safe missing-user dummy-hash path on both login (`auth.ts:175-176`) and recovery (`auth.ts:211-212`).
- Recovery code generation uses `node:crypto` `randomInt` against a 32-char Crockford-style alphabet → 32^8 ≈ 1.1×10^12 codes per identity, hashed with bcrypt cost 12, one-time use (replaced with a fresh code on successful recovery — auth.ts:223-244). No plaintext storage, no logging anywhere in `src/`.
- `iron-session` cookie config (`session.ts:28-38`): `httpOnly: true`, `sameSite: "lax"`, `secure: NODE_ENV==="production"`, `maxAge: 30d`, `path: "/"`, fixed `cookieName`. No client-side cookie reads.
- Rate-limit policies (`auth-rate-limit.ts:23-31`) are sane numerically — login 5/15min IP+user, 10/15min user-only; recovery 3/30min; signup 10/hour. Their *bypass* via header spoofing is the [P1].
- Server actions in Next 15 are POST-only with default same-origin enforcement; no `experimental.serverActions.allowedOrigins` widening was added.
- `next.config.ts` security headers: HSTS (preload, includeSubDomains), `frame-ancestors 'none'` + `X-Frame-Options: DENY` (clickjack-safe for auth pages), `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy` with locked `connect-src` allowlist, `X-Content-Type-Options: nosniff`, `Permissions-Policy` lockdown. CSP keeps `'unsafe-inline'` + `'unsafe-eval'` in `script-src` (Next default for inline runtime), which is acceptable for hackathon scope.
- `nextPostLoginPath` (`auth-form-actions.ts:24-39`) only constructs `/${locale}/...` paths from server-side state; no `?next=` parameter, so login has no open-redirect surface.
- ICS calendar route `/api/events/[eventId]/ics/route.ts:114-131` enforces `getCurrentUser` + event-attendee ownership before exposing the file.
- Settings actions (`settings-actions.ts:42-145`) consistently re-check `getCurrentUser` / `session.userId` before each mutation and re-save the session with bumped `userUpdatedAt` on profile-visibility changes.
- `hashRateLimitParts` (`auth-rate-limit.ts:37-45`) uses sha256 with a `\0` separator before truncation, so part-collision attacks (e.g. `("ab","c")` vs `("a","bc")`) are not possible.
- No `console.log` of recovery codes, password hashes, or session payloads in `src/lib/auth.ts`, `auth-crypto.ts`, `recovery.ts`, or `session.ts`.
- Recovery code one-time use confirmed: `recoverAccountAction` always generates a fresh code and updates `recoveryCodeHash` in the same transaction (auth.ts:223-244); old code is unrecoverable after success.
- Recovery flow correctly returns generic `invalid_recovery` whether username exists or not (auth.ts:214-220), so it's not enumerable through the recovery endpoint (signup endpoint still is — [P3]).
