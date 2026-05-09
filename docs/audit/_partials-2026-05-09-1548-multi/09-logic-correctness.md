# 09 - Business Logic & Algorithmic Correctness

## TL;DR

The deterministic matching pipeline (haversine + bucket + size gate) is honest and
covered by unit tests, but **the `docs/specs/14` contract is half-implemented and
the demo proves none of it.** Nine concrete things are wrong:

1. Spec §4 ranking score (100-pt formula, 55-pt auto-match threshold) is still
   absent from `formDeterministicGroups()`. The algorithm picks groups by FIFO +
   distance-only, then writes them — there is no per-candidate score, no
   threshold gate, no "below 55 → queue + recommend manual event" branch.
2. Spec §6 captain selection is collapsed to "earliest responder."
   Prior-captain-history, group-center proximity, and tie-break-randomly steps
   are not in the code.
3. The demo seed produces **only 4 users and bypasses matching entirely** —
   football needs `sizeMin=6`, and the seed *also* hand-creates a group +
   event + attendees + venues, so `formDeterministicGroups()` never runs for
   the demo and never produces the proof the rubric claims.
4. Achievements: `first_match` is awarded only inside `insertDraftGroup()` —
   since the seed never goes through matching, no demo user has `first_match`,
   so the `/groups → First Match badge` rubric row is structurally unreachable
   on the seeded demo.
5. Vote tally has no winner-finalization, no `votes.options`, no `closes_at`,
   no captain-close-early server action. The "Close vote" button in
   `VoteCard.tsx` has no server target. The schema diverges from spec §12 and
   data-model §2.
6. `castVenueVoteAction` allows updating a vote choice while
   `votes.status='open'` with no closed-state guard at write time and no
   tie-break rule documented (the read path uses votes-desc-then-rank-asc as a
   de-facto tiebreak; nowhere in spec).
7. Event venue candidates ship a fake distance: `distanceKm: (index+1).toFixed(2)`
   — i.e. 1.00, 2.00, 3.00 km regardless of where the venue actually is.
   Spec §8 also requires a `score` column and a 100-pt venue ranking; the
   schema has neither.
8. Auto-event time is hardcoded `16:00 UTC tomorrow` for every captain on every
   group (spec §11.1: "choose best time from prompt slot and member
   preferences"). Time-zone is UTC, not per-captain TZ.
9. `MatchPercentPanel` "schedule fit" row is structurally fake — the
   deterministic compat-score path always sets `scheduleFit='medium'`
   (compat-score.ts:148), which renders as `65%` in every public profile when
   Groq is offline. The label is presented as a real signal.

Also: the rubric proofs file (`scoring-proofs.ts`) was bumped from
`pending`/`fallback` → `live` for `ai-bio-extraction`, `ai-photo-extraction`,
`ai-compatibility-score`, `ai-captain-brief`, and `compatibility-explanation`
(diff in commit `d4901ba`). For four of those, `live` is honest only when
`GROQ_API_KEY` is configured at runtime; the deterministic fallback path is the
**default** because seed/test envs don't ship a key (`.env.example` doesn't
require it). The status rule should be `fallback` when AI is conditional, not
`live`.

Notification creation (commit `80ef6a0`) is **completely missing**: no insert
sites for the `notifications` table exist anywhere in `src/lib/**` or
`src/app/**`. The notification center can only ever be empty. The 300p
"Persistent notification center" claim is structurally unbacked.

## Findings

### [P0] Demo seed cannot exercise the matching algorithm — football fails sizeMin gate, all sports fail because the seed creates the group itself

**Where:** `scripts/seed-demo.ts:36-93` (4 demo users), `scripts/seed-demo.ts:241-280`
(seed inserts the football group + members directly), `src/lib/matching.ts:97-180`
(matching skips users with existing membership for the prompt).

**What:** The seed inserts exactly 4 demo users, then opens an
`availability_responses` row + a `groups` row + 4 `group_members` rows for the
same prompt — all hand-rolled, no call to `formGroupsForPromptAction`. Then
`existingMemberIdsForPrompt()` (matching.ts:73-88) excludes those 4 users from
the candidate pool. Result: when a real visitor opens the demo, the matching
function has zero candidates and produces zero new groups. The football group
that's visible was inserted by the seed, not by the algorithm.

