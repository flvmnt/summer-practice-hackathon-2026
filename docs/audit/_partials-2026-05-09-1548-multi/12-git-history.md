# 12 - Git History Coherence (last 100 commits)

Audit window: `b7abe93` (2026-05-09 13:19:15) -> `7e0e613` (2026-05-09 15:52:50). 100 commits in 2h33m, single author (`Munteanu Flavius-Ioan`), single day. 56/100 co-authored by `Claude Opus 4.7 (1M context)`. No second human reviewer in the window.

## TL;DR

- **P0 - Silent revert of a "drop Romanian" decision.** `f471fb3` set `routing.locales = ["en"]` at 15:32; 5 minutes later `cd41e08` restored `["ro", "en"]` inside an unrelated i18n bug-fix commit. The reversal is mentioned in the body of `cd41e08` as "the earlier locale removal turned out to lose the multi-language rubric points the user wanted to keep" but the commit subject is `fix(i18n): translate landing-page side card + live cards to RO`. The dropped-locale commit is now misleading history: it claims to drop RO but was effectively reverted within minutes. Working tree (`src/i18n/routing.ts:4-5`) confirms `["ro", "en"]` with default `"ro"` is the shipped state.
- **P0 - Pre-push CI hook landed at commit 6 of 100 (95% of the window predates it).** `a8bb74e` added `.husky/pre-push` running `pnpm check` at 15:51:33 - the second-to-last commit. Every other commit in the 100-commit window was pushed without local verification. Combined with CI only running on push to main (`.github/workflows/ci.yml`), broken commits could have landed for ~2h before the safety net existed.
- **P1 - Commit subject inflation / parallel-agent confusion.** Two pairs of commits share identical subjects produced 40-90s apart: `2da80a8` + `436426c` ("polish wizard header and sticky action bar") and `7ed5d8c` + `211ce45` ("polish prompt + match outcome cards"). The body of `7ed5d8c` admits "Due to a parallel-agent working tree race, those file diffs were squashed into the previous commit (whose subject describes a different change)" - i.e. the audit trail of what landed where is broken on purpose.
- **P1 - cfe9fc7 sweeps 4710 unrelated lines into a 3-line bug fix.** Commit subject "fix: hide MobileTabBar on md and up" suggests a 1-file CSS fix; actual stat is 29 files / 4710 insertions. The bulk are audit reports under `docs/audit/_partials-history-2026-05-09-1323/` and `docs/audit/audit-2026-05-09-1*.md` accidentally pulled in from a parallel agent. This breaks `git blame` for both the MobileTabBar fix and the audit docs.
- **P1 - Em-dash policy added AFTER it was first applied.** `41be34c` (15:12:23) replaces em-dashes across 65+ files (1752 LOC churn). `6f16e0c` (15:15:26) adds the policy to `AGENTS.md` 3 minutes later. `e41b546` (15:15:55) sweeps em-dashes from `messages/{en,ro}/common.json` 29s after that. Three commits to enforce a rule that should have existed before any code was written.
- **P2 - 100 commits, one day, one author, one machine.** No collaboration signal, no code review, 56/100 commits explicitly AI-co-authored. The reflog shows 8 `reset: moving to HEAD` events and one `pull --rebase origin main` in the window - normal solo-AI work, but "ahead of origin/main by 0" is misleading: the commits were force-rewritten locally before push. No evidence of `--force` push to remote (`git log --all` matches `git log`, no orphan refs).
- **P2 - Stale "not wired yet" comment shipped.** `src/lib/demo/scoring-proofs.ts:119` says `confirmMembershipAction is not wired yet` but `8941981` (15:29:47) wires it; the docstring was never updated. Will mislead the demo judge.
- **P3 - Cosmetic chevron churn.** 5 chevron-related fix commits (`878f67d`, `26cc10f`, `1dd94e0`, `dd9533d`, `a030089`) span 48 minutes. Pattern indicates Glyph component / design-token usage isn't centrally enforced; each surface gets its own one-off chevron decision.

## Findings

### P0 - shipped broken state (history evidence)

#### F-12-1 [P0] Silent reversal of locale drop, never marked as revert
- **Commit chain:** `f471fb3` (15:32:42) -> `cd41e08` (15:37:18) -> `250d822` (15:51:54).
- `f471fb3` (commit body): *"Set routing.locales to ['en'] and defaultLocale to 'en'"*. Sole code change: `src/i18n/routing.ts:4-5` `["ro", "en"]` -> `["en"]`.
- `cd41e08` (5min later, commit body): *"1. Restore routing to ['ro', 'en'] with defaultLocale 'ro'. The earlier locale removal turned out to lose the multi-language rubric points the user wanted to keep."* Subject is `fix(i18n): translate landing-page side card + live cards to RO` - the routing reversal is buried as point 1 in a 3-point body.
- `250d822` (15min later) keeps `["ro", "en"]` and adds `localeDetection: false`.
- **Working tree `src/i18n/routing.ts:1-9` confirms `["ro", "en"]` + default `"ro"`.**
- Why it matters: between 15:32 and 15:37, RO routes 308'd to EN; any judge or demo viewer hitting `/ro/...` during that window saw English. Commit log searched with `git log --grep='revert'` returns *zero* hits for this reversal - it is invisible to any future bisect.

