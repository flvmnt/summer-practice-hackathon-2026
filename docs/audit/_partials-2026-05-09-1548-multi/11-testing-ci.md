# 11 - Testing Coverage, CI Gates, Pre-Push Enforcement

Audit run: 2026-05-09 15:48 - branch HEAD `7e0e613 docs(audit): add design and risk trends`.
Scope: husky pre-push hook + chain, `pnpm check` definition, vitest coverage of hot paths, Playwright spec set, CI workflow, ESLint/TS strictness, drizzle migrate gate, test-data isolation, smoke for the Judge Mode demo path.

## TL;DR

- Pre-push runs `pnpm check` (lint + i18n + typecheck + vitest + build) - solid sequence, blocks on first failure (`.husky/pre-push:7`). Hook is tracked, executable (100755), and chained correctly through `core.hooksPath = .husky/_`. Bypass surfaces: `--no-verify` (documented), `HUSKY=0` (silent), `pnpm install` skipped on fresh clone (silent).
- **Playwright is not a gate at any layer.** `pnpm check` does not call `test:e2e` (`package.json:18`). CI does not call `test:e2e` (`.github/workflows/ci.yml:27-28`). Pre-push does not call `test:e2e`. The single spec `src/tests/e2e/landing.spec.ts` (8 lines, 1 test, asserts h1 + "start playing" link) is dead infrastructure - it can only run via `pnpm test:e2e` which nothing invokes.
- AGENTS.md `Testing And Proof` section commits to a Playwright happy path (`signup -> onboarding -> today yes -> match -> chat -> event -> vote -> .ics`) and a two-browser realtime proof. Both **do not exist** in the suite; never have, per `git log -- src/tests/e2e/`.
- 21 vitest files, **91 `it()` tests, 24 `describe()` blocks**, zero `.skip` / `.only` / `xit`. All deterministic. Coverage is concentrated in pure helpers (matching-core, team-balance, auth-crypto, contracts/zod, calendar ICS, recovery, weather, request-ip, action-result, env, health, session, uploads sniffMime, ai/bio-extract, ai/captain-brief, ai/compat-score). **0 tests for any server action** (12 `*-actions.ts` / `*-form-actions.ts` files - all untested).
- **Hot-path modules with zero tests:** `chat.ts` (659 lines), `events.ts` (610 lines), `matching.ts` (297 lines, the actual transactional wrapper around `matching-core`), `auth.ts` (260 lines), `notifications.ts`, `groups.ts`, `votes.ts`, `match-confirm.ts`, `invites.ts`, `prompt.ts`, `prompt-window.ts`, `ai/cache.ts` (the demo-safety getOrCompute), every `demo/*.ts` (guard, scripted-login, ensure-seeded, walkthrough, scoring-proofs).
- **Zero component tests.** `@testing-library/react` and `jsdom` are installed but unused for components.
- CI = one job, single step `pnpm check`. No concurrency cancel, no Drizzle migrate test, no service container, no `.next/cache` cache. Node 22 in CI vs `engines >=20.19.0` (drift but compatible).
- Drizzle migrate is now a deploy blocker via Railway `preDeployCommand` (`railway.toml:6`). If migrate exits non-zero the new revision never starts. Healthcheck timeout bumped to 300s. Good.
- Test-DB isolation: not needed (no test imports `getDb`). Demo seed uses `demoRunId` ownership marker correctly (`scripts/seed-demo.ts:121,178`); reset deletes by `demoRunId` only.

Severity counts: **P0=2, P1=4, P2=5, P3=3.**

---

## P0 - Test green but app demonstrably broken / false confidence

### P0-1 - The committed demo loop has zero automated coverage; `pnpm check` passing means nothing about it

- AGENTS.md (top, "Core demo loop") and the rubric require:
  `signup -> onboarding -> ShowUpToday -> match -> group chat -> event chat -> event plan -> venue/map/vote -> calendar export -> Judge Mode proof`