**Impact:**
- `smart-matching` (1500p, status `seeded`, scoring-proofs.ts:104-110) claim
  "Deterministic group formation after Yes against seeded users in Timișoara
  radius" is **false in the seeded demo** — formation never runs.
- Spec §13 E2E "seeded football group forms with 10-14 users" is not
  achievable: only 4 seeded users, sizeMin=6 for football per
  `lib/sports.ts:29`.
- Prior audit (`audit-2026-05-09-1432-full.md:15`) flagged the same 4-user
  problem; commit `d8e43bd` added auto-seed on `/demo` render but did not add
  more users.

**Fix:** Either (a) seed 8-12 users, drop the hand-created group, and call
`formGroupsForPromptAction()` from the seed so the visible group is the
algorithm's output; or (b) downgrade `smart-matching` from `seeded` to
`pending`/`fallback`.

---

### [P0] `notifications` table has zero insert sites — entire notification center is structurally empty

**Where:** `src/db/schema.ts:444-468` defines the table; `src/lib/notifications.ts`
only reads/marks-read; full repo grep for `insert(notifications)` returns 0
hits.

**What:** Spec data-model §2 lists notification types `match|event|vote|
message|prompt|reminder` and commit `80ef6a0` declared the `type` enum, but no
code path inserts a row. `formGroupsForPromptAction`, `castVenueVoteAction`,
`createGroupEventAction`, `postMessageAction`, `confirmMembership`,
`declineMembership` all complete without writing notifications.

**Impact:**
- `notifications` rubric row (300p, scoring-proofs.ts:303-312, status `live`,
  "Persistent rows + read/unread; header bell entry point") is dishonest —
  rows are never created, so the bell badge in `HeaderBell` always renders
  `0` (verified via `unreadCount()` query in `notifications.ts:106-113`).
- Achievement-emit, match-emit, event-emit notifications all silently no-op.

**Fix:** Either (a) wire `db.insert(notifications)` into the obvious
trigger sites (match formed → notify each new member; vote opened →
notify attendees; event created → notify group; achievement awarded →
notify owner), or (b) downgrade the row to `pending`.

---

### [P1] Spec §4 ranking score and 55-pt auto-match threshold are still missing

**Where:** `src/lib/matching-core.ts:91-143` (`formDeterministicGroups`),
`src/lib/matching.ts:265-297` (`formGroupsForPromptAction`).

**What:** Spec §4 requires a 100-pt weighted score
(sport=30 / distance=20 / availability=20 / size=10 / skill=10 / AI=10) and
"Minimum to auto-match: 55. Below 55 or outside the hard distance gate: user
stays in queue, app recommends manual event creation or smaller sport."

The shipped algorithm:
- bucket candidates by sport (line 92-96),
- pick FIFO seed (line 105),
- rank candidates by distance from seed (line 109),
- accept first `sizeIdeal` that pass the symmetric distance gate (lines 51-54),
- assign captain = earliest responder.

There is no per-candidate score, no 55-threshold gate, no `score` field
returned to the UI, no "no_match → recommend smaller sport" copy beyond the
generic `matchFailureReason='no_compatible_group'`. Verified by
`grep "55\|threshold" src/lib/matching* src/lib/sports.ts` returning zero hits.

**Impact:** `smart-matching` 1500p claim is **the simpler bucket+haversine
path the prior audit already flagged**. The spec's headline ranking metric
that judges can grep for is absent.

**Fix:** Implement the §4 weight table in `matching-core.ts`, gate at 55,
add a `score` field on `MatchCandidate` rank output, add a "below 55"
branch that produces a different `matchFailureReason` so the `/today`
"no match" copy can recommend manual event creation.

---

### [P1] Captain selection collapsed to "earliest responder," ignoring spec §6 tiebreaks

**Where:** `src/lib/matching-core.ts:63-65` (`captainFor`):

```ts
function captainFor(candidates: MatchCandidate[]) {
  return [...candidates].sort((a, b) => a.respondedAt.getTime() - b.respondedAt.getTime())[0];
}
```

**What:** Spec §6 says: "1) prefer users who confirmed participation quickly,
2) prefer users with prior captain achievement, 3) prefer users close to the
group center / availability centroid, 4) tie-break randomly." Steps 2-4 are
not implemented. Tied responseAt values silently pick the first iteration
order (insertion-order in the DB result).