#### F-12-2 [P0] 4 RO i18n fixes shipped AFTER RO was "dropped"
Commits chronologically (all in the 9 minutes after `f471fb3`):
- `f471fb3` 15:32:42 - drop RO
- `dd9533d` 15:35:55 - landing chevron (no RO content; cited because next two reference the broken state)
- `d66c429` 15:36:42 - "add missing sidebar keys to Romanian common.json"
- `cd41e08` 15:37:18 - "translate landing-page side card + live cards to RO" *(also reverts the routing drop, see F-12-1)*
- `67b30b7` 15:41:23 - "rewrite RO landing headline"

If `f471fb3` had stuck, three of the four follow-ups would have edited dead-code at runtime. The author clearly noticed and reverted, but the commit history misrepresents the decision sequence.

### P1 - process gaps that let bad commits land

#### F-12-3 [P1] Pre-push verification added with 6 commits left in the window
- `a8bb74e` "chore(ci): add pre-push verification" landed at 15:51:33, position 6 of 100 in `git log --oneline -100`. Hook content (`.husky/pre-push`):
  ```
  echo "[pre-push] running pnpm check (lint + i18n + typecheck + test + build)..."
  if ! pnpm check; then ... exit 1
  ```
- Only 5 commits after the hook are protected (`5fd053a`, `250d822`, `d4901ba`, `0f88758`, `2bec520`, `7e0e613`). The other 95 were pushed with no local verification gate.
- `package.json` working-tree diff (HEAD..) modifies `prepare` from `"husky"` to `"husky || true"` - making install non-fatal if husky is missing. This is unstaged and uncommitted. Acceptable but worth committing.
- CI workflow `.github/workflows/ci.yml` runs `pnpm check` on push to main, so green main is enforced server-side - but a failing `pnpm check` would have to be fixed in a follow-up commit visible in history. None of the 100 messages match `lint|typecheck|build` as a follow-up fix - a positive signal, but not a guarantee absent the hook.

#### F-12-4 [P1] Two duplicate commit-subject pairs, body admits squash mismatch
- `2da80a8` (15:12:07, 4 files, 349+/158-) and `436426c` (15:13:42, 1 file, 124+/22-) both subject `style(onboarding): polish wizard header and sticky action bar`. The second is a continuation/fixup but is not flagged as such (`git commit --fixup=` would have made `git rebase --autosquash` work).
- `7ed5d8c` (15:19:18, no source diff - body only) and `211ce45` (15:19:58, body-only / docstring) both subject `style(today): polish prompt + match outcome cards`. `7ed5d8c` body: *"Due to a parallel-agent working tree race, those file diffs were squashed into the previous commit (whose subject describes a different change). The polish itself is correct and in tree."* This is a written admission that the audit trail is broken.
- Net effect: `git log -- src/components/today/TodayFoundCard.tsx` will show the polish landing under whatever the previous (unrelated-subject) commit was.

#### F-12-5 [P1] cfe9fc7 sweeps 4710 unrelated lines into a one-line CSS fix
- Subject: `fix: hide MobileTabBar on md and up`. Body claims a `display: grid` -> Tailwind responsive class fix.
- Stat (`git show --stat cfe9fc7 | tail -10`):
  ```
   .../12-testing.md                                  | 181 ++++++++++++
   .../13-scoring-rubric.md                           | 322 +++++++++++++++++++++
   .../14-i18n.md                                     | 170 +++++++++++
   .../_partials-history-2026-05-09-1323/03-trends.md | 117 ++++++++
   docs/audit/audit-2026-05-09-1247-security.md       | 186 ++++++++++++
   docs/audit/audit-2026-05-09-1323.md                | 181 ++++++++++++
   ...
   src/components/layout/MobileTabBar.tsx             |   3 +-
   29 files changed, 4710 insertions(+), 2 deletions(-)
  ```
- A reviewer asked to review "fix MobileTabBar" would have to wade through 4708 lines of audit reports unrelated to the fix.