- Test inventory against that loop:
  - signup: contract zod tests only (`src/lib/contracts/auth.test.ts:22-33`). No action test, no E2E.
  - onboarding: zero. `src/lib/onboarding-form-actions.ts`, `src/lib/onboarding-state.ts`, `src/lib/onboarding.ts`: no `*.test.ts`.
  - ShowUpToday prompt: `src/lib/contracts/prompt.test.ts` (2 it-blocks, schema only). `src/lib/prompt.ts` and `prompt-form-actions.ts`: zero.
  - match: `src/lib/matching-core.test.ts` covers the **pure** group-forming algorithm (3 it-blocks). `src/lib/matching.ts:265-297` (the transactional wrapper that actually writes groups, members, achievements and runs `pg_advisory_xact_lock`) has **zero** tests.
  - group chat: `chat.ts` (659 LOC), `chat-form-actions.ts`: zero. Only contract zod (`src/lib/contracts/chat.test.ts`, 3 it-blocks).
  - event chat: same files, no separate event-chat test. AGENTS.md "Event chat is real event-scoped chat keyed by `eventId`; group system messages alone do not satisfy the event-chat row" - no automated proof of isolation.
  - event plan / venue / vote: `events.ts` (610 LOC), `event-form-actions.ts`, `manual-event-actions.ts`, `votes.ts`: zero tests.
  - calendar `.ics`: `src/lib/calendar.test.ts` (2 it-blocks) covers `buildIcsCalendar` formatting only. Route handler `src/app/api/events/[eventId]/ics/route.ts`: zero.
  - Judge Mode proof: `src/lib/demo/scoring-proofs.ts`, `walkthrough.ts`, `ensure-seeded.ts`, `guard.ts`, `scripted-login.ts`, `src/app/api/demo/scoring-status/route.ts`, `src/app/[locale]/demo/{page,scripted/route,step/[step]/route}.tsx`: **zero** tests.
- Net: a green `pnpm check` validates pure helpers and zod schemas. It cannot fail when the captain-brief panel breaks, when matching commits zero rows, when event chat leaks across events, when `.ics` is malformed, when `/demo/scripted` 404s, when scoring-status reports false-positive proof.
- Fix (minimal, hackathon-budget):
  1. Add a single Playwright happy-path spec that wires the AGENTS.md loop end-to-end against a seeded demo session (the `demo_alex` shortcut at `src/lib/demo/scripted-login.ts:9` already gives you a one-redirect login). Even a brittle smoke that just verifies each step renders without a 5xx is more proof than the current state.
  2. Wire `pnpm test:e2e` into a separate CI job (or extend the pre-push to a fast subset). Otherwise it stays decorative.
  3. Add at least one integration test per server-action file using a transactional rollback or in-memory `pg-mem`. `matching.ts:265` and `chat.ts` ownership checks deserve it most.

### P0-2 - The only Playwright spec asserts copy that the codebase explicitly disclaims as unstable

- `src/tests/e2e/landing.spec.ts:7` asserts `getByRole("link", { name: /start playing/i })`. Commit `3450e31` introduced this 1 hour before the audit.
- Risk path: any landing CTA copy change (the `_review/` and audit history shows multiple landing polish passes: `dd9533d fix(landing): un-double .ai-mark`, `cd41e08 fix(i18n): translate landing-page side card`, `67b30b7 fix(i18n): rewrite RO landing headline`) breaks this assertion. Because `pnpm check` does NOT run `test:e2e` (verified: `grep -n 'test:e2e\|playwright' .husky/pre-push package.json | wc -l` returns only the script def), the breakage will only surface if someone manually runs `pnpm test:e2e` - which the project history shows nobody does.
- Worse: when this E2E does eventually run and fails on stale copy, the natural reaction will be to weaken the assertion (`getByRole("link")`, no name) rather than write the missing happy-path coverage. That's a one-way ratchet toward zero E2E value.
- Fix: either (a) delete the spec and stop pretending E2E exists, or (b) make it run on every push, replace the copy assertion with a structural one (`page.locator("[data-testid=primary-cta]")`), and add at least the demo scripted-login redirect smoke (`/en/demo/scripted` -> 302 -> `/en/today` -> visible heading).