Spec §6 also requires a system message: `"Ionut is captain for this group.
They can confirm venue, start votes, and finalize the event."` —
`insertDraftGroup` (matching.ts:182-238) never inserts a captain-announce
`messages` row.

**Impact:** Captain assignment is deterministic but ignores prior-captain
history (could give the same demo user "captain" forever) and the
center-of-group bias spec asks for. Also no system chat message after
match — group chat opens with zero context.

**Fix:** Add a tiebreak by `(awarded captain count desc, distance from
group centroid asc, random)`; insert a system `messages` row in
`insertDraftGroup` after the captain id is known.

---

### [P1] Vote schema diverges from spec; no winner-finalization, no `votes.options`, no `closes_at`, no close-vote action

**Where:** `src/db/schema.ts:361-382` (votes table), `src/lib/votes.ts:18-87`
(`castVenueVoteAction`), `src/components/event/VoteCard.tsx:159-173` (close
button with `onClose` handler that has no server callee).

**What:**
- Schema misses both `options text[]` and `closes_at timestamptz` from
  spec data-model §2 lines 298-307.
- No `closeVoteAction` server action exists; the "Close vote" UI button is
  cosmetic. Grep `closeVote\|finalizeVote\|status.*closed` in `src/lib`
  returns 0 hits beyond reads.
- Tie-break rule is undefined in spec but emerges from the read sites
  (`events.ts:518-520`, `chat.ts:425-428`, `ics/route.ts:163-174`) as
  "votes desc, then rank asc" — three different files re-implement the
  same sort. Spec §12 says "winning option becomes event proposal" but
  doesn't define ties.
- Race condition: `castVenueVoteAction` (votes.ts:47-58) checks
  `vote.status !== 'open'` once, then inserts. Two simultaneous votes
  arriving while a captain runs a future close action could both
  succeed; today this is moot because no close action exists, but it's
  a concrete race when one is added.
- The `votes` row in the schema can't represent "time" / "duration" /
  "team split" votes (spec §12 says four topics) — current code only
  ever uses `topic='venue'`.

**Impact:** "voting" 500p rubric row (scoring-proofs.ts:197-203, status
`live`) overclaims — what's live is opening, casting, and reading; closing
and tie-resolution are not.

**Fix:** Add `options text[]` and `closesAt timestamptz` to schema,
build a server action `closeVenueVoteAction(eventId)` that
(a) verifies caller is captain, (b) writes `status='closed'`,
(c) writes the winning `venueId` to `events.venueId` (column also
missing per prior data-model audit), (d) inserts a `messages`
row in event chat. Define and document the tie-break.

---

### [P1] `MatchPercentPanel` "Schedule fit" row is structurally fake in the deterministic path

**Where:** `src/lib/ai/compat-score.ts:147-149`:

```ts
// Availability fit (20) - no signal here, assume medium.
const scheduleFit: "high" | "medium" | "low" = "medium";
score += 12;
```

And the public-profile renderer
`src/app/[locale]/u/[username]/page.tsx:170-178`:

```ts
{
  label: copy.matchRows.scheduleFit,
  value:
    compatibility.scheduleFit === "high"
      ? 100
      : compatibility.scheduleFit === "medium"
        ? 65
        : 25,
},
```

**What:** The deterministic compat path always emits `scheduleFit='medium'`
because two profiles don't carry availability/calendar data. The UI then
renders `65%` as if it were a real signal. When Groq is configured, the
returned `result.scheduleFit` is preserved (compat-score.ts:254), but
the system prompt instructs the model to "assume 'medium' when no schedule
info" (line 45) — and there is no schedule info in the user payload either
(lines 218-233). So 65% is the universal answer.

**Impact:** Every visitor sees a `65%` "Schedule fit" bar that is
load-bearing UI but carries zero information. Honesty regression for the
rubric's "no false-green claims" promise (scoring-proofs.ts:395).

**Fix:** Either drop the schedule-fit row entirely from the breakdown, or
feed real signals (e.g. recent shared prompt-window response history) into
the compat call so the value can vary.

---

### [P1] Event venue candidate distance is fabricated (1.00, 2.00, 3.00 km regardless of geometry)

**Where:** `src/lib/events.ts:282-326` (`createGroupEventAction` venue insert):

