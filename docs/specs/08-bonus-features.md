# 08 - Bonus Features

## 1. Bonus Strategy

Bonus features should be visible in the demo, simple to explain, and low-risk. Each bonus must connect back to the core loop: answer prompt -> match -> coordinate -> show up.

## 2. Calendar Integration - 300p

MVP:

- `.ics` export from event page
- "Add to calendar" button
- includes title, time, location, description, group link

Stretch:

- Google Calendar link
- Outlook Calendar link
- full Google Calendar OAuth is out of scope unless the core demo is already stable

Data needed:

- `events.when_at`
- `events.duration_min`
- venue/custom location
- event URL

## 3. Weather-Aware Recommendations - 300p

Use Open-Meteo.

Surfaces:

- Today card: weather hint for current slot
- Auto-event setup: prefer indoor venues if rain/wind is bad
- Event page: weather forecast card

Rules:

| Condition | Behavior |
|---|---|
| rain probability > 60% | recommend indoor venues |
| wind > 35 km/h | warn for tennis/badminton |
| temperature < 5 C | suggest indoor or shorter duration |
| clear weather | highlight outdoor option |

## 4. Team Balancing by Skill - 300p

Use deterministic team split:

1. Sort players by skill level descending.
2. Snake-draft into Team A and Team B.
3. Balance captain/known activity only if a real wearable import or labeled fixture exists.
4. Show "balanced enough" score.

Visible surface:

```text
Team balance
A: 3.4 avg skill
B: 3.3 avg skill
[Shuffle teams]
```

## 5. Gamification / Achievements - 300p

Keep it lightweight.

Achievements:

- First Match
- Showed Up 3 Times
- Captain Mode
- Weather Warrior
- Team Balancer
- Early Bird

Surfaces:

- profile
- post-event summary
- leaderboard bonus page

Avoid fake addictive mechanics. It should reward real participation.

## 6. Multi-Language Support - 200p

Locales:

- Romanian primary
- English secondary

Implementation:

- `next-intl`
- URL prefix `/ro`, `/en`
- locale stored in session/user profile
- strings in JSON

Demo:

- switch language on `/today`
- show same flow in RO and EN

## 7. Social Sharing / Invites - 200p

Features:

- invite link per event
- share sheet on mobile
- copy link fallback
- public event preview with limited details

Privacy:

- invite link does not expose private chat
- exact member list hidden until login/join
- event owner can revoke link

## 8. Wearables / Fitness Integrations - 500p

Use Strava as the only feasible real integration. This row is **not claimed** unless OAuth/import works in the demo or the judges explicitly accept a clearly labeled fixture.

Real bonus proof:

- connect Strava OAuth
- import recent activity sport types
- mark sport tags as "verified by Strava"
- use recent activity as teammate recommendation signal

Fallback demo fixture:

- seed one `demo_activity`/mocked Strava import for Judge Mode
- label it as a fixture, not live OAuth
- use it only to explain how the integration would influence recommendations

Stretch:

- activity webhook
- post-event "recorded activity" badge

Why Strava:

- broad sports coverage
- web OAuth, no native app required
- visible demo value without wearable hardware

## 9. Innovation Bonus

Innovation ideas that are feasible:

- **Group Formation Timeline**: show why a group formed step-by-step.
- **AI Captain Brief**: summarize group availability, venue options, weather, and decision needed.
- **Plan B Generator**: if too few players or rain, suggest smaller sport or indoor venue.
- **Vibe-safe Matching**: use bio/interests only for positive shared context, not sensitive inference.
- **Demo Mode Seeds**: one command creates realistic Romanian demo users and events.

## 10. Bonus Priority

Build order:

1. Weather-aware recommendations
2. Calendar `.ics`
3. Team balancing
4. Multi-language
5. Social sharing
6. Gamification
7. Wearables/Strava only if real OAuth/import or accepted fixture is ready

Reason: this order maximizes visible points and avoids OAuth risk until the core product is stable. A greyed "coming soon" Strava button scores 0 and should not be shown as proof.