---

## P1 - Missing gate that catches predictable regressions

### P1-1 - `pnpm check` defines a 5-step gate but Playwright + a11y + Lighthouse are silently absent

- `package.json:18` defines `"check": "pnpm lint && pnpm lint:i18n && pnpm typecheck && pnpm test && pnpm build"`.
- AGENTS.md `Testing And Proof` section requires (verbatim):
  ```
  - pnpm lint
  - pnpm typecheck
  - pnpm test
  - pnpm build
  - Playwright happy path: signup -> onboarding -> today yes -> match -> chat -> event -> vote -> .ics.
  - Two-browser realtime proof for group chat, vote update, and event chat isolation.
  - Mobile screenshots at 360/375/390/768/1440 widths.
  - Lighthouse artifacts for / and authenticated /today, mobile and desktop.
  ```
- Drift: 4 of 8 lines are wired. Playwright happy path / two-browser realtime / mobile screenshots / Lighthouse: **none** are wired into `check`, CI, or pre-push.
- `axe` accessibility smoke called out under `Expected Stack` ("axe for accessibility smoke"): `grep -rn 'axe\|@axe-core' package.json src/` returns zero - never installed.
- Visual QA harness (`6ea612f test: add visual qa harness`, +252 LOC under `e2e/visual.spec.ts`, `scripts/visual-qa/playwright.visual.config.ts`, `scripts/visual-qa/run.mjs`) was reverted 34 minutes later by `a12256b chore: remove visual qa harness and report` with the explicit reasoning "The harness was never wired into CI (ci.yml runs only `pnpm check`) and screenshot artifacts were local-only." That diagnosis is correct, but the replacement is **nothing** - no new harness, no Playwright trace artifacts, no Lighthouse CI job.
- Fix: either pull the unmet bullets out of AGENTS.md (specs are canon per CLAUDE.md, drift between specs and reality is a contract violation per the same doc), or add the matching CI jobs. Recommend at minimum a separate `e2e` job in `.github/workflows/ci.yml` with `pnpm playwright install --with-deps chromium` + `pnpm test:e2e` against an ephemeral Postgres service container.

### P1-2 - CI runs zero jobs in parallel, no concurrency cancel, no caches beyond pnpm store

- `.github/workflows/ci.yml` is 29 lines. Single job `app`, single `Check` step that runs `pnpm check` (~lint+i18n+tsc+vitest+next build), wall time will be 4-7 minutes for `next build` alone on a cold runner.
- Missing:
  - No `concurrency: group: ci-${{ github.ref }}, cancel-in-progress: true`. Pushing 3 commits in 30 seconds (the actual project pace per `git log --pretty='%h %ad' --date=iso | head -10` showing ~1 commit per 5 minutes during active work) burns 3x runner minutes for the same final state.
  - No `.next/cache` restore (`actions/cache` for `~/.next/cache` keyed on lockfile + source hash). `next build` rebuilds every page from scratch each run.
  - No drizzle migration validation. CI never spins up Postgres, never runs `pnpm db:migrate` against a clean DB, never validates that `drizzle/0010_black_mauler.sql` actually applies. A bad migration only surfaces at Railway preDeploy time.
  - No `pnpm audit` (called out in AGENTS.md `CI/CD And Security Tooling Guidance` line 3 as a "good bonus-ready tool"). `pnpm audit --audit-level high` is a zero-config gate.
  - No `gitleaks` (called out in AGENTS.md line 2). The 03-security partial of this audit found no leaked secrets, but it's a one-shot finding; CI should keep that property.
  - No CodeQL.
