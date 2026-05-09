# 03 — Phase 2: Availability & Matching Audit

Audit date: 2026-05-09
Specs: `docs/specs/12-implementation-plan.md` §4 (Phase 2), `docs/specs/14-matching-and-event-algorithm.md`, `docs/specs/06-ui-flows.md` §7–§8

## Headline

Phase 2 is **largely shipped but partial in fidelity**. The vertical slice runs end-to-end (prompt window → Yes/No server action → deterministic matching with Haversine distance gate → group + captain insert → Today UI states), backed by a transaction with `pg_advisory_xact_lock` and DB-level uniqueness on active membership and one-captain-per-group. However several spec rules are missing or simplified: the **100-pt ranking score (§4)** is not implemented, **captain selection collapses §6 to "earliest responder only"**, no **system chat message** is written when a group/captain is created (spec §3 final step), the **Group Formation Timeline** (§8) is wired in UI but populated with **hardcoded placeholders** rather than real per-group reasons, the **seeded football demo cannot form via the matcher** (only 4 demo users vs. football `sizeMin: 6` — spec "Done when" gate at risk), and there is **no integration/E2E test** that actually exercises `formGroupsForPromptAction`.

## Verdict Table

### Phase 2 tasks (`docs/specs/12-implementation-plan.md` §4)

| # | Task | Verdict | Evidence (file:line) |
|---|---|---|---|
| 1 | Prompt windows | DONE | `src/lib/prompt-window.ts:23-38` (Romania timezone, morning/afternoon/evening); `src/lib/prompt.ts:69-120` auto-creates per `(scopeKey, windowDate, windowSlot)` with `prompt_scope_date_slot_unique` (`src/db/schema.ts:118-123`) |
| 2 | ShowUpToday Yes/No server action | DONE | `src/lib/prompt.ts:155-236` (`respondToPromptAction`); `src/lib/prompt-form-actions.ts:29-50` form-binding; zod input contract `src/lib/contracts/prompt.ts:7-21`; UI submit in `src/components/today/TodayPromptHero.tsx` via `<form action={formAction}>` (`TodayPromptCard.tsx:303`) |
| 3 | Deterministic matching | PARTIAL | `src/lib/matching-core.ts:91-143` deterministic ordering by `respondedAt` and sport-count desc; `src/lib/matching.ts:255-287` with `pg_advisory_xact_lock` + transaction. **Missing**: §4 100-pt ranking score (sport/distance/availability/size/skill/AI), §4 minimum-55 threshold, skill-balance soft gate (skillLevel collected at `matching.ts:147-154` but unused) |
| 4 | Group-size rules | PARTIAL | `src/lib/sports.ts:16-118` defines exact `{sizeMin, sizeIdeal, sizeMax}` matching spec §5 table; `matching-core.ts:107` enforces `sizeMin`, `:111` slices to `sizeIdeal`. **Drift**: never grows toward `sizeMax` even when surplus candidates exist (spec §3 says "take up to sport.sizeIdeal, never over sizeMax" — current always caps at ideal) |
| 5 | Proximity matching (Haversine, no PostGIS) | DONE | `matching-core.ts:35-49` Haversine; `:51-54` `compatibleByDistance` uses `min(seed.maxDistanceKm, candidate.maxDistanceKm)` per spec §3 distance rule; ranking `:67-84` orders by distance from seed; near/far proof in `matching-core.test.ts:36-49` (user 5 at 45.9/21.45 ≈ 30 km excluded) |
| 6 | Captain assignment | PARTIAL | `matching-core.ts:63-65` picks earliest `respondedAt`; DB uniqueness `src/db/schema.ts:212-214` (`group_members_one_captain_unique`). **Missing** vs. spec §6: "prior captain achievement" lookup, "close to group center" tie-break, explicit random tie-break, and the **system chat message** "Ionut is captain for this group…" (no message insert in `insertDraftGroup`, `matching.ts:172-229`) |
| 7 | Match confirmation | DONE | `src/lib/match-confirm.ts:28-52` atomic `invited → confirmed` UPDATE with WHERE-guard (no read-then-write race); `:61-85` decline path; `src/lib/match-confirm-actions.ts:33-91` server actions; `confirmLabel="Confirm participation"` rendered on `TodayFoundCard` (`TodayPromptCard.tsx:206`). Note: matcher inserts members with `role: 'captain' | 'player'` directly (`matching.ts:200-208`) and schema default `status='confirmed'` (`schema.ts:204`); the invited→confirmed path is reachable for invitees but the auto-formed members are confirmed at insert time — acceptable for hackathon scope |
| 8 | Queued / no-match state + Group Formation Timeline | PARTIAL | Queued/no-match UI: `src/components/today/TodayQueuedCard.tsx:1-142` rendered for both `formStatus === "queued"` and `"no_match"` (`TodayPromptCard.tsx:65-81`). FormationTimeline component: `src/components/group/FormationTimeline.tsx:26-114` renders the 4 spec rails. **Drift**: reasons are **hardcoded placeholders** in `src/app/[locale]/groups/[groupId]/page.tsx:78-87` (`"5 km"`, `"Skill mix balanced"`, `"Group size fit"` are literal strings, not derived from `groupResult.data`); `respondToPromptAction` returns `{state: "no_match"}` (never `"queued"`, see `prompt.ts:233-235`) — UI collapses both into one card, which is acceptable but loses the "1 nearby tennis player, need 1 more" copy from spec §7.4 |

