# 12 - Testing Strategy Audit

Audit date: 2026-05-09
Specs: `docs/specs/09-testing-strategy.md`

## Headline

Unit-test layer is **largely DONE** with 21 files / 91 tests passing in 4.21s and good coverage of the deterministic matching core, auth, contracts, AI fallbacks, calendar, weather, uploads, and rate-limit buckets. Integration tests against a test Postgres are **MISSING entirely** (no DB-backed Vitest suites exist). E2E coverage is **MISSING**: `playwright.config.ts:4` points to `./src/tests/e2e` but that directory has no specs - only `e2e/visual.spec.ts` (visual harness) lives anywhere near Playwright. Visual QA harness is **DONE** and produces a deterministic screenshot matrix + JSON index. CI is **PARTIAL**: `pnpm check` runs lint+typecheck+unit+build but the workflow does NOT spin up Postgres, run integration tests, run Playwright smoke, run axe, or gate on Lighthouse.

## Verdict Table

### Testing layers (spec §3–§8)

| # | Requirement | Verdict | Evidence |
|---|---|---|---|
| 1 | Test commands present (`test`, `test:e2e`, `check`) | DONE | `package.json:16-18` |
| 2 | Vitest unit tests (spec §3 list) | LARGELY DONE | 21 files, 91 tests pass. See gaps below. |
| 3 | Integration tests against test Postgres (spec §4) | MISSING | No `*.it.ts` / `*integration*` / DB-backed Vitest files. `vitest.config.ts:16` includes only `src/**/*.test.{ts,tsx}` and uses `jsdom`. |
| 4 | E2E happy path (spec §5.1) | MISSING | `playwright.config.ts:4` → `./src/tests/e2e/` is empty (`src/tests/` only contains `stubs/server-only.ts`). |
| 5 | Two-browser realtime (spec §5.2) | MISSING | No specs found. |
| 6 | Mobile viewport assertions (spec §5.3) | PARTIAL | Visual harness captures 360/375/390/768/1440 widths (`e2e/visual.spec.ts:25-31`) but does NOT assert no-overflow / sticky-nav / chat-input visibility. |
| 7 | Visual QA harness, deterministic output (spec §6) | DONE | `e2e/visual.spec.ts:1-203`; `scripts/visual-qa/playwright.visual.config.ts:1-22`; `scripts/visual-qa/run.mjs:1-28`. Writes `_review/screenshots/{slug}-{viewport}.png` + `index.json` and fails on 5xx / pageError. |
| 8 | Lighthouse run script (spec §7) | MISSING | No `scripts/lighthouse*`, no CI gate. Only mentioned in spec. |
| 9 | CI gates (spec §8) | PARTIAL | `.github/workflows/ci.yml:1-28` runs `pnpm check` only. No Postgres service, no migrations, no Playwright, no axe, no Lighthouse. See breakdown. |

### Unit-test coverage vs spec §3 list

