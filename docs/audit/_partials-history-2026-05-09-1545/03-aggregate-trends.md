# 03 - Aggregate Trends & Security Timeline

**Window:** `2553446` (2026-05-08 13:59) → `8cbf7d5` (2026-05-09 15:46)
**Total commits on HEAD:** 127 (brief stated 125; verified `git rev-list --count HEAD` = 127. HEAD at audit time is `8cbf7d5 feat(layout): add DesktopSidebar component`, two commits past the brief's `a030089`. Tables below cover all 127.)
**Read-only.** No edits outside this partial. No git mutations.

---

## 1. Velocity

Commits bucketed by local hour (Europe/Bucharest, UTC+3). Net lines = additions - deletions across all hunks in that hour. Top dirs are the 2-segment paths (`<top>/<2nd>`) most touched in that hour, with file-touch counts in parens.

| Hour bucket (local) | Commits | Net lines | Top 3 dirs |
|---|---|---|---|
| 2026-05-08 13:00 | 1 | +1 | `README.md (1)` |
| 2026-05-08 14:00 | 1 | +4 | `README.md (1)` |
| 2026-05-09 09:00 | 1 | +253 | `README.md (1)` |
| 2026-05-09 10:00 | 1 | +3,187 | `docs/specs (16)` |
| 2026-05-09 11:00 | 9 | +11,634 | `src/lib (28)`, `docs/specs (18)`, `src/app (14)` |
| 2026-05-09 12:00 | 17 | +9,388 | `src/lib (44)`, `src/app (15)`, `src/components (13)` |
| **2026-05-09 13:00** | **24** | **+32,493** | `src/components (92)`, `src/lib (39)`, `src/app (35)` |
| 2026-05-09 14:00 | 34 | +12,347 | `src/app (36)`, `src/components (28)`, `docs/audit (28)` |
| 2026-05-09 15:00 | 39 | +4,280 | `src/components (109)`, `src/app (55)`, `docs/audit (26)` |

**Highest commit count:** the 15:00 hour (39 commits), but most are small polish/i18n/style commits — net only +4,280 lines.
**Highest line-velocity:** the **13:00 hour** with **+32,493 net lines** in 24 commits — this bucket includes the big-bang feature drops (`feat: rebuild today...`, `feat: rebuild auth flow...`, `feat: rebuild group screen...`, `feat: rebuild event screen...`, `feat: add venue candidates and voting`). This is the de facto peak velocity hour and the hour where most of the demo-critical surface area was cut.

---

## 2. Concentration (full 127-commit history)

`git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20`:

| Rank | Commits touching | File |
|---|---|---|
| 1 | 30 | `messages/ro/common.json` |
| 2 | 28 | `messages/en/common.json` |
| 3 | 11 | `src/db/schema.ts` |
| 4 | 11 | `src/app/[locale]/groups/[groupId]/page.tsx` |
| 5 | 10 | `src/app/[locale]/today/page.tsx` |
| 6 | 10 | `drizzle/meta/_journal.json` |
| 7 | 9  | `src/lib/chat.ts` |
| 8 | 8  | `src/components/onboarding/ProfileForm.tsx` |
| 9 | 8  | `src/app/[locale]/events/[eventId]/page.tsx` |
| 10 | 7 | `src/components/onboarding/SportsForm.tsx` |
| 11 | 7 | `src/components/landing/Hero.tsx` |
| 12 | 7 | `src/app/[locale]/settings/page.tsx` |
| 13 | 6 | `src/components/auth/RecoverForm.tsx` |
| 14 | 6 | `src/app/layout.tsx` |
| 15 | 6 | `src/app/globals.css` |
| 16 | 6 | `src/app/[locale]/demo/page.tsx` |
| 17 | 6 | `README.md` |
| 18 | 5 | `src/lib/events.ts` |
| 19 | 5 | `src/lib/auth-rate-limit.ts` |
| 20 | 5 | `src/components/ui/Glyph.tsx` |

### Over-churned (instability signal)

- **`messages/{ro,en}/common.json` — 30 / 28 commits.** Almost every i18n key has been rewritten at least once. A high-churn copy file at this stage is a **demo-fragility risk**: any uncommitted RO/EN drift will surface as missing keys at runtime under `next-intl`. Both are dirty in the worktree (see §6).
- **`src/db/schema.ts` — 11 commits.** Schema is still mutating late in the run. Combined with `drizzle/meta/_journal.json` (10 commits = 5 generated migrations), the data model is the single most-revised technical contract.
- **`src/app/[locale]/groups/[groupId]/page.tsx` — 11 commits.** The group detail page absorbed 8 features (chat, captain, vote, invite, RSVP, members list, formation timeline, mobile tabs). Largest single page surface; also dirty in the worktree. Cyclomatic risk.
- **`src/lib/chat.ts` — 9 commits.** Persisted-chat core got group, event-scope, smoke, hardening, achievement, notification, and unread-count wiring. Boundary file.
- **`src/components/onboarding/ProfileForm.tsx` — 8 commits.** Onboarding flow was refactored late (location merge, photo merge, slider rebuild, idle/error states). Dirty in the worktree.
- **`src/lib/auth-rate-limit.ts` — 5 commits.** Auth rate-limit infra churned through 5 iterations on the way to production-grade.

### Under-churned (areas that may not exist or are demo-safe-and-frozen)

- **No file under `src/app/api/` outside `health` / `events/[eventId]/ics`** appears in the top 20. The lack of churn on any SSE/streaming endpoint is consistent with §3's stagnation finding that real-time SSE is unimplemented.
- **No `src/lib/strava*` or `src/lib/wearables*` exists at all.** Confirms wearables row was never started (correctly so, per AGENTS.md decision).
- **No file under `src/server/actions/`** in the top 20 (the directory is empty/non-existent — server actions live inline under `src/lib/*.ts`). This is a structural drift from `docs/specs/01-architecture.md` which specifies `src/server/actions/` as the canonical home.

---

## 3. Stagnation (rubric coverage map vs commit history)

Cross-referenced against `docs/specs/13-scoring-coverage.md`. For each rubric row I searched commit messages and touched paths; rows below are flagged **NO-COMMIT** when no commit plausibly implements them. Top 5 stagnant rows:

| Rank | Rubric row | Spec section | Status | What the row needs |
|---|---|---|---|---|
| **1** | **Wearables/fitness integrations (Strava)** | `docs/specs/13-scoring-coverage.md` §7 Bonus Features | **NO-COMMIT** | No `src/lib/strava*`, no Strava OAuth route, no labeled fixture. Per AGENTS.md "Locked Decisions", Strava scores 0 unless real OAuth/import or accepted fixture is visible. Currently scores 0. To claim points: add Strava OAuth callback or a clearly labeled accepted fixture surfaced on the profile/group screen. |
| **2** | **Real-time updates (SSE streams for chat/prompt/votes)** | `docs/specs/13-scoring-coverage.md` §5 Communication | **NO-COMMIT** | No `app/api/**/stream/route.ts`, no `EventSource`/`ReadableStream` consumer in `src/components/**`. The only `sse|stream` matches in source are stale strings inside `src/lib/demo/scoring-proofs.ts` and `src/lib/ai/bio-extract.ts`. Spec demands "two-browser message appears within 2s" — currently impossible without polling fallback. To claim points: add SSE route per surface (chat, prompt, votes) with persisted-state replay and a polling client fallback. |
| **3** | **Notifications/reminders — in-app SSE reminder + email if configured** | `docs/specs/13-scoring-coverage.md` §5 Communication | **PARTIAL** | `80ef6a0 feat(notifications): add table, lib, and server actions` and `7a4772b feat: add notifications inbox and header bell` ship the persistent inbox half. The SSE reminder half and the optional email half are not in any commit. `27fdc40 fix(settings): remove Email reminders section` actively removed the email surface. Currently scores partial. To claim full points: add SSE reminder push for prompt windows (or wire a Resend reminder behind `RESEND_API_KEY`). |
| **4** | **Smart teammate recommendations — invite drawer with ranked candidates** | `docs/specs/13-scoring-coverage.md` §4 AI/Smart Enhancements | **NO-COMMIT** | No commit message contains "teammate"/"recommend"/"invite drawer with suggestions". `5d9fe0c feat(match): add confirm/decline membership server actions` and `8317fc3 feat(invite): public preview page` cover invite *links* and confirmation, but neither produces a *ranked candidate list*. To claim points: add `src/lib/candidate-ranking.ts` (deterministic) + an invite drawer in `GroupTabs.tsx` showing ranked suggestions with score reasons. |
| **5** | **Group voting/polling system — captain manual decision fallback** | `docs/specs/13-scoring-coverage.md` §6 Event & Location Coordination | **PARTIAL** | `b5881f4 feat: rebuild event screen with tabs vote and captain reveal`, `c611e17 feat: add venue candidates and voting`, and `01f99a2 fix(event): externalize VoteCard copy and announce vote updates` deliver live voting. The "captain can decide manually" fallback path (rubric explicitly lists this as the fallback column) has no dedicated commit; need a captain-only force-decision action with audit trail. |

Two additional **PARTIAL but ship-blocking** rows surfaced during the search and are worth flagging even though they don't make the top 5 strict NO-COMMIT list:

- **Web push** is correctly skipped per AGENTS.md ("Web Push is stretch only; web app first, not PWA"). No action needed.
- **Group-size aware matching** (`min/ideal/max` per sport) — only `da84ff4` and `7be52fd` (compatibility scoring + captain brief) plausibly touch sport-config awareness. No dedicated commit re-confirms football forms 10-14 / tennis 2-4. Spec section: `docs/specs/13-scoring-coverage.md` §3 Smart Matching. Worth a Playwright assertion before the demo.

---

## 4. Health curve (chronological quartiles)

127 commits split into 4 buckets (sizes 31/31/31/34, oldest first). Grade proxy: 0-10 score from commit-message clarity (conventional prefix, length, vague-word penalty) and commit size (large + vague = worse). See methodology block at end.

| Quartile | Range | n | Avg grade | Avg lines/commit | Span |
|---|---|---|---|---|---|
| Q1 | `2553446` → `6eaf47f` | 31 | **6.23** | 917 | 2026-05-08 13:59 → 2026-05-09 13:04 |
| Q2 | `c611e17` → `4feee63` | 31 | **6.34** | 1,161 | 2026-05-09 13:09 → 2026-05-09 14:05 |
| Q3 | `5d9fe0c` → `2da80a8` | 31 | **6.42** | 519 | 2026-05-09 14:05 → 2026-05-09 15:12 |
| Q4 | `41be34c` → `8cbf7d5` | 34 | **6.46** | 227 | 2026-05-09 15:12 → 2026-05-09 15:46 |

**Trend line: gently improving.** Average grade rises monotonically Q1→Q4 (+0.23) while average commit size collapses 4× (917 → 227 lines). The interpretation is that the project moved from **big-bang scaffolding** (Q1: `feat: rebuild today...`, `feat: rebuild auth flow...`) to **disciplined polish** (Q4: `chore: replace em dashes`, `fix(glyph): collapse spark...`, `style(...)`). This is the right shape going into demo, with one caveat: Q4 is dominated by `style(...)` and `fix(i18n): ...` commits — meaning the team is rearranging deck chairs while §3 stagnant rows (SSE, Strava, ranked recommendations) remain unimplemented. **Improving form, plateauing scope.**

Methodology: `score = 5 + 1.5*has_conventional_prefix - 0.5*(len>80) - 1.0*(len<15) - 1.5*has_vague_word - 2.0*(size>2000 AND vague) - 0.5*(size>2000 AND clear) - 1.0*(size>500 AND no_prefix) - 0.3*(size<5)`, clamped to [0, 10]. Vague words: `misc|stuff|wip|fix things`. Polish/cleanup are not penalized as vague.

---

## 5. Security timeline

Commits touching any of: `src/lib/auth*`, `src/lib/session*`, `src/db/schema.ts` (user/session columns), `next.config.ts` (CSP/headers), `src/middleware*`, `src/proxy*`, `.env.example`. Cross-referenced against the `2026-05-09 12:47` security audit's pre-deploy fix list (`docs/audit/audit-2026-05-09-1247-security.md` §2).

| SHA | Time | Action | Finding ref |
|---|---|---|---|
| `e0e9cdd` | 11:44 | INTRODUCED `next.config.ts` with header scaffold (X-Frame, Referrer, Permissions). No CSP/HSTS yet. | A05 baseline (CSP/HSTS gap born here) |
| `de52db9` | 11:49 | INTRODUCED user/session columns in `src/db/schema.ts`. | A07 baseline |
| `dab0665` | 11:49 | INTRODUCED `src/lib/auth.ts` + auth primitives (bcryptjs, iron-session). Bcrypt cost initially **10**. | A07 baseline (bcrypt 10 finding born here) |
| `e789d99` | 11:52 | INTRODUCED `src/lib/auth-rate-limit.ts` store (signup/login/recover only). | A04 baseline (covers 60% of mandated surfaces) |
| `c6664d7` | 11:57 | INTRODUCED auth server actions wired to schema + rate-limit. | A07 (foundation) |
| `bbb286d` | 12:04 | INTRODUCED auth entry pages (login/signup/recover) calling server actions. | A07 (foundation) |
| `dfda72c` | 12:08 | INTRODUCED profile onboarding form (touches schema). | A01 — onboarding mutate-before-ban-check pattern lands here |
| `3858f6d` | 12:17 | INTRODUCED today prompt response action (touches schema). | A04 — prompt-response unguarded by rate-limit |
| `e5e22d1` | 12:26 | INTRODUCED deterministic matching loop (touches schema, advisory locks). | A04 — match formation unguarded |
| `808cbcf` | 12:29 | RESOLVED (partial) Codex C1 session-revoke via `userUpdatedAt` comparison; also fixed `x-forwarded-for` rightmost-valid-IP per A07. | A07 (partial-resolve) |
| `2f79714` | 12:39 | INTRODUCED persisted group chat (touches schema). | A04 — chat-send rate-limit added concurrently |
| `c51af96` | 12:55 | RESOLVED hardening of production chat smoke (touches `src/lib/chat.ts` and schema). | A04 (chat-send 20/60s lands) |
| `b3c6645` | 12:59 | **RESOLVED** A07 finding #1: bcrypt cost **10 → 12** + dummy-hash refresh. | A07 (top pre-deploy fix) |
| `027db43` | 12:59 | **RESOLVED** A05/A02 finding #2-3: CSP **and** HSTS added to `next.config.ts`. | A05 + A02 |
| `5a0afeb` | 12:59 | **RESOLVED** A01 finding #5: `requireUser`/`requireAdmin` helpers added. | A01 (code-quality) |
| `6eaf47f` | 13:04 | INTRODUCED event creation + event chat (schema growth). No new auth concern; rate-limit not extended. | A04 (event-chat send unrated) |
| `c611e17` | 13:09 | INTRODUCED venue candidates and voting (schema growth). | A04 (vote endpoint unrated) |
| `b7abe93` | 13:19 | INTRODUCED `ai_cache` table (schema). Storage of AI outputs — verify nothing privacy-sensitive cached unredacted. | A09 watch-item (no regression observed) |
| `4aa920f` | 13:41 | INTRODUCED event invite links (schema: invite tokens). Tokens need entropy review. | A07 follow-up |
| `bacf976` | 13:49 | INTRODUCED first-match achievement (schema growth). | None |
| `80ef6a0` | 14:05 | INTRODUCED notifications table + lib + actions (schema growth). | None |
| `4879a1d` | 14:41 | RESOLVED `src/proxy.ts` regression: strip internal port from `next-intl` redirect locations. Was a host-header / open-redirect-shaped concern. | A01 / A05 (header-handling fix) |
| `df3b42a` | 14:56 | RESOLVED A02 follow-up #7: `.env.example` documents required env vars + local setup. Does not enforce in `src/lib/env.ts` yet. | A02 (partial — schema not tightened) |
| `41be34c` | 15:12 | NEUTRAL: em-dash replacement across many files including `src/lib/auth.ts`, `next.config.ts`. Pure formatting; no logic delta. | None |

**Security trend: improving, near plateau.** Five of the six top-priority OWASP findings from the 12:47 security audit were resolved within 12 minutes of that audit (the 12:59 fix triplet `b3c6645`/`027db43`/`5a0afeb` plus the partial 808cbcf earlier and 4879a1d later). The composite grade has moved from B (audit time) toward A−. **Open items still tracking:**
- A04 onboarding/prompt-response/match-formation rate-limit gaps — no commit addresses these explicitly; coverage is still ~60%.
- A02 env-validation tightening (`src/lib/env.ts` `.optional()` → `.required()` in production) — `df3b42a` documented but did not enforce.
- A01 mutate-before-ban-check ordering in `src/lib/onboarding.ts` — no commit message indicates this was reordered. Worth a follow-up grep.
- A07 explicit session-id rotation on recovery — still partial via `userUpdatedAt`.

No commit in the window **regressed** a prior security fix. The two near-misses (`4879a1d` next-intl port strip; `41be34c` em-dash edit of `auth.ts` and `next.config.ts`) were fixes / pure formatting respectively.

---

## 6. Forward-looking dirty-worktree risk

`git status --short` reports 47 dirty paths (42 modified tracked, 5 untracked). Per the brief, file contents are not inspected; mapping below pairs each dirty file to the commit(s) whose work it most plausibly regresses. Top 3 risk pairs at the bottom.

### Modified (M) tracked files — mapped to last-touch commit

| Dirty path | Last-touch commit | What that commit shipped |
|---|---|---|
| `docs/specs/01-architecture.md` | `41be34c` | em-dash replace (formatting only) |
| `docs/specs/02-data-model.md` | `41be34c` | em-dash replace |
| `docs/specs/05-ai-features.md` | `7e36f06` | planning canon refresh |
| `docs/specs/09-testing-strategy.md` | `7e36f06` | planning canon refresh |
| `docs/specs/10-prod-readiness.md` | `7e36f06` | planning canon refresh |
| `docs/specs/11-deployment-railway.md` | `7e36f06` | planning canon refresh |
| `docs/specs/12-implementation-plan.md` | `7e36f06` | planning canon refresh |
| `messages/en/common.json` | `fb9a3a2` | demo seed control tightening |
| `messages/ro/common.json` | `67b30b7` | RO landing headline rewrite |
| `package.json` | `a4c1cee` | merge photo into onboarding profile |
| `pnpm-lock.yaml` | `a4c1cee` | merge photo into onboarding profile |
| `src/app/[locale]/demo/scripted/route.ts` | `e893438` | scripted demo entry route |
| `src/app/[locale]/events/[eventId]/page.tsx` | `d1945e7` | persist event RSVP state |
| `src/app/[locale]/events/new/page.tsx` | `f1c7d95` | manual event creation backend |
| `src/app/[locale]/events/page.tsx` | `0564fd8` | unread counts + map labels |
| `src/app/[locale]/groups/[groupId]/page.tsx` | `8941981` | confirm/decline buttons for invited members |
| `src/app/[locale]/groups/page.tsx` | `0564fd8` | unread counts + map labels |
| `src/app/[locale]/not-found.tsx` | `27d7b1f` | photo upload + AI vision |
| `src/app/[locale]/onboarding/location/page.tsx` | `a4c1cee` | merge photo into onboarding profile |
| `src/app/[locale]/onboarding/photo/page.tsx` | `a4c1cee` | merge photo into onboarding profile |
| `src/app/[locale]/today/page.tsx` | `0564fd8` | unread counts + map labels |
| `src/app/[locale]/u/[username]/page.tsx` | `0564fd8` | unread counts + map labels |
| `src/app/api/events/[eventId]/ics/route.ts` | `d1945e7` | persist event RSVP state (calendar export coupling) |
| `src/components/group/GroupChatForm.tsx` | `5f2f212` | rebuild group screen with mobile tabs + captain |
| `src/components/group/GroupMembersList.tsx` | `5f2f212` | rebuild group screen with mobile tabs + captain |
| `src/components/group/GroupTabs.tsx` | `5f2f212` | rebuild group screen with mobile tabs + captain |
| `src/components/layout/HeaderBell.tsx` | `41be34c` | em-dash replace |
| `src/components/layout/MobileTabBar.tsx` | `d01811a` | localize landing + shell polish |
| `src/components/onboarding/LocationForm.tsx` | `a4c1cee` | merge photo into onboarding profile |
| `src/components/onboarding/PhotoForm.tsx` | `e03a84f` | polish PhotoForm idle/skip states |
| `src/components/onboarding/ProfileForm.tsx` | `a4c1cee` | merge photo into onboarding profile |
| `src/components/onboarding/SetupBanner.tsx` | `a4c1cee` | merge photo into onboarding profile |
| `src/components/profile/MatchPercentPanel.tsx` | `e26817e` | JSDoc correction |
| `src/components/today/TodayPromptCard.tsx` | `e03a84f` | polish PhotoForm idle/skip states |
| `src/components/today/TodaySearching.tsx` | `e03a84f` | polish PhotoForm idle/skip states |
| `src/i18n/routing.ts` | `cd41e08` | translate landing-page side card to RO |
| `src/lib/ai/cache.ts` | `1c5395a` | Groq client + ai_cache helper |
| `src/lib/ai/photo-extract.ts` | `39d1b0e` | polish FormationTimeline copy |
| **`src/lib/auth.ts`** | **`808cbcf`** | **harden auth session lifecycle (Codex C1 partial fix)** |
| `src/lib/demo/scoring-proofs.ts` | `fb9a3a2` | demo seed control tightening |
| `src/lib/groq.ts` | `a4c1cee` | merge photo into onboarding profile |
| `src/lib/profile-public.ts` | `ea24f45` | wire remaining demo surfaces |

### Untracked (??)

| Path | Risk note |
|---|---|
| `.husky/` | Pre-commit hooks would activate on next `git add`. AGENTS.md allows Husky if it stays fast; verify before committing — could change the hook contract. |
| `docs/audit/_partials-history-2026-05-09-1545/` | This audit's own output. No regression risk. |
| `docs/audit/audit-2026-05-09-1432-full.md` | Prior audit referenced in the brief but not committed. No regression risk. |
| `src/app/[locale]/demo/step/` | New demo-step route, undeclared. Could shadow the scripted demo entry from `e893438` if route collision. |
| `src/lib/demo/walkthrough.ts` | New demo walkthrough lib. Couples to `src/lib/demo/scoring-proofs.ts` which is also dirty. |

### Top 3 regression risk pairs

1. **`src/lib/auth.ts` may regress `808cbcf` (harden auth session lifecycle).** This is the single highest-value security commit in the entire window — it implements the `userUpdatedAt` session-revocation path and the `x-forwarded-for` rightmost-valid-IP fix from the 12:47 audit. Any uncommitted edit to `auth.ts` could silently undo Codex C1's partial fix. The 12:47 security audit explicitly notes this code path. **Highest priority to inspect/commit/revert.**
2. **`src/app/[locale]/groups/[groupId]/page.tsx` + `GroupTabs.tsx` + `GroupMembersList.tsx` + `GroupChatForm.tsx` may regress `5f2f212` (rebuild group screen with mobile tabs and captain panel) and `8941981` (confirm/decline buttons for invited members).** The group detail page is the #4 most-churned file overall and four of its sibling components are simultaneously dirty — the Plan/Chat/Players mobile-tab contract from AGENTS.md "UX Rules" could regress in any direction. This is also the primary surface for the §3 Stagnation #4 row (smart teammate recommendations).
3. **`messages/{ro,en}/common.json` may regress `67b30b7` (RO landing headline rewrite) and `fb9a3a2` (demo seed control tightening) and the entire i18n key set.** With 30/28 commit churn already, the dirty state guarantees at least one in-flight key edit; missing keys at runtime under `next-intl` will surface as raw key strings on the landing page (the highest-stakes demo surface). Combined with `src/i18n/routing.ts` also dirty, the locale pipeline itself is in an uncommitted state.

Honourable mentions: `src/lib/demo/scoring-proofs.ts` is dirty and pairs with the new untracked `src/lib/demo/walkthrough.ts` — Judge Mode coverage could regress. `package.json` + `pnpm-lock.yaml` dirty after `a4c1cee` means a dep change is in flight; lockfile drift would break Railway's `pnpm install --frozen-lockfile`.

---

## Methodology / data sources

- Commit set: `git log --pretty=format:"%H|%ai|%s"` (127 commits).
- Velocity: `git log --pretty=format:"COMMIT|%H|%ai" --numstat` aggregated by `substr(date,1,13)`.
- Concentration: `git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -30`.
- Stagnation: per-row `git log --grep="<row-keyword>"` and `git log -- <expected-path>` cross-referenced with `docs/specs/13-scoring-coverage.md`.
- Quartile grade: Python heuristic on commit subject + `--shortstat` size, formula in §4.
- Security timeline: `git log -- src/lib/auth* src/lib/session* src/db/schema.ts next.config.ts src/middleware* src/proxy* .env.example`, cross-referenced against `docs/audit/audit-2026-05-09-1247-security.md` §2.
- Dirty paths: `git status --short` (file contents not inspected per brief constraint).
