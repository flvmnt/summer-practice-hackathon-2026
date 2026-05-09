# Per-commit grading — chronological

Repo root: `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026`. 126 commits from `2553446` (2026-05-08 13:59) to HEAD `e893438` (2026-05-09 15:45). Brief noted in task said HEAD was `a030089` (which is the second-to-last); the actual HEAD includes one more commit (`e893438`), so 126 rows below.

| SHA | Time | Type | Subject | Spec ref | Grade | Flags |
|---|---|---|---|---|---|---|
| 2553446 | 13:59 | chore | Initial commit | — | A | |
| e4595bb | 14:01 | docs | Update README.md | — | A | ⚠️ |
| 3e31904 | 09:49 | docs | Hackathon Challenge — ShowUp2Move | docs/specs/00-overview.md | A | |
| f111df2 | 10:20 | docs | docs: add planning specs for ShowUp2Move | docs/specs/00-overview.md | A | |
| 7e36f06 | 11:24 | docs | docs: refresh ShowUp2Move planning canon | docs/specs/15-doc-refresh-plan.md | B | |
| e0e9cdd | 11:44 | chore | chore: scaffold next app foundation | docs/specs/01-architecture.md | C | 🔒,🌍,💾 |
| 71332ed | 11:44 | docs | docs: add i18n implementation plan | docs/specs/16-i18n-plan.md | A | 🌍 |
| de52db9 | 11:49 | feat | db: add auth profile schema | docs/specs/02-data-model.md | A | 💾 |
| dab0665 | 11:49 | feat | feat: add auth foundation primitives | docs/specs/04-auth-and-profile.md | A | 🔒,🧪 |
| e789d99 | 11:52 | feat | feat: add auth rate limit store | docs/specs/04-auth-and-profile.md | A | 🔒,🧪 |
| e5df618 | 11:53 | fix | fix: restore root app routes | docs/specs/01-architecture.md | B | |
| 7671b6b | 11:54 | fix | fix: harden auth validation defaults | docs/specs/04-auth-and-profile.md | A | 🔒,🧪 |
| c6664d7 | 11:57 | feat | feat: add auth server actions | docs/specs/04-auth-and-profile.md | B | 🔒,🧪 |
| bbb286d | 12:04 | feat | feat: add auth entry pages | docs/specs/04-auth-and-profile.md | B | 🔒,🌍 |
| dfda72c | 12:08 | feat | feat: add profile onboarding form | docs/specs/04-auth-and-profile.md | B | 🌍,🧪 |
| b880057 | 12:13 | feat | feat: add sports and location onboarding | docs/specs/06-ui-flows.md | B | 🌍,🧪 |
| 3858f6d | 12:17 | feat | feat: add today prompt response | docs/specs/06-ui-flows.md | B | 💾,🌍,🧪 |
| e5e22d1 | 12:26 | feat | feat: add deterministic matching loop | docs/specs/14-matching-and-event-algorithm.md | C | 💾,🌍,🧪 |
| 808cbcf | 12:29 | fix | fix: harden auth session lifecycle | docs/specs/04-auth-and-profile.md | B | 🔒 |
| 95fd74b | 12:30 | fix | fix: add database readiness health check | docs/specs/10-prod-readiness.md | A | 🧪 |
| 354e0f1 | 12:31 | fix | fix: parse forwarded request ip safely | docs/specs/10-prod-readiness.md | A | 🔒,🧪 |
| e144601 | 12:31 | fix | fix: polish localized copy | docs/specs/16-i18n-plan.md | A | 🌍 |
| 0451992 | 12:32 | fix | fix: keep demo proof conservative | docs/specs/13-scoring-coverage.md | A | |
| 2f79714 | 12:39 | feat | feat: add persisted group chat | docs/specs/06-ui-flows.md | C | 💾,🌍,🧪 |
| c51af96 | 12:55 | fix | fix: harden production chat smoke | docs/specs/10-prod-readiness.md | B | |
| b3c6645 | 12:59 | fix | fix(auth): bump bcrypt cost to 12 and refresh dummy hashes | docs/specs/04-auth-and-profile.md | A | 🔒 |
| 027db43 | 12:59 | feat | feat(headers): add CSP and HSTS to response headers | docs/specs/10-prod-readiness.md | A | 🔒 |
| 5a0afeb | 12:59 | feat | feat(auth): add requireUser and requireAdmin helpers | docs/specs/04-auth-and-profile.md | A | 🔒 |
| 4ae8f16 | 12:59 | fix | fix(env): require DATABASE_URL, SESSION_SECRET, PUBLIC_BASE_URL in production | docs/specs/10-prod-readiness.md | A | 🔒 |
| 69261f2 | 12:59 | feat | feat: add robots.txt to gate api and onboarding routes | docs/specs/10-prod-readiness.md | A | |
| 6eaf47f | 13:04 | feat | feat: add event creation and event chat | docs/specs/06-ui-flows.md | C | 💾,🌍,🧪 |
| c611e17 | 13:09 | feat | feat: add venue candidates and voting | docs/specs/14-matching-and-event-algorithm.md | C | 💾,🌍 |
| f63b3a2 | 13:15 | feat | feat: migrate to direction-B brand tokens | docs/specs/07-design-system.md | B | |
| 2f4df2c | 13:15 | feat | feat: add calendar export | docs/specs/08-bonus-features.md | A | 🌍,🧪 |
| a7a560f | 13:19 | docs | docs: adopt direction B brand and tighten flow specs | docs/specs/07-design-system.md | A | |
| b7abe93 | 13:19 | feat | db: add ai_cache table for demo safety | docs/specs/05-ai-features.md | A | 💾 |
| 56246f5 | 13:21 | feat | feat: add event weather forecast | docs/specs/08-bonus-features.md | A | 🌍,🧪 |
| 3b9de7f | 13:25 | feat | feat: add direction-B primitives and glyph set | docs/specs/07-design-system.md | C | |
| acae7a1 | 13:27 | feat | feat: add team balancing | docs/specs/14-matching-and-event-algorithm.md | A | 🌍,🧪 |
| bd2a243 | 13:33 | feat | feat: rebuild auth flow in direction B with recovery code reveal | docs/specs/04-auth-and-profile.md | B | 🔒,🌍 |
| 1ec7349 | 13:34 | feat | feat: rebuild onboarding profile + add photo step in direction B | docs/specs/06-ui-flows.md | B | 🌍 |
| 4cc6d4d | 13:35 | feat | feat: rebuild onboarding sports + location with continuous slider | docs/specs/06-ui-flows.md | B | 🌍 |
| 1c5395a | 13:35 | feat | feat(ai): add Groq client and ai_cache helper | docs/specs/05-ai-features.md | A | |
| d3fce73 | 13:36 | feat | feat(ai): add bio-to-sports extraction with deterministic fallback | docs/specs/05-ai-features.md | A | 🧪 |
| b6829a9 | 13:38 | feat | feat: rebuild today with 5 explicit states and animated funnel | docs/specs/06-ui-flows.md | C | 🌍 |
| c444174 | 13:39 | feat | feat: add /map route with lazy maplibre and denied fallback | docs/specs/06-ui-flows.md | C | 🌍 |
| b5881f4 | 13:40 | feat | feat: rebuild event screen with tabs vote and captain reveal | docs/specs/06-ui-flows.md | C | 🌍 |
| 5f2f212 | 13:41 | feat | feat: rebuild group screen with mobile tabs and captain panel | docs/specs/06-ui-flows.md | C | 🌍 |
| 4aa920f | 13:41 | feat | feat: add event invite links | docs/specs/08-bonus-features.md | C | 💾,🌍,🧪 |
| 7a4772b | 13:46 | feat | feat: add notifications inbox and header bell | docs/specs/08-bonus-features.md | B | 🌍 |
| bacf976 | 13:49 | feat | feat: add first match achievement | docs/specs/08-bonus-features.md | C | 💾,🌍 |
| 6084991 | 13:52 | feat | feat: rebuild landing and add leaderboard calendar pages | docs/specs/06-ui-flows.md | C | 🌍 |
| 3f79922 | 13:53 | feat | feat: rebuild judge mode with rubric proof rows | docs/specs/13-scoring-coverage.md | C | 🌍 |
| e3ba573 | 13:54 | feat | feat: add groups events settings and public profile routes | docs/specs/06-ui-flows.md | C | 🌍 |
| d41abd0 | 14:00 | docs | i18n: consolidate wave 1+2 partials and sweep inline strings | docs/specs/16-i18n-plan.md | C | 🌍 |
| 7745867 | 14:04 | feat | feat(ai): add server action wrapping bio-to-sport extraction | docs/specs/05-ai-features.md | A | |
| da84ff4 | 14:04 | feat | feat(ai): add compatibility scoring with deterministic fallback | docs/specs/05-ai-features.md | A | 🧪 |
| 7be52fd | 14:04 | feat | feat(ai): add captain brief generation with deterministic fallback | docs/specs/05-ai-features.md | A | 🧪 |
| 8317fc3 | 14:05 | feat | feat(invite): public preview page with OG metadata and expired state | docs/specs/08-bonus-features.md | A | |
| 84c42d7 | 14:05 | feat | feat(map): add Google/Apple/Waze deep-link buttons to venue sheet | docs/specs/06-ui-flows.md | A | |
| 01f99a2 | 14:05 | fix | fix(event): externalize VoteCard copy and announce vote updates | docs/specs/06-ui-flows.md | A | |
| 4feee63 | 14:05 | feat | feat(uploads): add R2 client and profile-photo upload action | docs/specs/04-auth-and-profile.md | A | 🔒,🧪 |
| 5d9fe0c | 14:05 | feat | feat(match): add confirm/decline membership server actions | docs/specs/14-matching-and-event-algorithm.md | A | |
| 80ef6a0 | 14:05 | feat | feat(notifications): add table, lib, and server actions | docs/specs/08-bonus-features.md | B | 💾 |
| a406d41 | 14:06 | fix | fix: restore railway standalone startup | docs/specs/11-deployment-railway.md | C | |
| 6b07f72 | 14:07 | docs | i18n: add yourVote and invitePreview empty/og keys | docs/specs/16-i18n-plan.md | A | 🌍 |
| 6ea612f | 14:14 | test | test: add visual qa harness | docs/specs/09-testing-strategy.md | A | 🧪 |
| 480dcb2 | 14:22 | fix | fix: self-host fonts and repair mobile tabs | docs/specs/07-design-system.md | B | |
| 35b0919 | 14:29 | fix | fix: run railway migrations before startup | docs/specs/11-deployment-railway.md | A | 💾 |
| 82efdff | 14:29 | feat | feat: extract groups list data | docs/specs/03-server-actions-and-routes.md | B | |
| 3b2c8a6 | 14:31 | feat | feat: wire real events calendar data | docs/specs/03-server-actions-and-routes.md | B | |
| ea24f45 | 14:39 | feat | feat: wire remaining demo surfaces | docs/specs/13-scoring-coverage.md | C | 🌍 |
| dc4b8c5 | 14:40 | docs | docs: add visual QA report | docs/specs/09-testing-strategy.md | A | |
| 4879a1d | 14:41 | fix | fix: strip internal port from next-intl redirect locations | docs/specs/16-i18n-plan.md | A | 🔒,🌍 |
| e8dbc55 | 14:42 | feat | feat(ai): wire bio→sport extraction into onboarding profile flow | docs/specs/05-ai-features.md | A | 🌍 |
| 968f73a | 14:42 | feat | feat(ai): render captain brief on event page | docs/specs/05-ai-features.md | A | |
| cfe9fc7 | 14:46 | docs | (audit partials snapshot bundled with one MobileTabBar tweak) | — | D | 🔄(touches 6ea612f harness?),⚠️ |
| a12256b | 14:48 | chore | chore: remove visual qa harness and report | docs/specs/09-testing-strategy.md | A | 🔄6ea612f,🧪 |
| 7582f65 | 14:50 | fix | fix: mount HeaderBell on every authed route | docs/specs/08-bonus-features.md | B | |
| 0d6f3b1 | 14:51 | feat | feat(uploads): delete replaced R2 object on profile-photo upload | docs/specs/04-auth-and-profile.md | A | 🔒 |
| 5714172 | 14:52 | fix | fix: gate recover step 2 on verified identity | docs/specs/04-auth-and-profile.md | A | 🔒 |
| e82ac0d | 14:52 | fix | fix: redact recovery code placeholder format | docs/specs/04-auth-and-profile.md | A | 🔒,🌍 |
| 878f67d | 14:56 | fix | fix(landing): remove arrow icon from S2M start-playing CTA | docs/specs/07-design-system.md | A | |
| 8ff1770 | 14:56 | fix | fix: scrollable sport-filter pills on map 360w | docs/specs/06-ui-flows.md | A | |
| 36c3b02 | 14:56 | fix | fix: prevent map venue actions from clipping on 360w | docs/specs/06-ui-flows.md | A | |
| 032bc2e | 14:56 | fix | fix: add bottom gutter so MobileTabBar does not overlap last row | docs/specs/06-ui-flows.md | A | |
| d88e115 | 14:56 | chore | chore: add favicon to clear console 404 | — | A | |
| df3b42a | 14:56 | docs | docs: document required env vars and local setup | docs/specs/11-deployment-railway.md | A | 🔒 |
| 26cc10f | 15:02 | fix | fix(ui): drop decorative chevrons + tighten recovery code page | docs/specs/07-design-system.md | A | 🔒 |
| 1dd94e0 | 15:05 | fix | fix(ui): drop primary-icon chevron from profile next button | docs/specs/07-design-system.md | A | |
| 11b2619 | 15:08 | style | style(notifications): polish inbox empty and item states | docs/specs/06-ui-flows.md | B | 🌍 |
| 9f2b36a | 15:11 | style | style(demo): polish Judge Mode page layout and proof rows | docs/specs/13-scoring-coverage.md | B | |
| 2da80a8 | 15:12 | style | style(onboarding): polish wizard header and sticky action bar | docs/specs/06-ui-flows.md | B | 🌍 |
| 41be34c | 15:12 | chore | chore: replace em dashes | docs/specs/15-doc-refresh-plan.md | C | 🌍 |
| 39d1b0e | 15:12 | style | style(group): polish FormationTimeline copy + visual progress | docs/specs/07-design-system.md | C | 🌍 |
| 27d7b1f | 15:12 | feat | feat(onboarding): wire photo upload + AI vision to PhotoForm | docs/specs/05-ai-features.md | C | |
| 436426c | 15:13 | style | style(onboarding): polish wizard header and sticky action bar | docs/specs/06-ui-flows.md | B | 🔄2da80a8(possible re-polish) |
| 6f16e0c | 15:15 | docs | docs: ban em dashes in agent guidance | — | A | |
| e41b546 | 15:15 | chore | chore: remove em dashes | docs/specs/16-i18n-plan.md | A | 🌍,🔄41be34c(continuation) |
| e03a84f | 15:16 | style | style(onboarding): polish PhotoForm idle and skip states | docs/specs/06-ui-flows.md | B | 🌍 |
| bdd4f1e | 15:16 | style | style(tokens): replace retired palette tokens and 8/12px radii | docs/specs/07-design-system.md | A | |
| 7ed5d8c | 15:19 | style | style(today): polish prompt + match outcome cards | docs/specs/06-ui-flows.md | C | 🔄bdd4f1e(identical stat: 12 files 20+/20-; subject mismatch) |
| e26817e | 15:19 | docs | docs(profile): correct MatchPercentPanel JSDoc to match shipped wiring | docs/specs/05-ai-features.md | A | |
| 211ce45 | 15:19 | style | style(today): polish prompt + match outcome cards | docs/specs/06-ui-flows.md | D | ⚠️(empty diff/no files) |
| 4bd16f1 | 15:21 | feat | feat(map+today): keyless OSM tiles + mobile header icon | docs/specs/06-ui-flows.md | B | |
| 27fdc40 | 15:22 | fix | fix(settings): remove Email reminders section | docs/specs/06-ui-flows.md | A | |
| 22a2924 | 15:22 | feat | feat(ux): add loading+error segments | docs/specs/06-ui-flows.md | D | ⚠️(empty diff/no files) |
| 3450e31 | 15:26 | test | test: add Playwright landing smoke | docs/specs/09-testing-strategy.md | A | 🧪 |
| f1c7d95 | 15:26 | feat | feat(events): wire manual event creation backend | docs/specs/03-server-actions-and-routes.md | B | |
| a4c1cee | 15:26 | feat | feat: merge photo into onboarding profile | docs/specs/06-ui-flows.md | C | 🌍 |
| d1945e7 | 15:26 | feat | feat: persist event RSVP state | docs/specs/06-ui-flows.md | B | |
| 0564fd8 | 15:26 | feat | feat: surface unread counts and map labels | docs/specs/08-bonus-features.md | C | |
| 85e8929 | 15:27 | fix | fix: exclude declined members from matching | docs/specs/14-matching-and-event-algorithm.md | A | |
| fb9a3a2 | 15:27 | fix | fix: tighten demo seed controls | docs/specs/13-scoring-coverage.md | B | 🌍 |
| 616a31d | 15:27 | feat | feat: polish captain brief panel | docs/specs/05-ai-features.md | B | |
| d01811a | 15:27 | style | style: localize landing and shell polish | docs/specs/06-ui-flows.md | B | |
| 74ec99c | 15:28 | fix | fix: localize demo rubric labels | docs/specs/13-scoring-coverage.md | A | 🌍 |
| 8941981 | 15:29 | feat | feat(groups): wire confirm/decline buttons for invited members | docs/specs/06-ui-flows.md | A | |
| f471fb3 | 15:32 | chore | chore(i18n): drop Romanian from served locales, keep EN only | docs/specs/16-i18n-plan.md | B | 🌍 |
| dd9533d | 15:35 | fix | fix(landing): un-double .ai-mark and restore chevron on AI proof chip | docs/specs/07-design-system.md | A | |
| d66c429 | 15:36 | docs | i18n: add missing sidebar keys to Romanian common.json | docs/specs/16-i18n-plan.md | A | 🌍,🔄f471fb3(re-adds RO after dropping it) |
| cd41e08 | 15:37 | fix | fix(i18n): translate landing-page side card + live cards to RO | docs/specs/16-i18n-plan.md | B | 🌍,🔄f471fb3 |
| d8e43bd | 15:39 | feat | feat(demo): auto-seed on first /demo render | docs/specs/13-scoring-coverage.md | A | |
| 67b30b7 | 15:41 | fix | fix(i18n): rewrite RO landing headline | docs/specs/16-i18n-plan.md | A | 🌍 |
| a030089 | 15:44 | fix | fix(glyph): collapse spark into a single chevron, removing the burst strokes | docs/specs/07-design-system.md | A | |
| e893438 | 15:45 | feat | feat(demo): wire scripted demo entry as a dedicated route | docs/specs/13-scoring-coverage.md | A | |