| # | Required unit | Verdict | Evidence |
|---|---|---|---|
| 1 | Auth validation | DONE | `src/lib/contracts/auth.test.ts:1-59` |
| 2 | Recovery code generation | DONE | `src/lib/recovery.test.ts:1-16`; `src/lib/auth-crypto.test.ts:20-26` |
| 3 | Rate limiting | DONE (auth+chat+invite) | `src/lib/auth-rate-limit.test.ts:1-84` |
| 4 | Safe redirects | MISSING | No `safeRedirect` helper or test found in `src/lib/`. |
| 5 | Sport config group-size rules | PARTIAL | Group size enforced inside `formDeterministicGroups` and partly tested via `matching-core.test.ts:36-49`, but no dedicated `sport-config` test for min/max per sport. |
| 6 | Haversine distance | DONE | `src/lib/matching-core.test.ts:27-34` |
| 7 | Team balancing | DONE | `src/lib/team-balance.test.ts:1-95` (5 cases incl. snake-draft, ties, invariance, normalization, captain reshuffle) |
| 8 | Matching distance gate (1km match, outside-radius no-match) | PARTIAL | `matching-core.test.ts:36-49` excludes a candidate at lat 45.9 from a Timișoara group - implicit "outside-radius no-match", but the assertion is just `not.toContain("5")`, no explicit 1km/outside boundary case named. |
| 9 | Weather recommendation rules | DONE | `src/lib/weather.test.ts:1-65` (rain/wind/cold/clear + hourly index selection) |
| 10 | `.ics` generation | DONE | `src/lib/calendar.test.ts:1-39` (UTC stamps + escape) |
| 11 | AI output schema parsing | DONE | `src/lib/ai/captain-brief.test.ts:1-69` validates via `captainBriefSchema` |
| 12 | Groq fallback paths | PARTIAL | Deterministic fallbacks tested (`captain-brief.test.ts`, `bio-extract.test.ts`, `compat-score.test.ts`) but no test that simulates Groq failure → cache fallback path through `src/lib/ai/cache.ts`. |
| 13 | Price confidence labels | MISSING | `priceConfidence` is set in `src/lib/events.ts:99-296` and `src/lib/chat.ts:108,390,447` but no unit test asserts label transitions. |
| 14 | Event message scope validation | PARTIAL | `src/lib/contracts/chat.test.ts:1-46` validates the contract shapes for `postGroupMessage` and `postEventMessage` separately, but does NOT assert that an event-scoped message cannot leak into the group thread (server-action authorization not unit-tested). |
| 15 | Upload MIME sniff vs extension spoofing | DONE | `src/lib/uploads.test.ts:10-62` (PNG/JPEG/WEBP magic, RIFF/WAVE not WEBP, GIF/PDF/text rejected) |
| 16 | Upload dimension/pixel-bomb rejection | MISSING | `validateImage` (`src/lib/uploads.ts:72-81`) only checks bytes + MIME; no pixel-bomb / dimension cap, and no test for it. Sharp `failOn: "truncated"` is set in `reencodeProfilePhoto` but unit test does not exercise it. |
| 17 | Rate-limit bucket selection: auth | DONE | `auth-rate-limit.test.ts:24-46` |
| 17 | Rate-limit bucket selection: upload | MISSING | No `uploadBucket` helper or test. |
| 17 | Rate-limit bucket selection: AI | MISSING | No `aiBucket` helper or test. |
| 17 | Rate-limit bucket selection: chat | DONE | `auth-rate-limit.test.ts:33-39` (chatUserGroup, chatUserEvent) |
| 17 | Rate-limit bucket selection: demo | MISSING | No `demoBucket` helper or test. |
| 17 | Rate-limit bucket selection: SSE | MISSING | No `sseBucket` helper or test. |

### Integration-test coverage vs spec §4

| Required integration | Verdict |
|---|---|
| signup/login/recovery | MISSING |
| onboarding profile update | MISSING |
| photo metadata save | MISSING |
| upload rejects unsupported MIME / spoof / >5 MB / unsafe dimensions | PARTIAL (covered as unit only for MIME + size; nothing through DB) |
| upload strips metadata, R2 key shape, deletes old object | MISSING |
| availability prompt creation idempotent | MISSING |
| Yes response triggers matching | MISSING |
| group formation respects sport min/max | MISSING |
| simultaneous Yes responses, no duplicate groups | MISSING |
| captain assigned exactly once | PARTIAL (unit-only: `matching-core.test.ts:51-60`) |
| chat message persists | MISSING |
| event-specific chat persists separately from group chat | MISSING |
| in-app notification create + read | MISSING |
| event creation creates attendees | MISSING |
| voting allows one vote per user | MISSING |
| venue search fallback | MISSING |
| demo seed/reset affects only demo-owned rows | MISSING |
| demo reset preserves a sentinel non-demo row | MISSING |
| AI cache returns seeded fallback when Groq unavailable | MISSING (deterministic fallbacks exist as units; cache miss/hit path not tested) |
| GDPR export/delete | MISSING |

