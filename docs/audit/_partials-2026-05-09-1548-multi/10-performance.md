# Performance, Bundle, Runtime Cost - 2026-05-09 15:48

## TL;DR

**Lighthouse 95+ on mobile is at risk.** Predicting from code only, the project ships **~456KB JS in the per-page common bundle** (5 root chunks, gzipped ~140-160KB), self-hosts **16 woff2 files (~380KB total, ~237KB auto-preloaded by 6 `<link rel="preload">` tags on every page**), and the `[locale]/layout.tsx` `NextIntlClientProvider` serializes the **full ~50KB common.json** into the RSC payload of every authed render. The single biggest perf win available before judging is the i18n payload + font weight pruning - both are pure-config changes worth multiple Lighthouse points and zero design risk.

The map page also lazy-loads MapLibre **correctly** - the 1MB `0hnxpsgzhcf5a.js` chunk is gated behind `next/dynamic({ ssr: false })` (`MapView.tsx:15-18`) so it only hits `/map` users, not the whole site. That part of the prior wave landed clean.

The DesktopSidebar from commit `8cbf7d5/c81a16b` is **not** a Lighthouse-blocking weight (~7KB pre-min, no heavy deps), but it's mounted **per-page in 9 server components instead of in the locale layout**, which forces a re-render and re-hydration of the full sidebar tree on every authed navigation. Cheap to fix, real INP/TBT win.

The biggest server-side waterfall is on `/events/[eventId]` - **5 sequential awaits** (event → unread → group → weather → captain brief) where 3 of the 4 last calls have no data dependency on each other. TTFB on a cold event page likely runs 800-1400ms when 250-450ms is achievable.

The "self-host fonts" claim from commit `480dcb2` is misleading: the fonts come from **`next/font/google`** (`src/app/layout.tsx:2`), which auto-self-hosts but ships every weight × subset combination requested. With `latin + latin-ext` × 3+4+3 weights, that's the 16-file fanout above.

Memory note: user's hard convention is **95+ on both mobile AND desktop**. Prior audit was 87/88 on mobile. The findings below, applied as written, should reclaim the missing 7-10 points.

---

## P0 - visible jank (none currently confirmed)

No P0 findings. The map shimmer pattern (`MapView.tsx:25-43`) shows a skeleton during the maplibre-gl chunk load and there's an additional inner blocker (`MapInner.tsx:142-149`) until tiles paint - so users do not see a flash of empty `<div>`. Geolocation is deferred to a microtask (`MapPageClient.tsx:94-99`) so the prompt does not race the first paint.

---

## P1 - Lighthouse-blocking (LCP / CLS / INP / TBT)

### P1-1. NextIntlClientProvider ships entire 50KB common.json on every authed render

`src/app/[locale]/layout.tsx:33-37` mounts `<NextIntlClientProvider>` with no `messages` prop. In next-intl v4 client provider, that means the full message dictionary loaded by `src/i18n/request.ts:13` (`messages/en/common.json`, currently **50,458 bytes raw / ~9-11KB gzipped**) is serialized into the **RSC payload of every page**. The RSC payload is downloaded eagerly during navigation and counted by Lighthouse against `Reduce unused JavaScript`.

Reproduce by inspecting the `_next/data/.../page.json` for any authed route - you will see the entire dictionary inlined. Almost every page only reads a single namespace (e.g., `today`, `group`, `event`).

Fix: pass `messages={pick(messages, ["common", "<routeNamespace>"])}` from each route segment, or move the provider to a smaller per-route boundary, or split `common.json` into per-namespace files and only ship the relevant one. Easiest one-line tactical win: `<NextIntlClientProvider messages={undefined}>` and convert all client `useTranslations` call sites that currently rely on the provider's hydrated dictionary to receive copy as props (the codebase already uses this pattern in `MapPageClient`, `GroupChatForm`, `EventScreen`, etc., so it's stylistically consistent).