## Notable commits

**Three worst.**
- `cfe9fc7` (14:46, 29 files / 4710 inserts) — bundled audit-partials dump alongside an unrelated `MobileTabBar.tsx` source tweak. Generic "audit snapshot + code change" mess; should have been two commits.
- `e0e9cdd` (11:44, 43 files / 9009 inserts) — initial scaffold landed as one mega-commit covering Next config, Drizzle, ESLint, Playwright, Vitest, i18n routing, demo guard, schema and proxy. Atomicity sacrificed for speed.
- `211ce45` and `22a2924` (15:19, 15:22) — empty-diff commits with vague subjects ("polish prompt + match outcome cards", "add loading+error segments"). No file changes recorded; either reverted-in-place or accidental empty commits. Both D-grade.

**Genuine reverts/undo cycles.**
- `a12256b` (14:48) explicitly removes `e2e/visual.spec.ts`, `scripts/visual-qa/*` and `_review/visual-qa.md` added by `6ea612f` (14:14) and `dc4b8c5` (14:40). Net: visual QA harness lived 35 minutes.
- `d66c429` and `cd41e08` re-add Romanian content immediately after `f471fb3` "drop Romanian from served locales". Mixed signals on i18n scope.
- `7ed5d8c` shows identical stats to immediately-prior `bdd4f1e` (12 files, 20/20 lines) but a different subject — likely a duplicate-style sweep, treated as 🔄 indicator.

**Three best.**
- `dab0665`, `e789d99`, `7671b6b` — auth foundation trio, each small, tested (`*.test.ts` paired with sources), and clearly scoped to one concern (`docs/specs/04-auth-and-profile.md`).
- `027db43` (CSP/HSTS one-liner) and `4ae8f16` (env-var production gate) — surgical security commits with crystal-clear subjects.
- `2f4df2c` (calendar export) — feature + ICS route + paired `calendar.test.ts` in 9 files. A-grade shape.