**Mocked vs real-DB strategy verdict:** the project follows an "all-unit, no-DB" strategy. Drizzle is imported by `src/lib/health.ts`, `auth-rate-limit.ts`, etc., but every test file exercises pure functions or schemas. There is no test database setup (no `pg-mem`, no Testcontainers, no test-Postgres docker, no `vitest.setup.ts` that boots a DB). `src/tests/stubs/server-only.ts` is the only stub.

### E2E happy-path checklist (spec §5.1)

| Step | Verdict |
|---|---|
| 1. Seed demo users | MISSING |
| 2. Signup as new user | MISSING |
| 3. Complete onboarding | MISSING |
| 4. Use AI bio suggestion | MISSING |
| 5. Answer ShowUpToday Yes | MISSING |
| 6. Match into group | MISSING |
| 7. Confirm participation | MISSING |
| 8. Send chat message | MISSING |
| 9. Create or confirm auto-event | MISSING |
| 10. Send event-specific chat | MISSING |
| 11. Vote on venue/time | MISSING |
| 12. Export calendar file | MISSING |
| 13. Open Judge Mode scoring proof | MISSING |

No Playwright spec exists for any of the above. `playwright.config.ts:4` points at `./src/tests/e2e` which contains no `*.spec.ts`. `pnpm test:e2e` would currently exit with "No tests found".

### Visual QA harness (spec §6)

| Required | Verdict | Evidence |
|---|---|---|
| Screenshot suite covers landing, signup, onboarding bio/sports, today, group, event, notifications, event page, map, settings/profile, Judge Mode | LARGELY DONE | `e2e/visual.spec.ts:33-56` lists 22 routes incl. `landing-en/ro`, `signup`, `onboarding-{profile,sports,location,photo}`, `today`, `groups`, `events`, `events-new`, `notifications`, `map`, `settings`, `demo` (Judge Mode), plus `recover`, `login`, `leaderboard`, `calendar`. Missing dedicated **today matched** vs **today unanswered** distinction (single `today` slug; same screen unauthenticated). |
| Deterministic output | DONE | Fixed viewport list, fixed route list, `device-pixel-ratio: 2`, `waitUntil: "domcontentloaded"` + 800 ms settle, `_review/screenshots/index.json` indexed by slug+viewport (`visual.spec.ts:181-184`). |
| Visual checks: no overlapping text, stable cards, contrast, responsive, logo, Judge Mode rows | PARTIAL | The harness only asserts `status < 500` and zero `pageErrors` (`visual.spec.ts:186-202`); overlap/contrast/Judge-row checks are manual inspection. No axe integration. |

### CI gates (spec §8)

| # | CI step | Verdict | Evidence |
|---|---|---|---|
| 1 | Install with frozen lockfile | DONE | `.github/workflows/ci.yml:24-25` |
| 2 | Lint | DONE (via `pnpm check`) | `package.json:18` |
| 3 | Typecheck | DONE (via `pnpm check`) | `package.json:18` |
| 4 | Unit tests | DONE (via `pnpm check`) | `package.json:18` runs `pnpm test` |
| 5 | Start Postgres service | MISSING | No `services: postgres:` block in `ci.yml`. |
| 6 | Run migrations | MISSING | No `pnpm db:migrate` step. |
| 7 | Integration tests | MISSING | No separate integration job. |
| 8 | Build | DONE (via `pnpm check`) | `package.json:18` |
| 9 | Playwright smoke on built app | MISSING | No `pnpm test:e2e` step in CI. |
| 10 | Axe accessibility smoke | MISSING | No axe dependency, no script. |
| 11 | Lighthouse artifact gate (`/`, `/today`, mobile + desktop) | MISSING | No Lighthouse step. |
| - | Deploy blocked on failing commit | DONE indirectly | Railway deploys on success of `main`; failing `pnpm check` blocks merge to `main`. |