- Fix priority: concurrency cancel (one line, immediate cost win), then `.next/cache`, then a separate `migrate-check` job that uses `services: postgres` and runs `pnpm db:migrate`.

### P1-3 - Pre-push and CI both rely on the same `pnpm check`; CI provides no independent verification

- Both pre-push and CI invoke `pnpm check`. If a contributor uses `git push --no-verify` (legitimately, per `.husky/pre-push:4` and `:10`) or `HUSKY=0 git push` (silent, per `.husky/_/h:14` `[ "${HUSKY-}" = "0" ] && exit 0`), CI catches it.
- But CI runs **only** `pnpm check`. So the only thing CI guards against pre-push bypass is that the same five steps still pass. There is no asymmetric coverage: no integration tests with a real DB, no E2E, no security scan that local doesn't run.
- Result: a `pnpm check`-green PR landing in main has the same evidence as a `pnpm check`-green local checkout. The CI run is a safety net only against the case "developer ran the wrong branch's checks" or "developer's local node_modules was different." Useful, but thin.
- Fix: differentiate. Local `pnpm check` for fast pre-push. CI `pnpm check && pnpm test:e2e && pnpm db:migrate (in container) && gitleaks` for asymmetric coverage.

### P1-4 - Husky `prepare` script will fail-loud on minimal clones, but missing-hooks state is silent