```ts
const matchingVenues = SEEDED_VENUES.filter((venue) =>
  venue.sports.includes(group.sport as SportKey),
).slice(0, 3);

const candidateVenueIds: string[] = [];
for (const [index, venue] of matchingVenues.entries()) {
  ...
  await tx.insert(eventVenueCandidates).values({
    eventId: event.id,
    venueId: venueRow.id,
    rank: index + 1,
    distanceKm: (index + 1).toFixed(2),  // <-- FAKE
    reason: venueReason(user.locale, index + 1),
  });
}
```

**What:** `distanceKm` is set to `1.00`, `2.00`, `3.00` regardless of the
group's centerLat/Lng vs venue lat/lng. The captain brief is fed this fake
distance (events/[eventId]/page.tsx:101-103) and the closest-venue picker
inside `buildFallbackCaptainBrief` (captain-brief.ts:62-67) sorts by it —
so the brief always picks the venue at "rank 1" regardless of true
geometry. The display in the venue list is also a lie.

Schema also lacks the `score` column spec §8 requires; the candidate row
has only `rank` + fake `distanceKm` + `reason`.

**Impact:** `auto-event-setup` (1000p, scoring-proofs.ts:188-195, status
`fallback`) advertises "Deterministic venue/time/weather surfaces exist"
— the venue surface is deterministic in the trivial sense (always the
same fake numbers).

**Fix:** Compute real `haversineKm({lat,lng}, {centerLat,centerLng})` per
venue, sort by distance, write the real value to `distanceKm`, optionally
add the §8 score column.

---

### [P1] Auto-event time is hardcoded `16:00 UTC tomorrow` for every captain, every group

**Where:** `src/lib/events.ts:59-64`:

```ts
function defaultEventTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setUTCHours(16, 0, 0, 0);
  return date;
}
```

**What:** Spec §11.1: "choose best time from prompt slot and member
preferences." Implementation ignores the prompt's `windowSlot`
(morning/afternoon/evening), all member preferences, and the captain's
local timezone. 16:00 UTC = 19:00 EEST in summer Romania; if a judge runs
the demo from a different TZ the UI displays the time in
`Europe/Bucharest` (events/[eventId]/page.tsx:71,75), which is fine for
the seeded RO demo but actively wrong if anyone's prompt is for
"morning" and the auto-event shows "19:00."

**Impact:** Voting on time is impossible (no time-vote support; see vote
finding above), so the captain literally cannot fix this. Auto-event
times for evening prompts are correct by accident; morning/afternoon
prompts get a mismatched event time.

**Fix:** Map `windowSlot` → preferred hour band (morning=09:00, afternoon=14:00,
evening=19:00), compute in Europe/Bucharest, optionally allow captain to
edit before publishing.

---

### [P1] `first_match` achievement is unreachable for seeded demo users

**Where:** `src/lib/matching.ts:220-231` (only insert site for achievements),
`scripts/seed-demo.ts:241-305` (seed creates group manually, never invokes
matching).

**What:** `first_match` is awarded inside `insertDraftGroup`. The demo seed
hand-rolls the group and skips matching. So `demo_alex`, `demo_maria`,
`demo_radu`, `demo_ioana` never get the achievement row, and the
`/groups/[groupId]` page check `groupResult.data.achievements.some(a =>
a.code === "first_match")` (line 75) returns `false` for every seeded
viewer. The "First Match badge" promised by `achievements` 300p row
(scoring-proofs.ts:329-336) doesn't render in the demo path.

**Impact:** Rubric overclaim — judges following the walkthrough see no
badge, even though the row is `live`.

**Fix:** Either (a) insert achievements explicitly during seed for the
seeded group's members, or (b) replace the seeded group with a real
matching call (preferred — also fixes the §4 / sizeMin proof gap).

---

### [P1] Scoring proofs flipped to `live` for AI surfaces that depend on optional `GROQ_API_KEY`

**Where:** `src/lib/demo/scoring-proofs.ts:122-130, 254-289` (commit
`d4901ba` diff above).

**What:** Five AI rows were promoted to `status='live'`:
- `compatibility-explanation` 500p
- `ai-bio-extraction` 500p
- `ai-photo-extraction` 500p
- `ai-compatibility-score` 300p
- `ai-captain-brief` 1000p