### Phase 2 "Done when" gate

| Gate | Verdict | Evidence |
|---|---|---|
| Seeded users form valid groups after prompt response | **PARTIAL / AT RISK** | `scripts/seed-demo.ts:36-93` only seeds **4 demo users**, all opted into football. Football `sizeMin = 6` (`sports.ts:28-36`), so an end-to-end Yes flow on this seed cannot form a football group through the matcher. The seed instead **hand-inserts a pre-formed group** at `seed-demo.ts:255-280` (bypassing `formGroupsForPromptAction` entirely). Tennis (sizeMin = 2) would form, but no demo user has tennis-only as primary sport. Either the demo user count must rise to ≥6 footballers or the seeded sport must drop to a `sizeMin ≤ 4` sport. |

### Spec §14 — Matching & Event Algorithm fidelity

| Spec section | Requirement | Verdict | Evidence |
|---|---|---|---|
| §1 Inputs | yes responses, sport prefs, skill, city, lat/lng, max distance | DONE | `matching.ts:88-114` selects all of these; `:128-169` builds `MatchCandidate` with sportPrefs override, skill avg, lat/lng fallback to home |
| §2 Hard gates: answered yes | DONE | `matching.ts:108-113` filter `answer = 'yes'` |
| §2 Hard gate: at least one shared sport | DONE | `matching-core.ts:104` `sportPrefs.includes(sport)` |
| §2 Hard gate: within max distance (Haversine) | DONE | `matching-core.ts:51-54`, `:110` |
| §2 Hard gate: not banned/deleted | DONE | `matching.ts:129` |
| §2 Hard gate: not already in another active group same prompt | DONE | `matching.ts:68-78,129` (`existingMemberIds` set); DB-level guard `schema.ts:209-211` (`group_members_active_prompt_user_unique`) |
| §2 Soft gates: skill similarity / bio / activity / history | MISSING | No skill-balance, bio compatibility, recent activity, or prior-group-history scoring anywhere in `matching-core.ts` |
| §3 Pseudo-flow: bucket by sport then proximity | PARTIAL | Sport bucketing DONE (`matching-core.ts:100-104`); proximity bucketing/bounding-box step is implicit (only seed-radius filter; no bbox pre-filter) |
| §3 Pseudo-flow: choose seed by "highest availability certainty" | PARTIAL | Seed = first by `respondedAt` (`matching-core.ts:105,108`); no other availability signal |
| §3 Take up to sport.sizeIdeal, never over sizeMax | PARTIAL | Caps at `sizeIdeal` always; never grows beyond ideal even when surplus exists (drift, harmless) |
| §3 Transactional + advisory lock + idempotent | DONE | `matching.ts:258,269` `db.transaction` + `pg_advisory_xact_lock(hashtext(promptId))`; uniqueness in `schema.ts:209-211`; `achievements` insert uses `onConflictDoNothing` (`matching.ts:219-221`) |
| §3 Distance: smaller of two radii from seed/center | DONE | `matching-core.ts:51-54` |
| §3 Demo proof: near passes, far fails | DONE (unit only) | `matching-core.test.ts:42-48` |
| §4 100-pt ranking score (sport 30 / distance 20 / avail 20 / size 10 / skill 10 / AI 10) | **MISSING** | No score function exists; `grep "55|score" src/lib/matching*` returns no scoring logic |
| §4 Min score 55 to auto-match; below → queue | **MISSING** | No threshold gate; the only auto-match gate is `sizeMin` |
| §5 Group size rules table | DONE | `sports.ts:16-118` matches spec table exactly for all 10 sports |
| §6 Captain selection (4 strategies) | PARTIAL | Only strategy 1 ("quick confirm" via `respondedAt`) implemented; 2/3/4 missing; system chat message **MISSING** |
| §13 Unit tests: group size boundaries, distance, skill balance, venue, weather, price | PARTIAL | `matching-core.test.ts` covers size + distance + captain (3 tests); `team-balance.test.ts`, `weather.test.ts`, `calendar.test.ts` exist; **no skill-balance-in-matching test, no bbox/proximity-bucketing test** |
| §13 Integration: simultaneous Yes do not duplicate, captain assigned once, etc. | **MISSING** | No integration test invokes `formGroupsForPromptAction` against a live DB; `find src -name '*.test.ts'` shows no integration coverage of the matching server action |
| §13 E2E: seeded football group forms with 10–14 users | **MISSING** | `e2e/visual.spec.ts` is screenshot-only; no flow E2E. Seed has 4 users, not 10–14. |

