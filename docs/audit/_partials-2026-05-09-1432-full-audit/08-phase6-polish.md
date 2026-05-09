# 08 — Phase 6: Polish & Proof Audit

Audit date: 2026-05-09
Specs: `docs/specs/12-implementation-plan.md` §8, `docs/specs/10-prod-readiness.md` (full), `docs/specs/00-overview.md`

## Headline

Phase 6 is **MOSTLY MISSING**. The infrastructure is built (Judge Mode page renders, visual QA harness exists, Lighthouse runner ran twice) but the actual deliverables fail the spec gates. **Mobile Lighthouse is 87/88 (FAIL — 95+ required)**, **`/today` Lighthouse never ran** (spec 09 §7 explicitly requires authenticated `/today`), the **demo seed has only 4 users** vs spec 10 §8's required 20, **6 of 33 Judge Mode rows are still `pending`** (= overclaim risk), the **README is the upstream challenge brief** with no setup/demo instructions added, **no presentation outline exists**, and **no Railway smoke evidence** is checked in. Visual QA captured 22 routes but only 2 of them at the desktop 1440w width.

## Verdict Table

### Phase 6 tasks (spec 12 §8, items 1–8)

| # | Task | Verdict | Evidence |
|---|---|---|---|
| 1 | Visual QA on mobile and desktop | PARTIAL | Harness `e2e/visual.spec.ts:25-31,33-56` covers 22 routes × 5 viewports; output dir `_review/screenshots/` has **61 PNGs** but only **2 at 1440w** (`landing-en-1440w.png`, `landing-ro-1440w.png`) — no desktop captures for signup/login/onboarding/today/groups/events/map/demo etc. No `index.json` written despite spec at `e2e/visual.spec.ts:181-184`. |
| 2 | Lighthouse 95+ on mobile AND desktop | FAIL | See scores table below. Mobile fails on landing (perf=87) and login (perf=88). `/today` (spec-required, authed) **never ran**. Only 2 routes (`/`, `/login`) measured. |
| 3 | Error / loading / empty states | PARTIAL | `EmptyState` (`src/components/ui/EmptyState.tsx`) and `Skeleton` (`src/components/ui/Skeleton.tsx`) exist and used in 7 pages (calendar, leaderboard, groups, events, events/new, u/[username], notifications). **No `loading.tsx` or `error.tsx`** files anywhere in `src/app/` (only `src/app/[locale]/not-found.tsx` exists). Today, groups/[id], events/[id], map, settings have no skeleton/empty hooks. |
| 4 | Demo seed quality pass | FAIL | `scripts/seed-demo.ts:36-93` defines **4 users** (Alex, Maria, Radu, Ioana) — spec 10 §8 requires **20**. **2 venues** vs "venues with price tiers and confidence labels" (plural+spread). **No event vote**, no event-specific chat seed, no notifications seed, no AI cache seed, no captain brief seed, no Judge Mode scoring status rows. Almost no rubric coverage. |
| 5 | Judge Mode scoring-proof pass | PARTIAL | `src/app/[locale]/demo/page.tsx:130-142` renders `RubricSection` rows wired through `src/lib/demo/scoring-proofs.ts`. Page is gated, has live health, build SHA, seed counts, AI cache count. **But 6 rows are still `pending`** with point values listed — implicit overclaim until summary excludes them (it does — `scoring-proofs.ts:417-419` skips pending in `totalClaimed`). 8 rows at `fallback` need rehearsal copy. Total claimed dynamic. See pending list below. |
| 6 | README setup + demo instructions | MISSING | `README.md` is the **upstream challenge brief** verbatim (lines 1–260). No "Setup", "Run", "Migrate", "Seed demo", "Demo flow", "Judge Mode URL", "Railway smoke" sections. Spec 10 §9 last item ("README updated with setup/run/demo") is unmet. |
| 7 | Presentation outline | MISSING | No `PRESENTATION.md`, `pitch.md`, `docs/demo-script.md`, or any equivalent file under `docs/`. Spec 12 §8 item 7 lists "Presentation outline" as a Phase 6 deliverable. |
| 8 | Railway smoke test | MISSING | No checked-in evidence — no smoke checklist, no run log, no `_review/railway-smoke.md`. Spec 10 §9 lists 7 smoke items (`/api/health`, signup, upload, prompt, match, chat SSE, event chat SSE, map/list fallback, calendar export, Judge Mode); none recorded. Railway is configured (`railway.toml:1-12`, healthcheck `/api/health`) but no proof it was run end-to-end. |