Each underlying lib (`bio-extract.ts:61`, `photo-extract.ts:27`,
`compat-score.ts:198`, `captain-brief.ts:126`) is gated by
`isGroqConfigured()` which reads `process.env.GROQ_API_KEY`. When the key
is unset (the case in `.env.example` and the default Railway boot,
unless an operator explicitly sets it), every call falls through to
deterministic copy:
- bio-extract → keyword dictionary (bio-extract.ts:94)
- photo-extract → empty array (photo-extract.ts:70) — *photo extraction
  produces literally nothing without a key*
- compat-score → deterministic (compat-score.ts:198-200)
- captain-brief → deterministic bullet (captain-brief.ts:172-173)

The status convention defined at scoring-proofs.ts:11-15 says: `live = working
in production with real data`, `fallback = claimed but limited (manual
fallback when external is offline)`. By the file's own definition, four of
these should be `fallback`, and `ai-photo-extraction` should be `pending`
without a configured key (its fallback is "no suggestions," not a
deterministic alternative).

**Impact:** Demo proofs `byStatus.live.points` is inflated by ~2,800p when
`GROQ_API_KEY` is not set. Judge Mode displays "live" badges that don't
match runtime behavior.

**Fix:** Either gate the rubric row's status on `isGroqConfigured()` at
render time (return `live` when key present, `fallback` otherwise — see
note in `audit-2026-05-09-1432-full.md:194-198` for the
`ai-compatibility-score` precedent), or revert these to `fallback` /
`pending` until a key is shipped.

---

### [P2] Compat-score weights drift from spec's stated formula

**Where:** `src/lib/ai/compat-score.ts:113-179`.

**What:** Spec §4 weight table maps cleanly to 30/20/20/10/10/10 = 100. The
implementation:
- sport (30): scaled by `0.5 + 0.5 * intersection/union` ratio (line 139),
  so two perfectly-shared-only-sport users get only 30, but two users
  sharing 1 of 5 sports get 18. Spec is unspecified on partial overlap.
- distance (20): full only if `proximityFit==='near'` (≤3km), 12 if
  same_city, 0 otherwise (lines 143-145). Spec says "decays to max
  distance" — current code is a 3-step ladder, not a decay.
- availability fit (20): always 12 (line 149). Comment admits "no signal."
- group-size (10): always 6 (line 152). Comment admits "neutral default."
- skill (10): 10/5/0 for balanced/mentor/mismatch (lines 154-157).
- AI/bio (10): always 5 (line 160). Comment admits "neutral default."

**Impact:** The 100-pt cap is preserved but **34 of 100 points are
constants** (12 + 6 + 5 + the 30-or-18 sport baseline). Minimum possible
score for two near-identical users is 30+20+12+6+10+5 = 83; max possible
delta from "perfect" to "no overlap" is ~65 points — the score is
compressed. The rendered "X% match" is therefore systematically inflated
for low-quality matches. Two users with no shared sports get score
clamped to 18 (line 164), which is the only meaningful low-end signal.

**Fix:** Either tighten the spec to say "soft factors get a constant
mid-band when the signal is missing" (and document that compressed
range), or compute real signals (recent same-prompt response → schedule
fit; existing shared groups → group-size and AI/bio).

---

### [P2] `castVenueVoteAction` writes through `closed` status if the schema is later updated

**Where:** `src/lib/votes.ts:47-58, 72-85`.

**What:** Vote insert is in two phases: `getDb().select(...status...)`
then `getDb().insert(voteChoices).values(...).onConflictDoUpdate(...)`.
There is no `tx.transaction(...)` wrap and no `WHERE` guard on the
insert that re-checks `votes.status='open'`. A close action arriving
between the select and the insert would let a stale "open" vote write
succeed.

Today this is moot because no close action exists (see [P1] above), but
the moment one is added, the race opens.

**Impact:** Late-vote contamination once close-vote ships.

**Fix:** Wrap in a transaction with `select ... for update` on the
votes row, or add a sub-select guard to the `insert ... where exists
(select 1 from votes where id=$voteId and status='open')`.

---

### [P2] Compatibility breakdown's "Shared sports" row maps to a binary 100-or-0, hiding count

**Where:** `src/app/[locale]/u/[username]/page.tsx:140-151`.

```ts
{
  label: `${copy.matchRows.sharedSports}: ${
    compatibility.sharedSports.length > 0
      ? compatibility.sharedSports
          .map((sport) => copy.sportLabels[sport] ?? sport)
          .join(", ")
      : "0"
  }`,
  value: compatibility.sharedSports.length > 0 ? 100 : 0,
},
```

