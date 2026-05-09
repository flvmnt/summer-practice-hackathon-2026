# Visual QA — Wave 3 audit (A16)

| Field | Value |
| --- | --- |
| Date | 2026-05-09 |
| Build commit | `3b2c8a6d952b60cdb3c9a3e08fe4ede3c192e286` |
| Branch | `main` (20 commits ahead of origin) |
| `pnpm typecheck` | **pass** |
| `pnpm lint` | **fail** — 1 error in `src/app/[locale]/events/page.tsx:85` (`Date.now` impurity from a *different* agent's commit, see F-006) |
| `pnpm test` | **pass** — 91/91 |
| `pnpm build` | **pass** |
| `pnpm start` (standalone) | **pass** with `SESSION_SECRET`, `DATABASE_URL`, `PUBLIC_BASE_URL` set; routes that read DB still 500 because the dummy URL is unreachable, see F-001 |
| Screenshots captured | **88** PNGs (22 routes × 4 viewports) |
| Lighthouse runs | 4 (`/en` mobile/desktop, `/en/login` mobile/desktop) |

The mode of audit is **report only** — A16 did not edit any source file in `src/`. Two adjacent agents already shipped fixes for several of the items I started flagging (commit `480dcb2 fix: self-host fonts and repair mobile tabs` landed mid-run); those items now show as resolved below.

---

## Verification environment

The repo's `pnpm start` script chains `scripts/prepare-standalone.mjs` then `node .next/standalone/server.js`. To screenshot authed pages we need a real Postgres + a 64-char `SESSION_SECRET` + `PUBLIC_BASE_URL`. None of these are present in `.env.local`, so this audit ran prod with:

```sh
SESSION_SECRET="dev-only-…-test"  # 64+ chars
DATABASE_URL=postgres://x:x@127.0.0.1:5432/x   # unreachable, intentional
PUBLIC_BASE_URL=http://localhost:3100
NODE_ENV=production
PORT=3100
```

That means **any route that hits the DB returns 500** on this run. Those 500s are not visual bugs — they're an audit-environment limitation. They are still listed below because in CI/Railway demos they will surface unless the seeded demo DB and env are in place.

---

## Lighthouse

`/en` (landing) and `/en/login` were the only routes that fully render without a session.

| Page | Form factor | Perf | A11y | Best Pr. | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/en` | desktop | **100** | 95 | 96 | **100** | 0.8 s | 0 | 0 ms |
| `/en` | mobile | **87** ⚠ | 95 | 96 | **100** | **4.1 s** ⚠ | 0 | 10 ms |
| `/en/login` | desktop | **100** | 96 | 96 | **100** | 0.8 s | 0 | 0 ms |
| `/en/login` | mobile | **88** ⚠ | 96 | 96 | **100** | **3.9 s** ⚠ | 0 | 0 ms |

Spec target: **95+ desktop / 90+ mobile** (`docs/specs/00-overview.md`). Desktop hits the bar; **mobile misses by 2–3 points purely on LCP**. Lighthouse flagged a render-blocking insight worth ~80 ms savings; the rest of the LCP comes from the throttled-mobile cold-start chunk download — `/today` (the spec's authed Lighthouse target) was not measured because there's no seeded demo session in this audit.

Reports + JSON are saved at `_review/lighthouse/{landing,login}-{mobile,desktop}.report.{html,json}`.

---

## Screenshot index

All screenshots are at `_review/screenshots/{slug}-{viewport}.png` (4 viewports each: 360w, 390w, 768w, 1440w). HTTP status, console errors, and pageerrors are recorded in `_review/screenshots/index.json`.

| Slug | Path | 360w status | Visible content |
| --- | --- | --- | --- |
| `landing-en` | `/en` | 200 | landing hero + Why + How (full render) |
| `landing-ro` | `/ro` | 200 | RO landing — i18n flips to Romanian copy |
| `signup` | `/en/signup` | 200 | recovery-code intro card, no recovery code reveal screen reachable without DB |
| `login` | `/en/login` | 200 | login card |
| `recover` | `/en/recover` | 200 | three-step recovery wizard |
| `onboarding-profile` | `/en/onboarding/profile` | 200 | redirects to `/en/login` (no session) |
| `onboarding-sports` | `/en/onboarding/sports` | 200 | redirects to `/en/login` |
| `onboarding-location` | `/en/onboarding/location` | 200 | redirects to `/en/login` |
| `onboarding-photo` | `/en/onboarding/photo` | 200 | redirects to `/en/login` |
| `today` | `/en/today` | 200 | redirects to `/en/login` (auth wall) |
| `groups` | `/en/groups` | 200 | redirects to `/en/login` |
| `groups-detail` | `/en/groups/seed-id` | 200 | redirects to `/en/login` |
| `events` | `/en/events` | 200 | redirects to `/en/login` |
| `events-new` | `/en/events/new` | 200 | redirects to `/en/login` |
| `events-detail` | `/en/events/seed-id` | 200 | redirects to `/en/login` |
| `notifications` | `/en/notifications` | 200 | redirects to `/en/login` |
| `map` | `/en/map` | 200 | public map fallback (no GL token, expected) |
| `demo` | `/en/demo` | **404** | gated by `ALLOW_DEMO_MODE` (off, expected) |
| `settings` | `/en/settings` | 200 | redirects to `/en/login` |
| `u-username` | `/en/u/seed` | **500** | `getDb()` throws on lookup (no DB) |
| `leaderboard` | `/en/leaderboard` | **500** | `lib/leaderboard.ts` queries DB |
| `calendar` | `/en/calendar` | 200 | redirects to `/en/login` (auth required after wave-3 wiring) |

Notes:

- `groups-detail`, `events-detail`, `u-username` use synthetic seed ids — without a seeded DB they redirect to login or 500. Real screenshots for these need either a seeded Postgres or a Playwright test that signs up + drives the flow first.
- `today` in 3 states (prompt / queued / found) **was not captured** for the same reason — the page enforces auth at the route level. The previous wave's Today component does have all 3 states implemented (see `src/components/today/Today{Prompt,Queued,Found,Searching,SaidNo,Confirmed}*.tsx`), but capturing them needs a seed user with a matching session.

---

## Findings

Severity legend: 🔴 Blocker · 🟡 Risk · 🟢 Polish.

### 🔴 Blockers

#### F-001 — Most authed routes 500 if `SESSION_SECRET` / `DATABASE_URL` / `PUBLIC_BASE_URL` are missing

- Routes: every page that calls `getSession()` or `getDb()`. In practice that's all of `/today`, `/groups*`, `/events*`, `/notifications`, `/settings`, `/u/[username]`, `/leaderboard`, `/calendar`, `/onboarding/*`, plus the landing page (because it eagerly checks for an authed user to redirect to `/today`).
- Repro: `pnpm build && pnpm start` with default `.env.local` (which has only Groq keys) → every route 500s. Server logs show `ZodError: SESSION_SECRET is required in production` and `DATABASE_URL is required in production`.
- Source: `src/lib/session.ts:24-27` and `src/lib/env.ts` `requireProductionDatabase` block.
- Suggested fix: either (a) make the env validator soft-fail with a clear `<ErrorBoundary>`-style page in production when secrets are missing, or (b) document `.env.example` more aggressively and have the Railway start script fail fast with a human-readable message **before** Next boots. The current fail-mode is "every page is `This page couldn't load`" with a Lighthouse-untestable result.

#### F-002 — Standalone server returns `text/plain` and 500 for chunks that don't match its in-memory map after a rebuild

- Repro: build, start standalone, hit a page (works). Build again *without* restarting the server. Static chunks return HTTP 500 with `Content-Type: text/plain`. Chrome console logs `Refused to apply style from … because its MIME type ('text/plain') is not a supported stylesheet MIME type`.
- Why it matters: any redeploy where the new bundle's static dir is copied in *after* the server is already running breaks every page until restart. On Railway this is the failure mode you'd hit on rolling deploys without a restart hook.
- Suggested fix: ensure `scripts/prepare-standalone.mjs` runs before `node server.js` (it does), but **also** confirm the deploy contract restarts the server after a redeploy. Add a startup assertion that walks `.next/standalone/.next/static/chunks` and verifies at least one `.css` exists.
- Evidence: index.json captures from intermediate runs include 500s with `Content-Type: text/plain` in the response headers; reproduced live by curling the CSS chunk URL after a second `pnpm build`.

#### F-003 — `MobileTabBar.tsx` linked to non-existent `/create` and `/profile` routes — **resolved by `480dcb2`**

- Was: tabs at `id: "create"` and `id: "profile"` pointed at `/create` and `/profile`. Neither route exists; clicking either lands on `/en/_not-found`.
- Now: commit `480dcb2 fix: self-host fonts and repair mobile tabs` redirects them to `/events/new` and `/settings`.
- Status: ✅ shipped; included here so the wave-3 punch list reads honest end-to-end.
- Lingering risk: tab `href`s are still locale-less (`/events/new` not `/${locale}/events/new`). `MobileTabBar` is a client component and `usePathname()` strips the locale to compute `active`; that's fine for `aria-current` but Next's `<Link>` will navigate to `/events/new` and 404 on an `/en` or `/ro` browser unless the i18n proxy intercepts. Worth a smoke test.

#### F-004 — `MobileTabBar` shows on desktop because inline `display: grid` overrides `md:hidden`

- File: `src/components/layout/MobileTabBar.tsx:48-66`.
- Symptom: at 1440 the bottom tab bar is visible, overlapping page content (see `_review/screenshots/leaderboard-1440w.png` from the pre-`480dcb2` capture for reference; note that current 1440w shots show the page-error fallback because of F-001, but the same bar bug renders on `/en/map` at 1440w when DB is up).
- Suggested fix: use `display: ${tablet ? 'none' : 'grid'}` via `useMediaQuery` or change container CSS to `@media (min-width: 768px) { display: none }` instead of `md:hidden`. Tailwind utility classes can't beat an inline `style={{ display: 'grid' }}`.

### 🟡 Risks

#### F-005 — Google Fonts blocked by CSP — **resolved by `480dcb2`**

- Was: `next.config.ts` declares `font-src 'self' data:` and `style-src 'self' 'unsafe-inline'`, but `app/layout.tsx` linked `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque…`. Browsers blocked both the stylesheet (style-src) and the woff2 (font-src). All early screenshots came back in Times Roman fallback.
- Now: layout migrated to `next/font/google` (Bricolage_Grotesque, Inter_Tight, JetBrains_Mono) which self-hosts woff2 and uses `display: swap`. Fonts now load on-spec — verified visually on `/en/login` 360w.
- Status: ✅ shipped.

#### F-006 — `/en/events/page.tsx` calls `Date.now()` in a server component render

- File: `src/app/[locale]/events/page.tsx:85`.
- Lint output: `react-hooks/purity: Cannot call impure function during render`.
- Effect: under React 19's strict idempotency rules this can produce flicker on navigation/tab switching when the row state depends on it. Build still passes (warning, not a build break) but **`pnpm lint` is now red on `main`**.
- Suggested fix: move `Date.now()` to a server-safe `unstable_cache(() => Date.now(), ['events-now'], { revalidate: 60 })` or to an `async` boundary that returns the timestamp, or compute it inside an effect on a sibling client component.

#### F-007 — Recovery wizard shows step 2 content while step 1 is active

- Route: `/en/recover` 360w.
- Symptom: stepper shows "1. IDENTIFY" highlighted but the "2. NEW PASSWORD" section already renders the input field. Reads as if the user can fill out step 2 before step 1 succeeds.
- Suggested fix: in `src/components/auth/RecoverForm.tsx`, gate the step-2 group on a stage state (`stage === "verified"` or similar) instead of always rendering it.

#### F-008 — `/en/map` renders desktop fallback as "This page couldn't load" once the in-memory chunk map drifts

- See F-002. The map page itself is fine on a freshly-restarted prod server (verified at 360w). The 1440w shot in the current set hits the chunk-drift case.
- Suggested fix: same as F-002 plus document the smoke check in `AGENTS.md` Testing & Proof.

#### F-009 — `HeaderBell` is implemented (`src/components/layout/HeaderBell.tsx`) and `AppHeader.tsx` mounts it, but **`AppHeader` is not imported anywhere**

- `grep -r "AppHeader" src/` only finds the definition file. So today the bell only appears as a hand-rolled inline link on `/en/today` (see `src/app/[locale]/today/page.tsx:98-109`) and a content-icon use on `/en/settings`. Nothing on `/groups`, `/groups/[id]`, `/events`, `/events/[id]`, `/map`, `/notifications`, `/settings`, `/u/[username]`, `/leaderboard`, `/calendar`, or `/calendar`.
- Spec ref: A11 noted bell missing on `/groups/[id]`, `/events/[id]`, `/map`. **Actual coverage is even thinner.**
- Suggested fix: drop `<AppHeader locale={locale} unreadCount={unread} />` into the page-level header on each authed route; remove the bespoke today-page bell anchor.

#### F-010 — Sport-filter pills overflow horizontally on `/en/map` 360w

- See `_review/screenshots/map-360w.png`. "Basketball" is half-cut; the row scrolls horizontally but there's no visual scrollbar/affordance.
- Suggested fix: add `mask-image: linear-gradient(90deg, …)` to fade the right edge, or wrap the row in a `<div className="overflow-x-auto" style={{ scrollSnapType: "x mandatory" }}>` with snap.

#### F-011 — Multiple "Directions" CTAs slightly clipped at 360w on `/en/map`

- Right-edge buttons crop ~8 px. Page padding is `px-5` (20 px) on the outer container, but the venue list cards sit on `var(--page-max)` width logic that doesn't shrink. Tighten card padding or use `min-width: 0` on the flex children.

### 🟢 Polish

#### F-012 — Lighthouse mobile LCP at ~4 s on `/en`

- `largest-contentful-paint-element` audit is null in this run (likely the hero text). The 80 ms render-blocking-resources insight is the only concrete savings. Bigger LCP win: preload the variable-weight Bricolage Grotesque subset that backs the hero text (`<link rel="preload" as="font">`). `next/font/google` should handle that automatically — verify by checking the document `<link rel="preload">` set after the F-005 fix.

#### F-013 — Bottom tab bar overlaps the last list row on `/en/calendar` 360w

- Visible in `_review/screenshots/calendar-360w.png` (pre-redirect screenshot from earlier capture) and on `/en/leaderboard` 360w. Pages need `padding-bottom: calc(78px + env(safe-area-inset-bottom) + 16px)` (current is `calc(78px + …)` which is exactly the bar height — a card edge will sit *under* the bar). Add a 16-pixel gutter on every page that mounts `MobileTabBar`.

#### F-014 — `/en/leaderboard` shows "Stub data · TODO" pill

- That's intentional per a code-comment TODO in `src/app/[locale]/leaderboard/page.tsx:13`, and now leaderboard is wired to a real-data fetch (see `src/lib/leaderboard.ts`). Either drop the pill or hide it behind a build flag — for the hackathon judge demo it currently reads "we never actually built this".

#### F-015 — `/en/recover` displays the recovery placeholder `SM2M-ABCD-1234`

- Cosmetic but it leaks the format. Switch to e.g. `XXXX-XXXX-XXXX`. File: `src/components/auth/RecoverForm.tsx`.

#### F-016 — `<favicon.ico>` 404 on every page

- `errors-in-console` Lighthouse audit. Add a `public/favicon.ico` (or `app/icon.png`) — even a 1×1 transparent PNG drops the count.

---

## Spec compliance checklist

| Spec item | Status |
| --- | --- |
| 5-tab MobileTabBar mounted on `/today`, `/groups`, `/groups/[id]`, `/events`, `/events/[id]`, `/map`, `/notifications`, `/settings`, `/u/[username]`, `/leaderboard`, `/calendar` | ✅ mounted on `/today, /groups, /events, /events/new, /notifications, /map [via separate header], /settings, /u/[username], /leaderboard, /calendar`. **Missing on `/groups/[id]` and `/events/[id]`** (verified by grep). |
| HeaderBell on `/today, /groups/[id], /events/[id], /map` | 🔴 see F-009 — bell only present on `/today` (hand-rolled) and as a content icon on `/settings`. |
| Type stack: Bricolage Grotesque, Inter Tight, JetBrains Mono actually loading | ✅ post-`480dcb2`. Verified visually. |
| AI mark = chevron-burst, not sparkle | ✅ `src/components/ui/AIMark.tsx` renders the global `.ai-mark` (chevron via `::before/::after`). No `Sparkles` glyph or `lucide-react` star icon used. |
| Empty states have a primary action | ✅ where checked: `/en/calendar` empty state offers "Open Today" via `EmptyState` `action.label`. Other authed empty states unverifiable without seeded data. |
| 360 px no horizontal scroll | ✅ landing, signup, login, recover, map (with the F-010 affordance gap). |
| 44 px touch targets | ✅ on inputs, primary CTAs, tabbar items (each 44×44 minimum per `MobileTabBar` inline style). |
| Recovery code reveal after `/en/signup` submit | 🟡 component exists at `src/components/auth/RecoveryCodeReveal.tsx` with copy/download/I-saved-it gate, but flow not exercised in this audit (signup needs DB). |
| Today funnel "searching" animation | 🟡 component exists at `src/components/today/TodaySearching.tsx`. Not captured. |
| Captain reveal auto-opens for captain on `/events/[id]` | 🟡 not captured (auth wall). |
| `/en` ↔ `/ro` strings flip on landing | ✅ `_review/screenshots/landing-{en,ro}-360w.png` confirm Romanian copy. |
| Direction-B brand consistency (no leaked legacy lime/coral/blue) | ✅ resolved colors are sodium-orange `#FF5C2A`, deep-orange `#E84A1B`, pitch-green `#1E6E48`. The legacy `--lime / --coral / --court / --mint / --cloud / --navy` variables are aliased in `globals.css` to the new tokens; no rendered surface shows green-yellow lime or coral. |
| Demo route gated when `ALLOW_DEMO_MODE=false` | ✅ `/en/demo` 404s — confirmed. |

---

## How to re-run this audit

1. Set `SESSION_SECRET` (≥64 chars), `DATABASE_URL` (real seeded Postgres if you want authed pages), `PUBLIC_BASE_URL`.
2. `pnpm build && pnpm start`.
3. `pnpm exec playwright test --config=scripts/visual-qa/playwright.visual.config.ts --reporter=list` (or `node scripts/visual-qa/run.mjs`).
4. Optional: `npx --yes lighthouse http://127.0.0.1:3100/en --preset=desktop --output=html --output-path=_review/lighthouse/landing-desktop`.

The harness lives at `e2e/visual.spec.ts` and writes to `_review/screenshots/index.json`. Filter routes/viewports with `VISUAL_ROUTES=login,signup` and `VISUAL_VIEWPORTS=360w,1440w` env vars.