### Spec 12 §8 "Done when" gates

| Gate | Verdict | Evidence |
|---|---|---|
| Production URL is demo-ready | UNVERIFIED | No smoke artifacts; deploy is configured but no checked-in proof of a passing demo run. |
| All checks pass | FAIL | Mobile Lighthouse < 95 (see below); README/presentation/smoke all missing. |
| Demo script runs in under 5 minutes | FAIL | No demo script exists. |

## Lighthouse scores

Files: `_review/lighthouse/{landing,login}-{desktop,mobile}.report.{html,json}` (8 files, last modified 2026-05-09 14:36).

| Route | Form factor | Perf | A11y | BP | SEO | Pass 95+? |
|---|---|---:|---:|---:|---:|---|
| `/` (landing) | desktop | **100** | 95 | 96 | 100 | YES |
| `/` (landing) | mobile | **87** | 95 | 96 | 100 | **NO (perf)** |
| `/login` | desktop | **100** | 96 | 96 | 100 | YES |
| `/login` | mobile | **88** | 96 | 96 | 100 | **NO (perf)** |
| `/today` | desktop | — | — | — | — | **NEVER RAN** |
| `/today` | mobile | — | — | — | — | **NEVER RAN** |

Mobile-perf bottleneck (from `landing-mobile.report.json` audits):

- `largest-contentful-paint = 4.1s` (score 0.48)
- `interactive = 4.2s` (score 0.86)
- `render-blocking-insight` score 0
- `unused-javascript` score 0
- `legacy-javascript-insight` score 0.5
- `bf-cache` score 0
- FCP=0.9s, TBT=10ms, CLS=0 — these pass; LCP/render-blocking is the regression

Spec context:

- `docs/specs/00-overview.md:18,64` — "≥ 95 on both mobile and desktop"
- `docs/specs/09-testing-strategy.md:162-176` — explicitly requires authed `/today` Lighthouse, fail if redirected to `/login`/`/signup`
- `docs/specs/01-architecture.md:255` — same 95+ target, calls out MapLibre defer-load as the strategy

Earlier today an `*-final` set of reports existed (timestamps 14:32) that hit 100 across the board but with SEO=91 — those files are no longer present in the dir; only the 14:36 set remains. Either way, `/today` is absent.

## Visual QA evidence

Harness: `e2e/visual.spec.ts:25-203`, runner `scripts/visual-qa/run.mjs:1-28`, config `scripts/visual-qa/playwright.visual.config.ts`.

Routes captured (22): `landing-en`, `landing-ro`, `signup`, `login`, `recover`, `onboarding-{profile,sports,location,photo}`, `today`, `groups`, `groups-detail`, `events`, `events-new`, `events-detail`, `notifications`, `map`, `demo`, `settings`, `u-username`, `leaderboard`, `calendar`.

Viewport coverage in `_review/screenshots/` (61 files):

| Width | Files | Coverage |
|---|---:|---|
| 360w | 22 | full |
| 390w | 22 | full |
| 768w | 17 | partial (missing `events`, `events-new`, `today` etc. checked but file count is 17/22) |
| 375w | 0 | none |
| 1440w | **2** | only `landing-en` and `landing-ro` — desktop QA effectively absent |

Spec AGENTS.md "Mobile screenshots at 360/375/390/768/1440 widths" — fails on 375 (zero) and 1440 (2/22). Many screenshot files for distinct routes share identical 89,064-byte size (e.g. `today-360w.png`, `groups-360w.png`, `login-360w.png`, `recover-360w.png`, all onboarding shots) — strong signal these routes redirect to a single login/auth screen for unauthenticated sessions; visual QA harness has no auth seed step. No console-error capture written (`index.json` not produced).

## Empty / loading / error state coverage

| Surface | Empty | Loading | Error |
|---|---|---|---|
| `/today` (`src/app/[locale]/today/page.tsx`) | unknown — page.tsx only | none (no `loading.tsx`) | none (no `error.tsx`) |
| `/groups` | YES (`src/app/[locale]/groups/page.tsx` imports EmptyState) | none | none |
| `/groups/[groupId]` | unknown | none | none |
| `/events` | YES | none | none |
| `/events/new` | YES | none | none |
| `/events/[eventId]` | unknown | none | none |
| `/notifications` | YES (`NotificationInbox.tsx`) | none | none |
| `/map` | partial (`MapView.tsx` imports Skeleton) | none | none |
| `/calendar` | YES | none | none |
| `/leaderboard` | YES | none | none |
| `/u/[username]` | YES | none | none |
| Global | `not-found.tsx` only | — | — |