**What:** The numeric bar is `100` if there's any shared sport, `0`
otherwise. So a user sharing 1 of 5 sports gets the same bar fill as a
user sharing all 5. The label text shows the names, but the visual
weight (the 100% bar) is meaningless.

**Impact:** UI signal is inverse of compat-score's actual ratio
calculation (which scales by intersection/union). Misleading bar fill.

**Fix:** Set `value` to `min(100, sharedSports.length / max(1,
viewer.sports.length) * 100)`.

---

### [P2] Team-balance algorithm is "ABBA-ABBA" not snake-draft, gives gap > 0.5 on odd-count groups

**Where:** `src/lib/team-balance.ts:69-80`.

**What:** Spec §7 says "snake-draft into two teams" with goal `average
difference <= 0.5`. The shipped algorithm assigns by `index % 4`:
slot 0→A, 1→B, 2→B, 3→A, then repeats. For 5 ranked-desc players
[5,4,3,2,1]: A=[5,2,1] avg 2.67, B=[4,3] avg 3.5 → gap 0.83.

The team-balance.test.ts:23 explicitly asserts `2.67` and `3.5`,
freezing the violating behavior into a test.

For team sports with 5/7/9/11/13 actually-confirmed members (typical
for football's max=14, min=6), this miss-the-spec-target is the
common case.

**Impact:** Rubric "team-balance" 300p (scoring-proofs.ts:206-213,
status `live`) renders bars that suggest balance but the spec
quality bar is missed for half of all member counts. Scoring
function `scoreFor(a,b) = max(0, round(100 - gap*25))` produces
79 for a 0.83 gap, 100 for 0.0, so the panel still shows "good"
copy.

**Fix:** Replace ABBA pattern with a true snake-draft. For
[5,4,3,2,1] this would give A=[5,2,1] B=[4,3] (same actually) — but
for [5,4,3,2,1,0]: ABBA pattern gives A=[5,2,1] B=[4,3,0] → 2.67 vs
2.33 (gap 0.34); snake-draft gives A=[5,2,0]=2.33 B=[4,3,1]=2.67
(gap 0.34) — *same*. The real fix is to add a swap-pass: after
ABBA, look for a single A↔B swap that reduces |avgA - avgB| and
keeps team sizes within 1.

---

### [P2] Walkthrough is not deterministic — relies on `cookies()` and dynamic redirects to the latest seeded entity

**Where:** `src/lib/demo/walkthrough.ts:15-23`,
`src/app/[locale]/demo/step/[step]/page.tsx` (and resolveStepIndex
fallback at lines 29-38).

**What:** `WALKTHROUGH_STEPS` includes resolver routes
(`/demo/step/group`, `/demo/step/event`) that look up the demo entity
at request time. If the demo was seeded multiple times (e.g. judge
clicked "Reset" between runs), the resolver picks the most recent
group/event. Repeating the walkthrough with a different judge mid-
session can route them through a stale entity.

`activePromptWindow()` uses `Europe/Bucharest` (prompt-window.ts:3),
which is correct for the seed; but the wall-clock at the moment of
walkthrough determines `windowSlot`, so the seeded prompt is bound to
whatever slot the seed call observed — if a judge runs the
walkthrough across a slot boundary (e.g. starts at 16:55, ends at
17:05), the prompt the demo shows is no longer the "active" prompt
the matching engine would pick for new responses.

**Impact:** Possible mid-walkthrough surprises. Not a hard bug;
documented here because the prior audit asked about determinism.

**Fix:** Pin the walkthrough to a single demoRunId in the
walkthrough cookie, and resolve step targets against that ID
deterministically.

---

### [P2] Demo seed is enabled only when both `ALLOW_DEMO_SEED=true` AND `DEMO_SEED_CONFIRM=showup2move`, but `/demo` page also requires `ALLOW_DEMO_MODE`

**Where:** `src/lib/demo/guard.ts:51-54` (seed gate),
`src/lib/demo/guard.ts:5-7` (mode gate),
`src/app/[locale]/demo/page.tsx:47-51` (page calls `ensureDemoSeeded`
which is no-op when seed disabled).

**What:** Three env flags interlock. If `ALLOW_DEMO_MODE=true` but
seed flags are missing, the demo page renders without seeding —
empty rubric panel. Documented behavior, but if the Railway env is
configured as "demo on, seed off" the auto-seed goal of commit
`d8e43bd` is silently defeated.

**Impact:** Latent demo emptiness on misconfigured deploys.

**Fix:** Either (a) make `ALLOW_DEMO_MODE` imply `ALLOW_DEMO_SEED`,
or (b) surface a Judge-Mode banner when seed is disabled but mode is
on, so operators see the misconfig.

---

### [P2] Weather has no caching layer; every captain page-render hits Open-Meteo

**Where:** `src/lib/weather.ts:127-133`
(`fetch(...)` with `cache: 'no-store'`),
`src/app/[locale]/events/[eventId]/page.tsx:58-65`.

**What:** Every render of an event page issues a fresh Open-Meteo call
from the server. With `cache: 'no-store'` Next can't dedupe inside a
render, and there is no application-level cache. Open-Meteo's free
tier is 10K calls/day per IP; demo+production sharing the same
deployment IP could trip it on a noisy demo. On API failure the
function returns `null` and the UI falls back to "no weather" rather
than to a previously-good cached value.

The `events.weatherCacheJson` jsonb column referenced in the spec
data-model (line 226) is **not in the actual schema**.

**Impact:** Brittle demo if Open-Meteo throttles or stalls during
judging. `weather-aware` 300p rubric row (status `fallback`,
scoring-proofs.ts:239-247) is honest about the fallback but the
fallback is "show nothing," not "show stale-but-real."

**Fix:** Add `events.weatherCacheJson` and store the latest forecast
keyed by venueId+whenAt rounded to the nearest hour; serve stale on
API failure.

---

### [P2] `/today` "no_match" path doesn't recommend manual event creation per spec §4

**Where:** `src/lib/matching.ts:241-263` writes
`matchFailureReason='no_compatible_group'`,
`src/lib/prompt.ts:248-250` returns `{state:'no_match'}` without further
hint.

**What:** Spec §4 line 87 says when a user can't be matched, "app
recommends manual event creation or smaller sport." The `/today` UI
shows a generic "no match" state without a CTA to `/events/new` or
to lower the user's `maxDistanceKm` / pick a different sport.

**Impact:** Dead-end for the queued-but-unmatched user. Contradicts
the spec's "every empty/loading/error state needs a visible next
action" rule (AGENTS.md UX section).

**Fix:** Add a "Try manual event" CTA on the no_match `/today` panel.

---

### [P2] `eventVenueCandidates` distinct-distance assumption breaks the read-side dedup

**Where:** `src/lib/events.ts:316-326` (insert with rank=1..3 plus
`distanceKm=1.00..3.00`), `src/lib/events.ts:486-527` (read with
`sort((a, b) => b.votes - a.votes || a.rank - b.rank)`).

**What:** Read sites tie-break by rank when vote counts are equal.
With three venues all at fake distances, the rank serves as the
permanent ordering. If the insert ever produces two venues at the
same rank (currently impossible by index loop, but `onConflictDoUpdate`
on `venues_source_external_unique` could in principle race two events
sharing a venue), the primary key on
`(eventId, venueId)` plus `index('event_venue_candidates_event_rank_idx').on(eventId,
rank)` is a non-unique index, allowing duplicate ranks per event.
Tie-break would then become PK order, which is non-deterministic.

**Impact:** Latent ordering bug. Currently masked by the linear loop.

**Fix:** Promote `event_venue_candidates_event_rank_idx` to a unique
index per `(eventId, rank)`.

---

### [P3] Compatibility cache key includes user id so cross-user-pair sharing of cache rows is impossible

**Where:** `src/lib/ai/compat-score.ts:181-190` (`userFingerprint`
includes `user.id`).

**What:** Cache row is keyed by both users' IDs (sorted), so two
*different* user pairs with otherwise identical
sports/skill/city/distance still issue separate Groq calls. Spec §11
"cache AI results" intent is satisfied for repeated views of the
same pair only.

**Impact:** Higher Groq cost than necessary; not a correctness bug.

**Fix:** Drop `user.id` from the fingerprint and key only by
`(sortedSports, skillLevel, city, distanceBand)`. Trade-off: less
specificity but cheaper.

---

### [P3] ICS DTSTART is in UTC (`Z` suffix), not floating with TZID

**Where:** `src/lib/calendar.ts:19-21, 47-48`.

**What:** Both DTSTART and DTEND emit `YYYYMMDDTHHMMSSZ` (Zulu).
Apple/Google/Outlook all interpret correctly. Spec doesn't require
TZID. UID format `${event.id}@showup2move` is stable across re-fetches
(line 45) — good. SUMMARY uses `event.title` which is `notNull` per
schema (db/schema.ts:231) — good.

**Impact:** None today. Note for future: a captain who edits
event time post-export sees the next .ics download produce a new
DTSTAMP but the same UID, so calendar clients update in-place.
This is correct ICS semantics.

**Fix:** None required.

---

### [P3] `CompatibilityUser.maxDistanceKm` is hardcoded to 10 in deterministic compat path

**Where:** `src/lib/ai/compat-score.ts:127`:

```ts
// Use the minimum of any explicit per-user max - we don't have it here so
// fall back to a generous default of 10km when both users tolerate it.
const maxDistanceKm = 10;
```

**What:** Profile compat path doesn't carry per-user maxDistanceKm
into `scoreCompatibilityDeterministic`. Anyone with maxDistanceKm=3
who's at 8km from the viewer still gets `proximityFit='same_city'`
or `'far'` based on the hardcoded 10. The per-user gate is honored
at matching time but not at compat-display time.

**Impact:** Cosmetic mislabel for tight-radius users on the public
profile.

**Fix:** Plumb `maxDistanceKm` through `CompatibilityUser` (already
loaded in `loadCompatProfile` at profile-public.ts:118) and pass
the smaller of viewer/target.

## Summary table

| Pri | Finding | File:line | Spec §  |
|----:|---|---|---|
| P0 | Demo seed bypasses matching, only 4 users | scripts/seed-demo.ts:36-93,241-280 | 14 §13 |
| P0 | Notification creation has zero insert sites | src/lib/notifications.ts (read-only) | 02 |
| P1 | §4 ranking score + 55 threshold absent | src/lib/matching-core.ts:91-143 | 14 §4 |
| P1 | Captain selection collapsed to FIFO | src/lib/matching-core.ts:63-65 | 14 §6 |
| P1 | Vote schema/close-action missing | src/db/schema.ts:361-382, src/lib/votes.ts | 14 §12 |
| P1 | Schedule fit row is fake (always 65%) | src/lib/ai/compat-score.ts:147-149 | 05 §5 |
| P1 | Venue distanceKm fabricated 1.00/2.00/3.00 | src/lib/events.ts:282-326 | 14 §8 |
| P1 | Auto-event time hardcoded 16:00 UTC | src/lib/events.ts:59-64 | 14 §11 |
| P1 | first_match achievement unreachable in seed | src/lib/matching.ts:220-231 | 02 §2 |
| P1 | Scoring proofs over-claim AI rows as `live` | src/lib/demo/scoring-proofs.ts:122-130,254-289 | 13 |
| P2 | Compat weights compress range | src/lib/ai/compat-score.ts:113-179 | 14 §4 |
| P2 | Vote write race window | src/lib/votes.ts:47-85 | 14 §12 |
| P2 | Shared-sports breakdown is binary | src/app/[locale]/u/[username]/page.tsx:140-151 | 05 §5 |
| P2 | Team-balance violates 0.5-gap goal | src/lib/team-balance.ts:69-80 | 14 §7 |
| P2 | Walkthrough not deterministic | src/lib/demo/walkthrough.ts:15-38 | 13 |
| P2 | Demo flags interlock can defeat auto-seed | src/lib/demo/guard.ts | 13 |
| P2 | Weather has no cache | src/lib/weather.ts:127-133 | 02 §2 |
| P2 | no_match path missing manual-event CTA | src/lib/matching.ts:241-263, src/lib/prompt.ts:248-250 | 14 §4 |
| P2 | event_venue_candidates rank not unique | src/db/schema.ts:355-358 | 02 §3 |
| P3 | Compat cache key includes user id | src/lib/ai/compat-score.ts:181-190 | 05 §11 |
| P3 | ICS DTSTART uses UTC Z (acceptable) | src/lib/calendar.ts:19-21,47-48 | - |
| P3 | maxDistanceKm hardcoded in compat | src/lib/ai/compat-score.ts:127 | 14 §4 |
