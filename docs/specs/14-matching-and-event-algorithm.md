# 14 - Matching & Event Algorithm

This doc turns the highest-value rubric categories into implementable rules.

## 1. Inputs

For a prompt window:

- users who answered `yes`
- optional sport override from the prompt response
- profile sports and skill levels
- city, home lat/lng, and max distance
- availability window
- recent activity signals from Strava, if connected
- weather and venue data, if event setup is requested

## 2. Candidate Filtering

Hard gates:

1. User answered `yes` for the same prompt.
2. User has at least one sport in common with the group sport.
3. User is within max distance by Haversine. Same-city text is a fallback only when coordinates are missing and must be labeled lower confidence.
4. User is not banned/deleted.
5. User is not already confirmed in another active group for the same prompt window.

Soft gates:

- skill similarity
- bio/interests compatibility
- recent activity
- prior successful group history

## 3. Group Formation

Pseudo-flow:

```text
for each prompt:
  gather yes responses
  expand each user into candidate sports
  bucket candidates by sport
  within each sport, bucket by proximity using bounding box + Haversine
  sort buckets by count descending
  for each bucket:
    while enough users for sport.sizeMin:
      choose group seed with highest availability certainty
      rank candidates around seed
      take up to sport.sizeIdeal, never over sizeMax
      create group transactionally
      create group_members
      assign captain
      write system chat message
```

Transaction/idempotency:

- lock prompt row or use advisory lock by `prompt_id`
- check existing active membership before insert
- unique guard on active membership per prompt/user
- retry conflict once

Distance rule:

- Use each user's prompt override radius if present, else `users.maxDistanceKm`.
- Two users are compatible only when both users are within the smaller of their two allowed radii from the candidate group center or seed user.
- Demo proof must include a near candidate that passes and a far candidate that fails.

## 4. Ranking Score

Total: 100 points.

| Factor | Weight | Notes |
|---|---:|---|
| sport match | 30 | exact prompt override beats profile-only |
| distance | 20 | full points under 2km, decays to max distance |
| availability fit | 20 | same slot and response recency |
| group-size contribution | 10 | fills ideal size without exceeding max |
| skill balance | 10 | avoids all beginners/all advanced unless sport permits |
| AI compatibility | 10 | cached Groq score or deterministic fallback |

Minimum to auto-match: 55.

Below 55 or outside the hard distance gate:

- user stays in queue
- app recommends manual event creation or smaller sport

## 5. Group Size Rules

| Sport | Min | Ideal | Max | Notes |
|---|---:|---:|---:|---|
| football | 6 | 12 | 14 | even teams preferred |
| basketball | 4 | 8 | 10 | even teams preferred |
| tennis | 2 | 4 | 4 | doubles if 4 |
| volleyball | 6 | 12 | 14 | even teams preferred |
| badminton | 2 | 4 | 4 | doubles if 4 |
| running | 1 | 4 | 8 | solo allowed, group preferred |
| cycling | 1 | 4 | 8 | solo allowed, group preferred |
| yoga | 2 | 6 | 12 | instructor/captain optional |
| hiking | 2 | 6 | 12 | weather-sensitive |
| table_tennis | 2 | 4 | 4 | doubles if 4 |

## 6. Captain Selection

Default strategy:

1. prefer users who confirmed participation quickly
2. prefer users with prior captain achievement
3. prefer users close to the group center / availability centroid
4. tie-break randomly

If no clear candidate:

- random captain
- captain can hand off

System message:

```text
Ionut is captain for this group. They can confirm venue, start votes, and finalize the event.
```

## 7. Team Balancing

For team sports:

1. convert skill level to score: beginner=1, casual=2, intermediate=3, advanced=4, competitive=5
2. sort by score descending
3. snake-draft into two teams
4. compute average skill difference
5. allow captain to reshuffle

Good balance:

- average difference <= 0.5
- team sizes differ by at most 1

## 8. Venue Ranking

Inputs:

- group center point
- sport kind
- venue source
- venue tags
- price tier
- weather
- indoor/outdoor
- seeded/cached/manual source reliability

Score: 100 points.

| Factor | Weight |
|---|---:|
| distance to group center | 35 |
| sport fit | 25 |
| weather fit | 15 |
| price tier | 10 |
| known/cached reliability | 10 |
| accessibility/public transport hint | 5 |

Fallback:

- use seeded local venues first for demo reliability
- if Overpass fails, use cached venues
- if no cached venues, captain enters custom location

## 9. Price Tier Heuristic

| Venue signal | Tier |
|---|---|
| public park, trail, school yard marked public | free |
| public court/pitch with no fee tag | `$` |
| private sports base, club, indoor court | `$$` |
| premium club, reservation-only, padel/tennis indoor | `$$$` |
| unknown | `unknown` |

Never present heuristic prices as exact prices. Label them as "rough price tier" plus confidence:

| Confidence | Meaning |
|---|---|
| `verified` | seeded or imported known venue price |
| `captain_entered` | captain manually entered/confirmed it |
| `estimated` | inferred from venue type/tags |
| `unknown` | no useful signal |

## 10. Weather Rules

| Weather | Rule |
|---|---|
| rain probability > 60% | prefer indoor venue |
| wind > 35 km/h | warn for tennis, badminton, cycling |
| temperature < 5 C | prefer indoor or shorter event |
| temperature > 32 C | prefer evening or shaded venue |
| clear weather | boost outdoor venues |

## 11. Auto-Event Setup

Auto-event setup should be visible as a captain tool.

Flow:

1. choose best time from prompt slot and member preferences
2. search ranked venues
3. fetch weather
4. generate plan with deterministic ranking
5. optionally ask Groq to explain the selected plan as an AI Captain Brief
6. captain confirms or starts a vote

Output:

```ts
type AutoEventCandidate = {
  sport: SportKey;
  whenAtIso: string;
  durationMin: number;
  venueId?: string;
  priceTier?: 'free' | '$' | '$$' | '$$$' | 'unknown';
  priceConfidence?: 'verified' | 'captain_entered' | 'estimated' | 'unknown';
  weatherHint?: string;
  score: number;
  reason: string;
  captainBrief?: string;
};
```

## 12. Voting

Vote types:

- time
- venue
- duration
- team split

Rules:

- one active vote per topic per group
- one choice per user
- captain can close vote early if all confirmed members voted
- winning option becomes event proposal

Event chat:

- group chat gets a system message when a vote/event is created
- event chat is a separate message scope keyed by `event_id`
- event chat opens only to group members/event attendees
- demo proof must show a message that appears in event chat but not in group chat

## 13. Tests

Unit:

- group size boundaries
- distance scoring
- skill balancing
- venue ranking
- weather rules
- price tier heuristic

Integration:

- simultaneous Yes responses do not create duplicate memberships
- captain assigned once
- auto-event creates event and system message
- vote winner updates event proposal

E2E:

- seeded football group forms with 10-14 users
- seeded tennis group forms with 2-4 users
- map/venue event flow works with external APIs mocked
- near/far proximity proof works without PostGIS
- event chat is isolated from group chat