### Spec §06-ui-flows fidelity (Today/Group sections)

| Section | Requirement | Verdict | Evidence |
|---|---|---|---|
| §7.1 State A — prompt | DONE | `TodayPromptHero.tsx` rendered when `state === "prompt"` (`TodayPromptCard.tsx:158-171`) |
| §7.2 State B — searching (animated 8→6→4 funnel) | DONE | `TodaySearching.tsx` invoked with `ranges={[{count:8,…},{count:6,…},{count:4,…}]}` (`TodayPromptCard.tsx:173-194`); pending detected via `useFormStatus` |
| §7.3 State C — found (matched) | PARTIAL | `TodayFoundCard.tsx` rendered when `state === "found"` (`TodayPromptCard.tsx:196-212`); but `captainName={null}`, `groupSize={null}`, `venueName="Suggested venue nearby"`, `matchScore={92}` are **literal placeholders** not derived from `group` |
| §7.4 State D — queued | PARTIAL | `TodayQueuedCard.tsx` renders, but `bodyText`, "1 nearby tennis player now / Need 1 more" copy is generic ("Looking for {sport}"); no live count of nearby Yes-responders |
| §7.5 State E — said-no | DONE | `TodaySaidNoCard.tsx` rendered when `state === "said-no"` (`TodayPromptCard.tsx:228-234`) |
| §7.6 State F — confirmed | PARTIAL | Component exists (`TodayConfirmedCard.tsx`) but `state === "confirmed"` is **never reached** by `deriveState` (`TodayPromptCard.tsx:51-83`) — comment at `:58-60` admits "Wave-1 shape doesn't carry that" |
| §8 Group screen — Plan/Chat/Players tabs, captain badge, FormationTimeline | DONE (UI) / PARTIAL (data) | Tabs + captain badge: `src/app/[locale]/groups/[groupId]/page.tsx:49,310-313`; FormationTimeline rendered at `:160` and `:388` but populated with hardcoded reasons (`:78-87`) |
| §8 CaptainBriefPanel | DONE (UI) | `src/components/group/CaptainBriefPanel.tsx`; rendered when `isCaptain` (`page.tsx:147-158`) |

## Evidence Detail

### Schema support for matching (DONE)

`src/db/schema.ts`:

- `prompts` (`:105-126`): `(scopeKey, windowDate, windowSlot)` unique; demo-scoped via `scopeKey`
- `availabilityResponses` (`:128-157`): `(promptId, userId)` unique, has `matchFailureReason` + `lastMatchAttemptAt` columns wired to UI
- `groups` (`:159-186`): `centerLat/centerLng`, `sizeTarget`, `status='active'`, `captainUserId`
- `groupMembers` (`:188-219`): partial-unique on `(promptId, userId) WHERE status IN ('invited','confirmed')` (true active-membership guard); partial-unique on `groupId WHERE role='captain'` (one captain per group)

### Matching transaction (DONE)

`src/lib/matching.ts:255-287`:
- Wraps everything in `getDb().transaction`
- `tx.execute(sql\`select pg_advisory_xact_lock(hashtext(${promptId}))\`)` at `:269` serializes concurrent matches per prompt
- Loads `existingGroupsForPrompt` first (idempotent re-runs return existing groups, do not re-insert)
- Marks attempt outcomes on `availabilityResponses` (`:231-253`) so the queued/no-match UI knows what happened

### Captain selection (PARTIAL)

`src/lib/matching-core.ts:63-65`:
```ts
function captainFor(candidates: MatchCandidate[]) {
  return [...candidates].sort((a, b) => a.respondedAt.getTime() - b.respondedAt.getTime())[0];
}
```
This implements only spec §6 strategy 1. The DB schema enforces "exactly one captain" via `group_members_one_captain_unique`, but the algorithm has no:
- prior-captain `achievements` lookup
- distance-to-group-center tie-break
- explicit RNG tie-break for ties on `respondedAt`
- "captain assigned" system chat message (spec §3 last step + §6 sample copy "Ionut is captain for this group…")