Estimated savings: 35-45KB gzipped per navigation, ~3-5 Lighthouse points on mobile slow-3G profile.

### P1-2. Six font files auto-preloaded (~237KB) on every page

`src/app/layout.tsx:6-25` declares **3 font families × 3-4 weights × 2 subsets (`latin`, `latin-ext`)** via `next/font/google`. Build output confirms 16 woff2 files in `.next/static/media/` totaling 380KB, of which **6 files are tagged `*-s.p.*.woff2` (preloaded with `<link rel="preload" as="font" crossorigin>`** on every HTML response). Sizes:

```
89,820  b8d1f0a88dfecec3-s.p.*.woff2  (likely Bricolage display, latin-ext)
44,916  ab57efd000576a30-s.p.*.woff2
41,236  017d9bea37084d9b-s.p.*.woff2
31,340  051742360c26797e-s.p.*.woff2
18,740  26daee0352f50a5f-s.p.*.woff2
11,596  6a5386fd6038edbe-s.p.*.woff2
237,648 bytes preloaded eagerly per page load
```

Drop `subsets: ["latin", "latin-ext"]` to `["latin"]` for English-only routing (which is the spec target per AGENTS.md and commit `f471fb3`'s original intent), and prune weights to what's actually painted above the fold:

- `Bricolage_Grotesque`: keep `["700"]` only (the only weight referenced in `globals.css:194-199` `.display`). `500` and `600` are never used.
- `Inter_Tight`: keep `["400", "600"]`. `500` and `700` are not bound to any actual text on /today, /groups, /map (verify by `grep -rn "fontWeight" src/`).
- `JetBrains_Mono`: keep `["500"]` only. Used for stat chips and time labels.

Estimated savings: drops preload from 6 files to 3, total bytes ~70-90KB (after gzip ~50-60KB). Worth ~3-4 Lighthouse points on mobile (`Preload key requests` + `Avoid enormous network payloads`).

### P1-3. /events/[eventId] has 4 sequential awaits in cold-render path

`src/app/[locale]/events/[eventId]/page.tsx`:

- line 39: `await getEventAction(...)`
- line 47: `await unreadCount(currentUserId)` - depends only on `currentUserId` from event result
- line 51: `await getGroupAction(...)` - depends only on `event.groupId` from event result
- line 59-65: `await getOpenMeteoForecast(...)` - external HTTP, depends only on `recommended` venue
- line 96-104: `await generateCaptainBrief(...)` - depends only on `groupSize`, `event.sport`, `weather`, `venueCandidates`

Once `getEventAction` resolves, **all four follow-ups are independent and should run inside `Promise.all`**. Open-Meteo alone is a ~250-400ms cross-region HTTP, and `generateCaptainBrief` calls Groq when not cached (`src/lib/ai/captain-brief.ts`), which is another 400-1500ms. Today: total = sum. After: total = max.

Predicted TTFB before: 1.0-1.7s. After: 0.4-0.7s.

### P1-4. /today and /groups/[groupId] also waterfall (smaller, but present)

- `src/app/[locale]/today/page.tsx:48`: `await getMyTodayStateAction()` then `:52` `await unreadCount(user.id)` - parallelize.
- `src/app/[locale]/groups/[groupId]/page.tsx:49`: `await getGroupAction(...)` then `:73` `await unreadCount(...)` - parallelize.

Smaller wins (~80-150ms each) but free.

### P1-5. DesktopSidebar mounted per-page (re-mounts on every navigation)

`DesktopSidebar` is mounted directly in 9 server pages (`today`, `groups`, `groups/[groupId]`, `events`, `notifications`, `settings`, `calendar`, `leaderboard`, `u/[username]` plus `MapPageClient.tsx:184`). It is a `"use client"` component (`DesktopSidebar.tsx:1`) so each page boundary is a separate React tree subscription. On client-side navigation between authed routes, the sidebar **unmounts and remounts**, re-running `usePathname()`, `useTranslations()`, and the brand block.

Hoist into a single `src/app/[locale]/(authed)/layout.tsx` (or similar route group) so the sidebar stays mounted across navigations. This eliminates ~150-300 wasted React reconciliations per session and improves INP for "open group → switch to chat → back to today" loops, which is the demo path.

### P1-6. force-dynamic on every page disables route segment caching

`grep -rln "force-dynamic" src/app | wc -l` = **26**. Every page including the public `/[locale]/page.tsx` landing is forced dynamic. The landing has no per-user state past the early `redirect()` for authed users (`page.tsx:37-40`) and could be cached at the edge. Same for `/i/[token]` invite previews (cacheable per-token), `/u/[username]` (cacheable per-username with on-mutation revalidation).

Removing `force-dynamic` and switching to `revalidate = 60` for those would let the router serve from cache on subsequent visits and dramatically improve repeat-visit LCP for the landing.

---

## P2 - bytes savings

### P2-1. Avatar uses raw `<img>` instead of `next/image`

`src/components/ui/Avatar.tsx:42-48` ships a `// eslint-disable-next-line @next/next/no-img-element` raw img tag. Used in `GroupMembersList.tsx:94`, `CaptainBriefPanel.tsx:142`, and `PublicProfileCard.tsx:62` (the 96px hero avatar on `/u/[username]`). For the 96px case, `next/image` would serve a webp/avif resized 96px source instead of the full R2 webp (which the upload pipeline writes at 512px+). Also no CLS guarantee.

`next.config.ts` is **missing `images.remotePatterns`** entirely, so even if Avatar switched to `next/image`, R2 hostnames would be rejected by the optimizer. Add:

```ts
images: { remotePatterns: [{ protocol: "https", hostname: "*.r2.cloudflarestorage.com" }, { protocol: "https", hostname: "*.r2.dev" }] }
```

Then convert Avatar to `next/image` with `sizes="96px"` for the public-profile case. Estimated payload drop: 60-200KB per profile pageview depending on photo source.

### P2-2. Three icon libraries shipped (lucide-react + react-icons + custom SVG glyphs)

- `lucide-react` (~package.json:35): used in 11 files, named imports - tree-shakes per icon (good).
- `react-icons` (package.json:42): used **only in `SportsForm.tsx:12-20`** for 7 sport icons. Pulls from `react-icons/md` and `react-icons/fa6` - tree-shakes per icon, but the package itself adds resolver weight to the bundle.
- Custom `Glyph` component (`src/components/ui/Glyph.tsx`) - inline SVG, 0 runtime cost.

The 7 sport icons in `SportsForm.tsx` could be moved into the existing `Glyph` registry (already has `football`, `basketball`, `tennis`, `volleyball`, `running` - just missing `table_tennis`, `padel/handball`). Then `react-icons` can be dropped from `package.json` entirely. Net savings: ~3-5KB on the onboarding/sports route, removes a dep from `node_modules`.

### P2-3. Many "use client" components could be server (the FormationTimeline pattern)

Examples that are `"use client"` purely for one `useState` toggle that could be a native `<details>` element:

- `src/components/group/FormationTimeline.tsx:1` - 353 lines, only state is `open` toggle (line 48). Replace with `<details><summary>`. Sends ~6KB less JS to the client per group page.
- `src/components/today/TodayConfirmedCard.tsx:1`, `TodayFoundCard.tsx:1`, `TodaySaidNoCard.tsx:1` - cards that are decorative + display-only. Audit each for whether the `"use client"` is load-bearing.

Not a deal-breaker, but the per-page hydration cost adds up. ~15-25KB total reachable.

### P2-4. Locale routing regressed back to ["ro", "en"] - silently undoes commit f471fb3

`src/i18n/routing.ts:4-5` is currently:

```ts
locales: ["ro", "en"],
defaultLocale: "ro",
```

Commit `f471fb3` (`chore(i18n): drop Romanian from served locales`) explicitly set this to `["en"]` only. Commit `250d822` (`fix(i18n): close locale leaks across core flows`) **silently re-introduced RO** in the locale list as part of an unrelated 14-file translation sweep.

Impact: `generateStaticParams` (`[locale]/layout.tsx:10-12`) now generates both RO and EN segments at build time, doubling per-locale build artifacts and route maps. The middleware still matches RO URLs. RO message file (53KB) is loaded into the request config for any RO request.

If RO is intentionally back, accept the bundle cost. If RO was meant to stay dropped, revert routing.ts to `["en"]` and `defaultLocale: "en"` - this drops one locale's worth of static params, the RO message bundle, and the RO branches that next-intl middleware emits. ~20-30KB build output reduction and faster cold compile.

### P2-5. CSS bundle is 70KB (2 critical files)

`.next/static/chunks/0u-57nno0ibv9.css` = 69KB and `13aex8ns82nqb.css` = 53KB. Tailwind v4 generates utility classes per used token; the dual-direction theme system in `globals.css` (`[data-brand="A"]`, `[data-brand="B"]`, `[data-brand="C"]` blocks at lines 90-143) ships variants for all three brands even though `layout.tsx:52` only ever sets `data-brand="B"`. Remove the unused brand A and C blocks (lines 90-143, ~50 lines of CSS variables) until a brand switcher actually exists. Saves ~3-5KB CSS gzipped.

### P2-6. messages/ro/common.json (53KB) is shipped despite RO being intended-dead

Per `f471fb3` commit message, `messages/ro/common.json` was supposed to be deleted in a follow-up. It still exists at 53,758 bytes. Even if RO routing stays (P2-4), if the RO file diverges from EN it can ship to clients on RO routes. Either delete or pin to ≤ EN size.

---

## P3 - micro-opt

### P3-1. console.warn in upload hot path

`src/lib/upload-actions.ts:144` - `console.warn(...)` fires when R2 delete-on-replace fails. Routed through Railway log pipeline, costs nothing for normal uploads, but during demo if R2 is misconfigured this log line floods. Wrap in `if (process.env.NODE_ENV !== "production")` or use a structured logger that's no-op in prod.

### P3-2. setRequestLocale called twice per request on /events/[eventId]

`page.tsx:37` calls `setRequestLocale(locale)` and `EventScreen` (client component) likely re-resolves via `useLocale()`. Cosmetic - no real cost.

### P3-3. Postgres `prepare: false` on the connection

`src/db/index.ts:22` - `postgres({ DATABASE_URL, max: 10, prepare: false })`. `prepare: false` disables prepared statements, which is correct for pgBouncer / Railway's transaction-mode pooler. Pool size 10 is fine for hackathon load. No action.

### P3-4. SetupBanner always rendered (never dismissible)

`src/app/[locale]/today/page.tsx:60` - `const showSetup = true;` is hardcoded. The component file (`src/components/onboarding/SetupBanner.tsx`) is loaded on every /today render. Tiny cost (~2KB), but worth a TODO to wire up dismissal so it eventually goes away on the demo path.

### P3-5. Walkthrough cookie read on every layout render

`src/app/[locale]/layout.tsx:29-30` - `cookies().get(WALKTHROUGH_COOKIE)` is read on every locale-prefixed render. The walkthrough is demo-only; gate behind `if (process.env.NODE_ENV !== "production" || isDemoModeEnabled())` to skip the cookie read in real production traffic.

---

## What's NOT a problem (audited and clean)

- **MapLibre lazy-load is correct.** `MapInner.tsx:74` imports `maplibre-gl` inside an effect. The 1MB chunk (`0hnxpsgzhcf5a.js`) lives behind `dynamic({ ssr: false })` in `MapView.tsx:15-18` and only loads on /map. Good.
- **No unnecessary `"use client"` page directives.** All 23 `page.tsx` files are server components. Confirmed via `find ... -exec grep -l '^"use client"' {}`.
- **No PWA / service worker drift.** No `sw.js`, no `manifest.json`, no Workbox - matches user memory `feedback_form_factor.md` "explicitly NOT PWA-first".
- **No `lodash`, `moment`, or full `date-fns` import.** None found in `package.json` or src/.
- **No `console.log` in server component hot path.** Only `console.error` in `error.tsx` boundaries (correct, only fires on actual error) and one `console.warn` in upload error branch (P3-1).
- **`/api/health` correctly sets `Cache-Control: no-store`** (`src/app/api/health/route.ts:13`).
- **`loading.tsx` and `error.tsx` boundaries exist** for all 7 first-class authed routes (today, groups, groups/[groupId], events, map, settings, notifications). Streaming TTFB benefit is preserved. This was an open finding in the prior audit; now closed.
- **DB pool reused via singleton** (`src/db/index.ts:7-31`). No per-request connection churn.
- **No `images.remotePatterns` is missing only because no R2 photo URLs are surfaced via `next/image` yet** - once Avatar is migrated (P2-1), the config gap becomes a P2 blocker; today it's a latent dependency.

---

## Predicted Lighthouse delta if P1 fixes ship

| Fix | Mobile | Desktop | Est. effort |
|---|---:|---:|---:|
| P1-1 i18n payload trim | +3-5 | +1-2 | 30 min |
| P1-2 font weight prune | +3-4 | +1-2 | 15 min |
| P1-3 events page Promise.all | +2 | +1 | 10 min |
| P1-5 sidebar in layout | +1-2 | 0 | 20 min |
| **Sum** | **+9-13** | **+3-5** | **~75 min** |

From 87/88 baseline that lands comfortably in the 95+ band on both viewports.

---

## File-level cheat sheet (for the implementer)

| Finding | File:line | Action |
|---|---|---|
| P1-1 | `src/app/[locale]/layout.tsx:33` | Trim NextIntlClientProvider messages payload |
| P1-2 | `src/app/layout.tsx:6-25` | Drop `latin-ext` subset, prune unused weights |
| P1-3 | `src/app/[locale]/events/[eventId]/page.tsx:39-104` | Wrap follow-up awaits in Promise.all |
| P1-4 | `src/app/[locale]/today/page.tsx:48-52`, `groups/[groupId]/page.tsx:49-73` | Promise.all unread + main query |
| P1-5 | All 9 page.tsx files mounting DesktopSidebar | Hoist into `src/app/[locale]/layout.tsx` (or authed route group) |
| P1-6 | `src/app/[locale]/page.tsx:13`, `i/[token]/page.tsx`, `u/[username]/page.tsx` | Drop `force-dynamic`, set `revalidate = 60` |
| P2-1 | `src/components/ui/Avatar.tsx:42-48` + `next.config.ts:4` | Use `next/image` + add `images.remotePatterns` |
| P2-2 | `src/components/onboarding/SportsForm.tsx:12-20` + `package.json:42` | Move 7 sport icons into Glyph, drop `react-icons` dep |
| P2-3 | `src/components/group/FormationTimeline.tsx`, `today/Today*Card.tsx` | Convert to server components with `<details>` where toggle is the only state |
| P2-4 | `src/i18n/routing.ts:4-5` | Decide RO vs EN-only and stop the silent flip-flop |
| P2-5 | `src/app/globals.css:90-143` | Delete unused `[data-brand="A"]` and `[data-brand="C"]` token blocks |
| P2-6 | `messages/ro/common.json` | Delete or align size with EN |
| P3-1 | `src/lib/upload-actions.ts:144` | Gate console.warn behind NODE_ENV check |
| P3-5 | `src/app/[locale]/layout.tsx:29-30` | Skip walkthrough cookie read in non-demo prod |