- `package.json:23` `"prepare": "husky"` runs at every `pnpm install`. On a fresh clone where someone runs `pnpm install --prod` (no `husky` devDep), `prepare` will skip (since `husky` won't be in `node_modules/.bin`). Now `core.hooksPath` may not be configured (it's per-repo, set by `husky` itself in `node_modules/husky/bin.js` first run). Result: pushes succeed with no hooks.
- Verified state on this checkout: `git config core.hooksPath` returns `.husky/_`, and `.husky/_/pre-push` exists at 39 bytes (sources `.husky/_/h` which sources `.husky/pre-push`). Chain works.
- But `.husky/_/` is **gitignored implicitly** (it's auto-generated by husky; not in .gitignore but never added). On a fresh `git clone && pnpm install`, husky regenerates it. On `git clone` alone, it's absent and `core.hooksPath` from `.git/config` is also absent. Push succeeds with zero verification.
- Detection signal: `.husky/_/.gitignore` contains `*` (`cat .husky/_/.gitignore` -> `*`). Confirms the dir is meant to be regenerated, not committed.
- Fix: in CI, add a one-line check `[ "$(git config --local --get core.hooksPath)" = ".husky/_" ] || (echo "husky not installed; run pnpm install" && exit 1)` for local diagnosis. More importantly, treat hooks as defense-in-depth, not as a gate. CI must remain authoritative.

---

## P2 - Hygiene / coverage gaps that will bite later

### P2-1 - `health.test.ts` mutates `process.env.DATABASE_URL` without restoring it

- `src/lib/health.test.ts:11` and `:24` both `delete process.env.DATABASE_URL` inside test bodies.
- The `afterEach` at `:4-6` runs `vi.unstubAllEnvs()` but that only undoes `vi.stubEnv` calls. `delete process.env.X` is a direct mutation outside vitest's tracking and is **not** restored.
- Vitest defaults: `isolate: true`, per-file process. So the mutation only affects subsequent tests in `health.test.ts` itself. Today both tests delete the same var, so it happens to be idempotent. Add a third test that needs DATABASE_URL set, and you get an order-dependent flake that only reproduces in the same file.
- Fix: store originals at top-of-file (the pattern at `session.test.ts:4-13` is the right template), or use `vi.stubEnv("DATABASE_URL", undefined)` consistently.

### P2-2 - Stale assumption baked into `contracts/auth.test.ts`: defaults locale to `"ro"`

- `src/lib/contracts/auth.test.ts:23-30` expects `signupInputSchema.parse({ username: "ana", password: "password123" })` to default `locale: "ro"`.
- Commit `f471fb3 chore(i18n): drop Romanian from served locales, keep EN only` (`src/i18n/routing.ts` -> `locales: ["en"], defaultLocale: "en"`) made this expectation wrong.
- Commit `250d822 fix(i18n): close locale leaks across core flows` (1.5h later) **reverted** `routing.ts` back to `["ro", "en"]` with `defaultLocale: "ro"`. So the test passes again - by accident, because the canonical i18n decision flip-flopped. Anyone reapplying the f471fb3 narrowing will break this test and not understand why.
- Fix: assert `locale: routing.defaultLocale` (import `routing` from `@/i18n/routing`) instead of hard-coding `"ro"`.

### P2-3 - Zero component tests; `@testing-library/react` + `jsdom` carry the weight without doing the work

- `package.json:53,61` install `@testing-library/react` and `jsdom`. `vitest.config.ts:14` sets `environment: "jsdom"`.
- `find src/components -name '*.test.ts*'` returns zero.
- `src/components/today/`, `src/components/group/`, `src/components/onboarding/PhotoForm.tsx` (335 LOC, has the `eslint-disable @next/next/no-img-element` carveout), `src/components/auth/RecoveryCodeReveal.tsx` - none are smoke-tested.
- The 03-security partial flagged that the recovery-code reveal is the only A-grade design and a critical UX moment. A 5-line `render` + `screen.getByText(/copy/i)` test would catch a regression.
- Fix: add at minimum 3 component smoke tests (Today prompt panel, RecoveryCodeReveal, PhotoForm idle-state) so the jsdom environment isn't dead weight.

### P2-4 - No vitest coverage thresholds, no coverage report wired

- `vitest.config.ts` has no `test.coverage.*` config. `pnpm test -- --coverage` would work (vitest ships c8/v8 coverage by default in v4) but nothing in CI or pre-push asks for it.
- AGENTS.md does not require coverage numbers. Fine. But without even a printed % at PR time, we can't see the trend (today: 21 test files vs ~80 source files in `src/lib/` alone, so ballpark <30% file coverage; line coverage on the tested files is good).
- Fix (cheap): add `--coverage --coverage.reporter=text-summary` to a CI step, post the totals as a sticky PR comment. No threshold gate needed at hackathon scale.

### P2-5 - `tsconfig.tsbuildinfo` is committed-adjacent but `.gitignore`d, and `pnpm typecheck` ignores it anyway

- `tsconfig.tsbuildinfo` exists at repo root (467 KB), `.gitignore:34` `*.tsbuildinfo` correctly ignores it.
- `package.json:15` `"typecheck": "tsc --noEmit --incremental false"` deliberately disables the incremental build cache. So the file is generated only by `pnpm dev` / `pnpm build`, never read by typecheck. Fine, but mildly wasteful (typecheck takes the full 12-15s for a full re-check on every pre-push).
- Fix (optional): split `typecheck:fast` (incremental, for pre-push) and `typecheck:strict` (`--incremental false`, for CI). Saves 8-10s per push.

---

## P3 - Nits

### P3-1 - Pre-push echoes a `--no-verify` hint that nudges users toward bypassing

- `.husky/pre-push:4` `echo "[pre-push] to bypass for emergencies, use: git push --no-verify"` advertises the bypass before the hook even runs. AGENTS.md `Commit Discipline` line 4 explicitly says "Do not use `--no-verify` to bypass hooks unless the user explicitly approves" and CLAUDE.md line 9 says "Do not bypass hooks without explicit user approval". The hook's UX undercuts the policy.
- Fix: move the hint to the failure branch only (`.husky/pre-push:9`). Don't print bypass instructions when the hook hasn't failed yet.

### P3-2 - CI uses Node 22 while `engines.node` is `>=20.19.0`

- `.github/workflows/ci.yml:21` `node-version: 22`. `package.json:7` `"node": ">=20.19.0"`.
- No drift today (Node 22 satisfies `>=20.19.0`). But `package.json` permits 20.x, which has different `--experimental-vm-modules` semantics, and CI never tests it. A contributor running 20.19 locally may see a behavior CI never catches.
- Fix: pin to a single Node line in both places (recommend Node 22 LTS), and add `engines-strict=true` in `.npmrc` (or `pnpm` equivalent) to force.

### P3-3 - No `--frozen-lockfile` enforcement at pre-push; lockfile drift can land silently

- CI uses `pnpm install --frozen-lockfile` (`.github/workflows/ci.yml:25`). Pre-push's `pnpm check` runs `pnpm lint && ...` without re-installing. If a contributor edits `package.json` without updating `pnpm-lock.yaml`, pre-push passes, CI fails.
- Fix (cheap): add `pnpm install --frozen-lockfile --prefer-offline` as the first line of `.husky/pre-push`. Catches lockfile drift in the same place.

---

## Verifications run (paste-back-able)

```
ls -la .husky/                                     # tracked: pre-push (100755)
git ls-files -s .husky/                            # 100755 .husky/pre-push
git config core.hooksPath                          # .husky/_
ls .husky/_/                                       # husky.sh, h, pre-push, ...
cat .husky/_/h | sed -n '14p'                      # [ "${HUSKY-}" = "0" ] && exit 0
git log --all --grep='no-verify' --oneline         # (empty)
find src -name '*.test.ts*' | wc -l                # 21
grep -rE '^[[:space:]]*it\(' src --include='*.test.ts*' | wc -l   # 91
grep -rE '\.(skip|only)\s*\(' src --include='*.test.ts*'          # (empty)
grep -rE '@ts-(ignore|nocheck|expect-error)' src/                 # (empty)
grep -rE '\bas\s+any\b' src/ --include='*.ts*'                    # (empty)
grep -rn 'eslint-disable' src/                                    # 2 hits, both @next/next/no-img-element
find src -name '__snapshots__' -type d                            # (empty)
grep -rln 'getDb\|getSqlClient' src/ --include='*.test.ts'        # (empty) - tests don't hit DB
ls src/tests/e2e/                                                  # landing.spec.ts (only)
grep -n 'test:e2e\|playwright' .github/workflows/ci.yml .husky/pre-push   # (empty)
grep -n 'concurrency\|cancel-in-progress\|secrets\.' .github/workflows/ci.yml   # (empty)
cat railway.toml | sed -n '6,7p'                   # preDeployCommand = node scripts/migrate.mjs
```

## File:line index for every finding

- **Pre-push hook**: `.husky/pre-push:1-15`. Active chain: `.git/config` (`core.hooksPath = .husky/_`) -> `.husky/_/pre-push` -> `.husky/_/h:14,17` -> `.husky/pre-push:7`.
- **`pnpm check` definition**: `package.json:18`.
- **Husky install hook**: `package.json:23` `"prepare": "husky"`. `.gitignore` does NOT mention `.husky/_/`; auto-generated dir self-ignores via `.husky/_/.gitignore` containing `*`.
- **CI workflow**: `.github/workflows/ci.yml:1-29` (single job, single step `pnpm check`).
- **Vitest config**: `vitest.config.ts:1-19`. Globals on, jsdom, no coverage config, no setupFiles, no pool config.
- **Playwright config**: `playwright.config.ts:1-30`. testDir `src/tests/e2e`, projects chromium + mobile-chrome.
- **Only E2E spec**: `src/tests/e2e/landing.spec.ts:1-9`.
- **Visual QA harness add/remove**: `6ea612f` adds 252 LOC, `a12256b` removes 466 LOC. Net: nothing replaced it.
- **Playwright landing smoke commit**: `3450e31 test: add Playwright landing smoke` (the only `test:` commit since `c51af96 fix: harden production chat smoke` 1 day prior; only 2 `test:` commits total in 136-commit history).
- **Demo loop routes (uncovered)**: `src/app/[locale]/demo/page.tsx`, `src/app/[locale]/demo/scripted/route.ts`, `src/app/[locale]/demo/step/[step]/route.ts`, `src/app/api/demo/seed/route.ts`, `src/app/api/demo/reset/route.ts`, `src/app/api/demo/scoring-status/route.ts`. Zero `.test.ts` files alongside.
- **Server-action files (12, all uncovered)**: `src/lib/auth-form-actions.ts`, `chat-form-actions.ts`, `event-form-actions.ts`, `manual-event-actions.ts`, `match-confirm-actions.ts`, `notification-actions.ts`, `onboarding-form-actions.ts`, `photo-actions.ts`, `prompt-form-actions.ts`, `settings-actions.ts`, `upload-actions.ts`, `ai-actions.ts`.
- **Hot-path lib files (uncovered)**: `src/lib/auth.ts:1-260`, `chat.ts:1-659`, `events.ts:1-610`, `matching.ts:1-297`, `notifications.ts:1-113`, `groups.ts:1-129`, `votes.ts:1-87`, `match-confirm.ts`, `invites.ts`, `prompt.ts`, `prompt-window.ts`, `ai/cache.ts:1-71`, `ai/photo-extract.ts`, `ai/sport-keywords.ts`, `demo/guard.ts:1-54`, `demo/scripted-login.ts:1-40+`, `demo/ensure-seeded.ts`, `demo/walkthrough.ts`, `demo/scoring-proofs.ts`.
- **Drizzle migrate gate**: `railway.toml:6` `preDeployCommand = "node scripts/migrate.mjs"`. Migrate script: `scripts/migrate.mjs:1-23` (exit 1 on missing `DATABASE_URL` or migration failure, blocks startup correctly).
- **TypeScript strictness**: `tsconfig.json:11` `"strict": true`. No `// @ts-ignore` / `@ts-nocheck` / `as any` anywhere in `src/` (verified).
- **ESLint disables**: 2 occurrences, both legitimate (`src/components/ui/Avatar.tsx:41`, `src/components/onboarding/PhotoForm.tsx:335`, both `@next/next/no-img-element` for non-Next image use).
- **Test env mutation hazard**: `src/lib/health.test.ts:11`, `:24` (delete without restore). Compare with safe pattern at `src/lib/session.test.ts:4-13`.
- **Stale RO locale assumption in test**: `src/lib/contracts/auth.test.ts:23-30`. Tied to `src/i18n/routing.ts:5` `defaultLocale: "ro"` (current state - flip-flopped via `f471fb3` -> `250d822`).
- **Pre-push bypass hint**: `.husky/pre-push:4`.
- **CI Node version vs engines drift**: `.github/workflows/ci.yml:21` (Node 22) vs `package.json:7` (`>=20.19.0`).
- **Demo seed isolation (correct)**: `scripts/seed-demo.ts:121,178` (uses `demoRunId`); `src/app/api/demo/reset/route.ts:1-50+` (deletes by `demoRunId` only, with `canMutateDemoEndpoint` same-origin guard at `:46-50` and rate limit).

## What this audit does NOT cover

- Did not run `pnpm test`, `pnpm test:e2e`, or `pnpm build` (per audit constraints; would be slow and may hit DB).
- Did not run `pnpm check` end-to-end. Cannot confirm wall-clock duration of pre-push (estimated 90-180s based on `next build` size).
- Did not validate that `.husky/_/` regenerates correctly on a fresh clone + `pnpm install`. State of this checkout confirms it works here, but a from-scratch reproducer is needed to be sure.
- Did not inspect every `*-actions.ts` for missing ownership/auth checks. That's the `09-server-actions` partial scope.