AGENTS.md "Every empty/loading/error state needs a visible next action or fallback" — partial. App router has zero `loading.tsx` and zero `error.tsx` segments; an unhandled server-action throw will surface the generic Next dev error overlay, not a controlled fallback.

## Judge Mode rubric proof breakdown

`src/lib/demo/scoring-proofs.ts:38-405` — 33 rows across 9 categories. Wired to `RUBRIC_TOTAL_MAX = 16_600` (`scoring-proofs.ts:36`).

| Status | Count | Risk |
|---|---:|---|
| live | 19 | OK — claimed and routed |
| seeded | 2 | OK — depends on seed quality (currently weak — see seed audit above) |
| fallback | 6 | needs honest rehearsal copy on demo day |
| **pending** | **6** | **overclaim risk** if listed without `pending` chip in demo |

Pending rows (lines in `scoring-proofs.ts`):

- `photo-upload` 500p (line 81–83) — Phase 1 deliverable still pending in this rubric
- `match-confirmation` 300p (line 114–116)
- `ai-compatibility-explainer` 500p (line 123–125) — duplicates `ai-compatibility-cached` below
- `manual-event-create` 500p (line 162–164) — core MVP row
- `ai-photo-extract` 500p (line 264–266)
- `ai-compatibility-cached` 300p (line 273–275)
- `ai-recommendations` 200p (line 291–293)

(Count of 7 pending lines vs 6 unique rubric items — `ai-compatibility-explainer` and `ai-compatibility-cached` both pending; rubric design has it as one feature double-counted.)

Total `pending` claim if surfaced = 2,500p — sizable. `summarizeRubric()` (`scoring-proofs.ts:407-432`) correctly excludes pending from `totalClaimed`, and `RubricSection`/`ScoringProofRow` render the chip — implementation is honest. The risk is the gap between what the demo *claims* visibly and what is wired.

## Demo seed gap (spec 10 §8)

`scripts/seed-demo.ts` produces:

| Spec requirement | Seed reality | Verdict |
|---|---|---|
| 20 realistic Timisoara users | 4 users (`scripts/seed-demo.ts:36-93`) | **FAIL** |
| Distribution across football, tennis, basketball, running | football+running, tennis+yoga, football+basketball, football+volleyball | partial — running shown but no dedicated runner; basketball as secondary only |
| RO + EN bios | all bios in EN | **FAIL** — spec says bilingual seed |
| Accepted AI suggestions | none seeded | **FAIL** |
| Cached AI outputs (bio/photo/compatibility/captain-brief) | none seeded; AI cache count surfaces but 0 | **FAIL** |
| One active prompt | YES (`seed-demo.ts:228-239`) | DONE |
| Multiple yes/no responses | 4× yes only — no `no` answers (`seed-demo.ts:241-252`) | partial |
| Almost-full football group | 4-of-DEMO_USERS group, sizeTarget = DEMO_USERS.length (`seed-demo.ts:264`) | partial — "almost full" implies a near-full ≥10-person squad |
| Tennis group | none — only one football group created | **FAIL** |
| Venues with price tiers + confidence | 2 venues (`seed-demo.ts:95-118`) — free+paid, verified+estimated | minimum coverage |
| Active event with vote and event-specific chat | event seeded (`seed-demo.ts:282-297`) but **no votes**, **no event chat messages** | partial |
| In-app notifications (match, vote, event update, reminder) | none | **FAIL** |
| Judge Mode scoring status rows | not seeded; rubric is static config, not DB rows | n/a — design choice but means seed has no toggle |

Guard is correct: `seed-demo.ts:380-389` requires `ALLOW_DEMO_SEED=true` + `DEMO_SEED_CONFIRM=showup2move`. Reset path lives at `src/app/api/demo/reset/route.ts` (verified existing earlier in audit chain).

## What's missing on README

`README.md` (lines 1–260) is the upstream challenge brief copy — useful context but **none of**:

- pnpm install / migrate / dev / build runbook
- env var bootstrap pointer (`.env.example` exists but README never refers to it)
- Demo seed command (`ALLOW_DEMO_SEED=true DEMO_SEED_CONFIRM=showup2move pnpm tsx scripts/seed-demo.ts`)
- Judge Mode access URL + flag (`/en/demo` with `ALLOW_DEMO_MODE=true`)
- Railway smoke flow / production URL
- Demo flow walkthrough (signup → onboarding → ShowUpToday → match → chat → event → vote → ics)
- Admin/judge login credentials for seeded demo (`Showup2move!` per `seed-demo.ts:19`) — must be documented somewhere if reproducible