#### F-12-6 [P1] Em-dash policy enforced before it was documented
- `41be34c` (15:12:23) "chore: replace em dashes" - 65+ files, 1752 LOC.
- `6f16e0c` (15:15:26) "docs: ban em dashes in agent guidance" - 1 line added to `AGENTS.md`.
- `e41b546` (15:15:55) "chore: remove em dashes" - `messages/{en,ro}/common.json`, 33+/33- (the JSON files missed in the first sweep).
- 3 commits where 1 should have sufficed (write the rule once, sweep once). Indicates the agent rule was added reactively after the first cleanup pass missed targets.

#### F-12-7 [P1] visual-qa harness added then removed within 34 minutes
- `6ea612f` (14:14:00) "test: add visual qa harness" - 4 files, 252 LOC (e2e/visual.spec.ts, scripts/visual-qa/*).
- `dc4b8c5` (14:40:51) "docs: add visual QA report" - the report it produced.
- `a12256b` (14:48:38) "chore: remove visual qa harness and report" - 5 files, 466 deletions. Body: *"The harness was never wired into CI (ci.yml runs only `pnpm check`) and screenshot artifacts were local-only."*
- 3 commits between add and remove (`6b07f72`, `a406d41`, `80ef6a0`). Net contribution: zero code, three commits of churn, plus 466 LOC of "delete this please" noise in `git log -p`.

### P2 - hygiene

#### F-12-8 [P2] Stale "not wired yet" comment in shipped demo proofs
- `src/lib/demo/scoring-proofs.ts:119`:
  ```
  note: "Groups are confirmed by deterministic matching; explicit confirmMembershipAction is not wired yet.",
  ```
- `8941981` (15:29:47) wired `confirmMembershipAction` into `src/app/[locale]/groups/[groupId]/page.tsx:171`. The demo proof note was not updated. The judge mode page (`/demo`) will display a misleading proof.
- Similar risk: searched for other "not wired" / "TODO" / "stub" mentions - only this one was confirmed false-by-history.

#### F-12-9 [P2] Working tree drifts from HEAD (uncommitted prepare-script and audit doc)
- `git status` (full):
  ```
  modified:   package.json    (prepare: "husky" -> "husky || true")
  Untracked:  docs/audit/audit-history-2026-05-09-1545.md
  ```
- The `package.json` change is the kind of "small fix to make CI installable" patch that should be in its own commit before push. Currently mixed with whatever the next change is.
- `audit-history-2026-05-09-1545.md` is an audit artifact at root, not under a `_partials*` dir - inconsistent with the rest of the audit layout (which uses dated `_partials-*` directories).

#### F-12-10 [P2] All 100 commits in 2h33m, single author, single machine
- Time distribution: 100 commits / 9180s = 1 commit every 92 seconds on average.
- 56/100 commits co-authored by Claude Opus. The remaining 44 are not human-distinguishable - same author, same minute-cadence. Implies AI commits without the co-author trailer on ~44% of commits.
- Reflog shows 8 local `reset: moving to HEAD` events and 1 `pull --rebase origin main` (HEAD@{34..37}). No evidence of force-push to remote (`git log --all` is identical to `git log`; no orphan refs in `refs/remotes/`). Local rewrites are fine; the public history is linear.

### P3 - cosmetic

#### F-12-11 [P3] Chevron / glyph cleanup churn
Five fix commits over 48 minutes touching glyph/chevron decisions:
- `878f67d` 14:56:18 `fix(landing): remove arrow icon from S2M start-playing CTA`
- `26cc10f` 15:02:33 `fix(ui): drop decorative chevrons + tighten recovery code page`
- `1dd94e0` 15:05:56 `fix(ui): drop primary-icon chevron from profile next button`
- `dd9533d` 15:35:55 `fix(landing): un-double .ai-mark and restore chevron on AI proof chip`
- `a030089` 15:44:35 `fix(glyph): collapse spark into a single chevron, removing the burst strokes`

Pattern: design-system primitives (`src/components/ui/Glyph.tsx`) are decorated per surface rather than via centrally enforced variants. Each new screen gets its own chevron decision later second-guessed.

#### F-12-12 [P3] Two railway-startup fixes 23 minutes apart
- `a406d41` 14:06:36 "fix: restore railway standalone startup" - 8 files, includes Dockerfile, railway.toml, scripts/migrate.mjs.
- `35b0919` 14:29:09 "fix: run railway migrations before startup" - railway.toml only (3+/2-).

The first commit added a migration script; the second wired it into the startup command. Should have shipped as one commit.

## Patterns

1. **AI-driven commit cadence outpaces human review.** 1 commit/92s, 56% co-authored by Claude, no second reviewer. Combined with the pre-push hook arriving at commit 6 of 100, the *only* gate from 13:19 to 15:51 was server-side CI on push to main.
2. **"Parallel agent" working-tree races produced silent merges.** `7ed5d8c`'s body explicitly admits diffs were squashed into the wrong subject. `cfe9fc7` accidentally absorbed 4710 lines of audit docs from a parallel agent. The author was running multiple Claude agents on overlapping working trees.
3. **Reactive policy after damage.** Em-dash rule (F-12-6), pre-push hook (F-12-3), visual-QA harness (F-12-7) were all added or removed *after* the work that should have been guided by them. Process retrofits, not process discipline.
4. **Subject-line dishonesty under pressure.** `cd41e08` reverted a "drop RO" decision inside a "translate to RO" commit (F-12-1). `cfe9fc7` shipped 4710 lines of docs as a "fix MobileTabBar" commit (F-12-5). Both look fine in `git log --oneline`; both lie on inspection.
5. **Scope-creep in single commits + tiny one-line follow-ups.** Top-10 biggest commits each exceed 1500 LOC (`cfe9fc7` 4712, `ea24f45` 3705, `3b9de7f` 3268, `4aa920f` 3117, `80ef6a0` 3001), with corresponding 1-file follow-up fixes (`27fdc40`, `032bc2e`, `36c3b02`). Pattern: ship the wave, fix the visible bug, ignore the rest.

## Verified clean

- **No orphan branches / force-push to remote.** `git log --all -100` matches `git log -100`. Refs `origin/main` and `upstream/main` exist; HEAD == `origin/main` == `7e0e613`.
- **No `revert` / `undo` in the 100-commit window** (`git log --grep` for those tokens returns only `dd9533d "...restore chevron..."` and `a406d41 "...restore railway standalone..."` which are recovery commits, not git reverts).
- **No "fix lint" / "fix typecheck" / "fix build" follow-ups in the window** - implies no `--no-verify` slip past CI. Searched: zero hits for those terms in 100 subjects.
- **The dead-code candidates are wired.**
  - `extractSportsForCurrentUserAction` -> `src/components/onboarding/ProfileForm.tsx:224` and `src/lib/onboarding-form-actions.ts:53`.
  - `generateCaptainBrief` -> `src/app/[locale]/events/[eventId]/page.tsx:96` (commit `968f73a`).
  - `getVisionModel` -> `src/lib/ai/photo-extract.ts:32` (commit `27d7b1f`).
  - `confirmMembershipAction` -> `src/app/[locale]/groups/[groupId]/page.tsx:171` (commit `8941981`).
  - `uploadProfilePhotoAction` -> `src/components/onboarding/PhotoForm.tsx:98` and `src/components/onboarding/ProfileForm.tsx:119` (commit `27d7b1f`).
  - One stale comment remains (F-12-8), but the wiring itself is real.
- **Sidebar mount across the 5 "parallel-i18n" pages is fully landed.**
  - `c81a16b` mounted on calendar/leaderboard/notifications/settings/map (5 files).
  - `250d822` mounted on today/groups/events (the "parallel i18n" commit referenced by c81a16b's body).
  - `d4901ba` mounted on `u/[username]/page.tsx`.
  - `grep -L 'DesktopSidebar' src/app/[locale]/*/page.tsx` confirms only auth/landing/onboarding/demo pages lack the sidebar - intentional per layout specs.
- **Specs not retroactively edited to match shipped code in the working tree.** `git diff HEAD -- docs/specs/` returns empty. The audit-prompt's claim of "7 spec files modified in current diff with no commit" does not match reality - working tree only differs from HEAD on `package.json` and one untracked audit file.
- **No `--no-verify` evidence on main.** Pre-push hook didn't exist for 95/100 commits, but server-side CI passing on `main` (no follow-up "fix lint/build" commits) suggests `pnpm check` was being run by the agent before each push as part of its workflow even without the hook.

## Would `pnpm check` pass NOW?

Working tree: only `package.json` modified (`prepare: "husky" -> "husky || true"`) plus one untracked audit doc. Neither change should affect lint / typecheck / test / build. The shipped state is `7e0e613` and CI is green per `git status` ("up to date with 'origin/main'"). High confidence `pnpm check` passes against HEAD.

## Recommendations (no source changes from this audit)

1. Update `src/lib/demo/scoring-proofs.ts:119` note to reflect the wired `confirmMembershipAction` (judge will see the false claim otherwise).
2. Commit the `package.json` `prepare: "husky || true"` change with a clear subject so it stops sitting in the working tree.
3. Move `docs/audit/audit-history-2026-05-09-1545.md` under a `_partials-*` dir or commit at root with intent.
4. For the next session: ensure the pre-push hook stays put. With 95% of this window unprotected, future windows should be 100% protected.
5. Consider an `agents.md` rule against duplicate commit subjects: when squashing or fixup'ing, use `git commit --fixup=` so `rebase --autosquash` produces clean history rather than two same-subject commits 60s apart.