### Ranking score (MISSING)

Spec §4 prescribes a 6-factor 100-pt score with a 55-pt minimum. No file in `src/lib/matching*` computes such a score. The only "score" surface is the literal `matchScore={92}` prop on `TodayFoundCard` (`TodayPromptCard.tsx:211`).

### FormationTimeline data wiring (DRIFT)

`src/app/[locale]/groups/[groupId]/page.tsx:78-87` hardcodes:
```ts
const formationReasons = [
  { icon: <Glyph.pin />, label: "Within distance gate", value: "5 km" },
  { icon: <Glyph.spark />, label: `Same sport · ${sportLabel}` },
  { icon: <Glyph.pulse />, label: "Skill mix balanced" },
  { icon: <Glyph.groups />, label: "Group size fit" },
];
```
None of `value: "5 km"`, `"Skill mix balanced"`, `"Group size fit"` is derived from the actual group; only the sport label is dynamic. Spec §8 calls for a 5-step timeline including AI explanation; only 4 are rendered.

### Seed-demo "Done when" gap (AT RISK)

`scripts/seed-demo.ts:36-93` declares 4 demo users; all four list football among their sports. With football `sizeMin = 6` (`sports.ts:28-36`), `formDeterministicGroups` cannot produce a football group from this seed (`matching-core.ts:107` exits the loop when `sportCandidates.length < 6`). The seed instead bypasses the matcher with a direct `INSERT INTO groups + group_members` at `seed-demo.ts:255-280`, then attaches a pre-formed event. So the spec gate "seeded users form valid groups after prompt response" is **only true if "form" includes hand-rolled inserts**. To exercise the matcher in the demo loop, raise the demo user count to ≥6 footballers or change the seeded primary sport to one with `sizeMin ≤ 4` (running, cycling, tennis, badminton, table_tennis) and seed at least that many opt-ins.

### Distance contract drift (cosmetic for Phase 2)

`docs/specs/06-ui-flows.md` §6.3 specifies a continuous 1.0–10.0 km slider (step 0.5 km). `src/lib/sports.ts:121` and `src/lib/contracts/prompt.ts:13-20` allow only `[1, 3, 5, 10]` discrete values. Matching itself is unaffected (it reads `users.maxDistanceKm` smallint), but the prompt response form action will reject non-canonical slider values.

### Test coverage (PARTIAL)

| Layer | File | Coverage |
|---|---|---|
| Unit — core matcher | `src/lib/matching-core.test.ts` | 3 tests: Haversine, size+distance gates, captain singleton |
| Unit — prompt input contract | `src/lib/contracts/prompt.test.ts` | input-shape parsing only |
| Unit — team balance (post-formation) | `src/lib/team-balance.test.ts` | exists |
| Integration — `formGroupsForPromptAction` | none | `respondToPromptAction` and `formGroupsForPromptAction` are untested against a real DB |
| Integration — match-confirm atomic update | none | `confirmMembership`/`declineMembership` untested |
| E2E — full Yes → match → group flow | none | `e2e/visual.spec.ts` is screenshot-only |

## Recommended Fixes (priority order)

1. **Raise seeded football opt-ins to ≥6** (or switch demo sport to tennis/running) so the spec "Done when" gate is met by the matcher, not by hand-inserts. (`scripts/seed-demo.ts:36-93`)
2. **Emit captain-assignment system chat message** inside `insertDraftGroup` after the `groupMembers` insert (`src/lib/matching.ts:200-208`) using the spec §6 copy.
3. **Wire FormationTimeline reasons from real data**: extend `getGroupAction` to return the per-group distance gate, sport label, skill spread, and member count, then map into `formationReasons` in `src/app/[locale]/groups/[groupId]/page.tsx:78-87`.
4. **Add the §4 ranking score** (even a deterministic v1 without AI weight) and the 55-pt threshold so below-threshold candidates fall through to queued explicitly.
5. **Strengthen captain selection** with the `achievements.code = 'captain'` lookup and a deterministic RNG tie-break.
6. **Add an integration test** that runs `respondToPromptAction` for several seeded users in a transaction and asserts: one group, one captain row, no duplicate memberships under simulated parallel Yes responses.
7. **Differentiate queued vs. no_match in `respondToPromptAction`** so the queued card can surface live "1/2 players" copy from spec §7.4 instead of generic "Looking for sport".
8. **Reconcile distance contract** with the slider (allow 1–10 km step 0.5 in `DISTANCE_OPTIONS_KM` / `respondToPromptInputSchema`).