Spec 10 §9 launch checklist last bullet "README updated with setup/run/demo" is unmet.

## What's missing on presentation outline

No file matches `PRESENTATION*`, `pitch*`, `outline*`, `demo-script*` under `docs/` or repo root. AGENTS.md "Testing And Proof" minimum doesn't list a presentation explicitly, but spec 12 §8 item 7 requires it as a Phase 6 deliverable. Output target unclear (Notion / Slides / .md) — none exists.

## What's missing on Railway smoke

Configured: `railway.toml:1-12`, `Dockerfile`, `scripts/migrate.mjs`, healthcheck path. No checked-in run log under `_review/`, no `docs/runbooks/railway-smoke.md`, no GitHub Actions deploy gate. Spec 10 §9 has 7 smoke items, none with evidence.

## Recommendations (ordered by demo-day risk)

1. **Lighthouse mobile fix** — the LCP=4.1s on landing-mobile is render-blocking + unused JS. Spec 01 §"Performance" already prescribes lazy-loading MapLibre; verify `next.config.ts` and route-segment imports for landing don't pull map/chart bundles. Re-run with `--form-factor=mobile --screenEmulation.mobile=true`.
2. **Run `/today` Lighthouse with seeded session cookie** — spec 09 §7 explicit. Without it the rubric "Production + Demo" 500p row is unproven.
3. **Expand seed to 20 users + tennis group + votes + notifications + AI cache** — `scripts/seed-demo.ts:36-93` and add cache rows. Without this, 6 `seeded` and `fallback` rubric rows are visually empty when judges click through.
4. **Resolve 6 `pending` rubric rows** — either wire them (photo-upload, match-confirmation, manual-event-create, ai-photo-extract, ai-compatibility-cached, ai-recommendations) or downgrade their points to 0 in `scoring-proofs.ts` and label them stretch.
5. **Author `README.md` setup + demo section** (or add a `docs/demo.md` and link from README) — required by spec 10 §9.
6. **Author `docs/presentation.md`** — even a 1-page outline (problem / solution / live demo path / architecture / risks) closes the spec gate.
7. **Capture missing visual QA at 1440w + 768w** — re-run with `VISUAL_VIEWPORTS=1440w,768w` for all 22 routes and seed a session cookie so authed routes don't all collapse to `login-360w` look-alikes.
8. **Add `loading.tsx` + `error.tsx`** at `/[locale]`, `/[locale]/today`, `/[locale]/groups/[groupId]`, `/[locale]/events/[eventId]` — even minimal skeletons satisfy AGENTS.md "every loading/error state needs a fallback".
9. **Write `_review/railway-smoke.md`** — copy spec 10 §9 list, run each, paste output / screenshots / curl results.

## Files referenced

- `docs/specs/12-implementation-plan.md:151-168` (Phase 6 spec)
- `docs/specs/10-prod-readiness.md:182-206` (demo seed spec); `:207-222` (launch checklist)
- `docs/specs/00-overview.md:18,64` (Lighthouse 95+ both)
- `docs/specs/09-testing-strategy.md:162-185` (Lighthouse including authed `/today`)
- `_review/lighthouse/{landing,login}-{desktop,mobile}.report.json` (4 files, perf scores 87/88/100/100)
- `_review/screenshots/*.png` (61 files; only 2 at 1440w)
- `e2e/visual.spec.ts:25-31` (viewport list); `:33-56` (route list); `:181-184` (index.json writer — output not produced)
- `scripts/visual-qa/run.mjs:1-28`, `scripts/visual-qa/playwright.visual.config.ts`
- `scripts/seed-demo.ts:36-93` (4 users); `:95-118` (2 venues); `:241-252` (4 yes responses); `:380-389` (guard)
- `src/app/[locale]/demo/page.tsx:1-242` (Judge Mode page)
- `src/lib/demo/scoring-proofs.ts:36` (RUBRIC_TOTAL_MAX); `:38-405` (33 rows); `:407-432` (`summarizeRubric`)
- `src/components/ui/EmptyState.tsx`, `src/components/ui/Skeleton.tsx`
- `src/app/[locale]/not-found.tsx` (only error/empty layer)
- `README.md:1-260` (upstream brief, no setup section)
- `railway.toml:1-12` (healthcheck only)