## Test-run result

`pnpm test` (Vitest run, jsdom):

```
Test Files  21 passed (21)
     Tests  91 passed (91)
   Duration 4.21s
```

Exit status 0. No services required.

`pnpm test:e2e` was NOT run because `playwright.config.ts:4` points at an empty `src/tests/e2e` directory - Playwright would report "No tests found" rather than execute the spec §5 happy path.

## Key Findings

- **E2E gap is the largest single risk.** Spec §5.1 ("Happy Path", 13 steps) is the demo's load-bearing proof and there is exactly zero Playwright coverage of it. `playwright.config.ts:4` even points at a directory that doesn't contain specs. AGENTS.md "Testing And Proof" lists the happy path as minimum-before-demo-ready; this is currently unmet.
- **No integration test scaffolding at all.** Spec §4 lists 20 integration scenarios against test Postgres; none exist. There is no test DB harness, no Testcontainers, no `pg-mem`, no `vitest.config.integration.ts`. This means concurrency-sensitive specs (simultaneous Yes responses, captain assigned once across DB rows, demo reset row scoping, GDPR export/delete) have no automated proof.
- **CI is intentionally minimal.** `.github/workflows/ci.yml:1-28` runs only `pnpm check`. None of the 7 missing CI gates from spec §8 (Postgres service, migrations, integration tests, Playwright smoke, axe, Lighthouse) is wired up. The parallel finding from `01-phase0-scaffold-deploy.md:20` ("CI runs `pnpm check` step but does NOT run Playwright, migrate a test DB, or run secret scanning") still holds.
- **Matching algorithm IS unit-tested deterministically (good).** `matching-core.test.ts` covers Haversine, sport+distance grouping, and captain selection with stable tie-breaking - meeting the spec's "deterministic, must be unit tested" demand. Gap: no explicit "1 km matched / 5+ km not matched" boundary case named, and sport-specific min/max group-size rules are not unit-tested in isolation from `formDeterministicGroups`.
- **Visual QA harness is solid and deterministic.** Fixed route × viewport matrix, JSON index, fail-on-pageError. Outside `pnpm test:e2e` so the unit pipeline isn't slowed. Could be extended cheaply with `axe-playwright` for the "axe accessibility smoke" CI gate.
- **Mocked-vs-real-DB strategy = pure unit (no DB).** All 91 passing tests run in `jsdom` against pure functions, contracts, or stubs. The Drizzle DB layer is exercised only at runtime (and via the `/api/health` probe in production). There is no integration safety net.
- **Several spec-listed unit tests are missing or stub-only:** safe redirects, sport-config min/max, dimension/pixel-bomb upload rejection, price-confidence labels, AI cache fallback path, and rate-limit buckets for upload/AI/demo/SSE.
- **Lighthouse evidence not produced anywhere.** No script invokes Lighthouse; no `_review/lighthouse/` directory, no CI artifact upload, no DEMO_COOKIE wiring for the authenticated `/today` run that AGENTS.md insists on.

## Files referenced

- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/docs/specs/09-testing-strategy.md`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/package.json`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/vitest.config.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/playwright.config.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/.github/workflows/ci.yml`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/e2e/visual.spec.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/scripts/visual-qa/run.mjs`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/scripts/visual-qa/playwright.visual.config.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/tests/stubs/server-only.ts` (only file under `src/tests/`)
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/matching-core.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/team-balance.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth-rate-limit.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/uploads.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/calendar.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/weather.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/recovery.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/auth-crypto.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/session.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/health.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/action-result.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/env.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/request-ip.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/contracts/auth.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/contracts/profile.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/contracts/chat.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/contracts/prompt.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/contracts/invite.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/ai/captain-brief.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/ai/bio-extract.test.ts`
- `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/src/lib/ai/compat-score.test.ts`
