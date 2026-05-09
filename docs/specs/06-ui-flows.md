# 06 - UI Flows

## 1. Product Principle

The app should feel like a live sports coordination tool, not a generic social network. The first screen after login is always action-oriented: **Are you available today?**

Primary viewport: 360px wide mobile.
Desktop is a richer command center for maps, chat, and captain tools.

## 2. Navigation

Mobile bottom nav:

```text
[Today] [Groups] [Create] [Map] [Profile]
```

Mobile `Create` opens `/events/new`. Desktop keeps `Events` as the list/index and exposes a `New event` action in the page header. `/events/new` is allowed before matching only as a manual public event with limited features; group-linked auto-event setup requires an active group/captain flow.

Desktop shell:

```text
┌────────────────────────────────────────────────────────────┐
│ ShowUp2Move     Today Groups Events Map Notifications Profile│
├───────────────┬────────────────────────────────────────────┤
│ Quick status  │ Page content                               │
│ Active group  │                                            │
│ Next event    │                                            │
└───────────────┴────────────────────────────────────────────┘
```

## 3. Screen Inventory

Mandatory:

- `/` landing
- `/signup`
- `/login`
- `/recover`
- `/onboarding/profile`
- `/onboarding/sports`
- `/onboarding/location`
- `/onboarding/photo`
- `/today`
- `/groups`
- `/groups/[id]`
- `/events`
- `/events/new`
- `/events/[id]`
- `/notifications`
- `/map`
- `/settings`
- `/u/[username]`

Bonus:

- `/leaderboard`
- `/calendar`
- `/settings/integrations`

## 4. Landing Page

Purpose: make the idea obvious in 5 seconds and get judges into the demo.

First viewport:

```text
┌──────────────────────────────┐
│ ShowUp2Move              Log in│
│                              │
│ Show up today.               │
│ Find the group, venue,       │
│ and time in one tap.         │
│                              │
│ [Start playing] [View demo]  │
│                              │
│ Live cards:                  │
│ Football 12/14 nearby        │
│ Tennis 3/4 at 18:00          │
└──────────────────────────────┘
```

The landing should avoid a heavy marketing page. It should show the real product mechanic: prompt, matching, chat, event.

## 5. Signup

```text
┌──────────────────────────────┐
│ Create account               │
│                              │
│ Username                     │
│ [andrei27_________________]  │
│ Password                     │
│ [********_________________]  │
│                              │
│ [Create account]             │
│ Already playing? Log in      │
└──────────────────────────────┘
```

States:

- username taken
- weak password
- rate limited
- loading
- success with recovery code

## 6. Onboarding

Use Glamingo's pro onboarding pattern as the reference mechanic, adapted down to a lightweight consumer flow:

- centered onboarding shell with compact logo/header
- path-persisted step state: `/onboarding/profile`, `/onboarding/sports`, `/onboarding/location`, `/onboarding/photo`
- mobile sticky action bar for Back/Next
- desktop card shell with clear step title, subtitle, and progress
- accessible progress region with `aria-valuenow`
- step-level validation before continuing
- step commit hook before navigation so uploads/saves cannot be skipped accidentally
- app entry redirects to the next missing required step until profile, sports, and location are present
- after required steps are present, `/today` can show a slim "Finish setup" banner for optional photo/AI suggestions
- optional photo is recommended, not blocking

Do not copy Glamingo's pro-specific complexity: Supabase bootstrap recovery, worker/business roles, phone verification, billing, or publish gates.

### 6.1 Name + Bio

```text
┌──────────────────────────────┐
│ Step 1 of 4                  │
│ How should people see you?   │
│ [Andrei Popescu___________]  │
│ @andrei27                    │
│                              │
│ What do you like to play?    │
│                              │
│ [I play football after work  │
│  and run on weekends...]     │
│                              │
│ [Sparkles] Suggest sports    │
│                              │
│ Suggested:                   │
│ [football 92%] [running 81%] │
│                              │
│ [Next]                       │
└──────────────────────────────┘
```

### 6.2 Sports

```text
┌──────────────────────────────┐
│ Step 2 of 4                  │
│ Choose sports                │
│                              │
│ [Football] Intermediate  [-][+]│
│ [Tennis]   Beginner      [-][+]│
│ [Running]  Advanced      [-][+]│
│                              │
│ Add another sport            │
│ [Next]                       │
└──────────────────────────────┘
```

### 6.3 Location

```text
┌──────────────────────────────┐
│ Step 3 of 4                  │
│ Where can you play?          │
│                              │
│ City                         │
│ [Timisoara_______________]   │
│ [Use my location]            │
│                              │
│ Distance                     │
│ 1km ---o----- 10km           │
│                              │
│ [Next]                       │
└──────────────────────────────┘
```

### 6.4 Photo

```text
┌──────────────────────────────┐
│ Step 4 of 4                  │
│ Add a photo                  │
│                              │
│ [Upload area]                │
│                              │
│ [Analyze with AI]            │
│ Suggested from photo:        │
│ [tennis 76%]                 │
│                              │
│ [Finish] [Skip]              │
└──────────────────────────────┘
```

### 6.5 Incomplete Setup Banner

Shown on `/today`, `/groups`, and `/events` if setup is incomplete.

```text
┌──────────────────────────────┐
│ 2/4 setup complete           │
│ Next: choose sports          │
│ [Continue setup]             │
│ ▓▓▓░░░░░                     │
└──────────────────────────────┘
```

Priority order:

1. full name + bio
2. sports + skill
3. location
4. photo suggestion

The banner should be slim, dismissible only after the required steps are complete, and never block the ShowUpToday prompt once name, sports, and location are present.

## 7. Today Screen

This is the product's main screen.

```text
┌──────────────────────────────┐
│ Today                        │
│ Timisoara · 18:00 window     │
│                              │
│ ShowUpToday?                 │
│                              │
│ [Yes, I can play]            │
│ [Not today]                  │
│                              │
│ Sports for today             │
│ [football] [running] [+]     │
│                              │
│ Weather: clear, 18 C         │
└──────────────────────────────┘
```

After Yes:

```text
┌──────────────────────────────┐
│ Matching you...              │
│                              │
│ 8 nearby football players    │
│ 6 available at 18:00         │
│ 4 high compatibility fits    │
│                              │
│ [spinner]                    │
└──────────────────────────────┘
```

If not enough players:

```text
┌──────────────────────────────┐
│ You're in the queue          │
│ 1 nearby tennis player now   │
│ Need 1 more to play singles  │
│                              │
│ Plan B                       │
│ Try running nearby or create │
│ a small manual event.        │
│                              │
│ [Invite teammate] [Plan B]   │
└──────────────────────────────┘
```

Matched:

```text
┌──────────────────────────────┐
│ You're in                    │
│ Football · 10/12 players     │
│ Captain: Ionut               │
│                              │
│ Venue suggestion             │
│ Baza 2 · 2.1km · $$ est.     │
│ Why this group?              │
│ Same sport · 1.4km avg · 18h │
│                              │
│ [Open group chat]            │
│ [Confirm participation]      │
└──────────────────────────────┘
```

## 8. Group Screen

Mobile Plan tab:

```text
┌──────────────────────────────┐
│ Football today          10/12│
│ Captain: Ionut               │
│ [Confirmed 8] [Maybe 2]      │
│ [Plan] [Chat] [Players]      │
│                              │
│ Event proposal               │
│ 18:30 · Baza 2 · $$          │
│ [Going] [Maybe] [No]         │
└──────────────────────────────┘
```

Mobile Chat tab:

```text
┌──────────────────────────────┐
│ Football today          10/12│
│ [Plan] [Chat] [Players]      │
│                              │
│ Maria: 18:30 works           │
│ Ionut: booking court now     │
│ [Message...] [send icon]     │
└──────────────────────────────┘
```

Mobile Players tab:

```text
┌──────────────────────────────┐
│ Football today          10/12│
│ [Plan] [Chat] [Players]      │
│                              │
│ Ionut      Captain Confirmed │
│ Maria      Confirmed         │
│ Andrei     Maybe             │
│ [Confirm participation]      │
└──────────────────────────────┘
```

Desktop:

```text
┌──────────────┬────────────────────┬────────────────┐
│ Members      │ Chat               │ Event tools    │
│ 10/12        │ messages           │ venue map      │
│ skill mix    │ input              │ vote panel     │
│ captain      │                    │ weather        │
└──────────────┴────────────────────┴────────────────┘
```

Group screen rules:

- Mobile uses tabs/segmented control for Plan, Chat, and Players so chat and event planning do not fight for vertical space.
- Desktop uses three columns.
- "Why this group?" opens the Group Formation Timeline: distance gate, shared sport, skill mix, group-size fit, and AI explanation.
- Captain badge is visible beside the captain's name and in the members list.

## 8.1 Event Detail and Event Chat

```text
┌──────────────────────────────┐
│ Football at Baza 2           │
│ Today 18:30-20:00            │
│ 8 going · 2 maybe            │
│                              │
│ [Details] [Event chat] [Vote]│
│                              │
│ Venue                        │
│ Baza 2 · 2.1km · $$ est.     │
│ [Directions] [Copy invite]   │
│                              │
│ Event chat                   │
│ Ionut: Court confirmed       │
│ Maria: Bringing a ball       │
│ [Message...] [send icon]     │
└──────────────────────────────┘
```

Event chat is a separate thread filtered by `eventId`. The group chat can show system messages that an event was proposed or confirmed, but that does not count as event-specific chat.

## 9. Event Creation

Manual event:

```text
┌──────────────────────────────┐
│ Create event                 │
│ Sport [Football v]           │
│ Time  [Today 18:30]          │
│ Venue [Search nearby]        │
│                              │
│ Suggested venues             │
│ Baza 2        2.1km  $$      │
│ Parcul Rozelor 1.4km free    │
│                              │
│ [Create event]               │
└──────────────────────────────┘
```

Captain auto-event:

```text
┌──────────────────────────────┐
│ Suggested plan               │
│ Football at Baza 2           │
│ Today, 18:30-20:00           │
│                              │
│ Why this works               │
│ 8 members voted after 18:00, │
│ weather is clear, venue is   │
│ closest to the group center. │
│                              │
│ [Confirm plan] [Start vote]  │
└──────────────────────────────┘
```

## 10. Map Screen

```text
┌──────────────────────────────┐
│ Nearby games                 │
│ [Football] [Tennis] [Today]  │
│                              │
│             MAP              │
│     pins: venues/events      │
│                              │
│ Bottom sheet                 │
│ Baza 2 · Football · 18:30    │
│ [Join] [Details]             │
└──────────────────────────────┘
```

Map rules:

- lazy-load MapLibre
- never block the Today screen on map JS
- cluster pins on desktop and mobile
- show list fallback if map fails
- show venue pins, group radius circle, distance chips, and directions links
- never show exact member home locations; only use approximate group center and public venue locations
- include Apple/Google/Waze-compatible external directions links where possible
- public `/map` shows public venue/event pins only
- group center/radius appears only to group members or event attendees, rounded/jittered and labeled approximate

## 10.0 Notifications

Route: `/notifications`.

```text
┌──────────────────────────────┐
│ Notifications                │
│ Match ready                  │
│ Football group formed        │
│ [Open group] [Mark read]     │
│                              │
│ Vote closing soon            │
│ Baza 2 is leading            │
│ [Open vote] [Mark read]      │
└──────────────────────────────┘
```

Entry points:

- header bell on mobile and desktop
- desktop nav item
- toast action after prompt/match/vote updates

## 10.1 Vote Modal

```text
┌──────────────────────────────┐
│ Vote: choose a venue         │
│ Baza 2          6 votes      │
│ Parcul Rozelor  3 votes      │
│ Custom location 1 vote       │
│                              │
│ [Cast vote] [Close vote]     │
└──────────────────────────────┘
```

Voting states:

- open
- voted
- closed
- tie needs captain decision
- all confirmed members voted, captain can close early

## 10.2 Judge / Demo Mode

Guarded route: `/demo`.

```text
┌──────────────────────────────┐
│ Judge Mode                   │
│ Railway health      green    │
│ Demo seed          loaded    │
│ AI cache           ready     │
│ Rubric proof       live/seeded │
│                              │
│ [Seed demo] [Reset demo]     │
│ [Open scripted flow]         │
└──────────────────────────────┘
```

This screen exists only when demo mode is enabled. It should list each rubric row, the exact screen/action proving it, and whether the proof is live, seeded, or fallback.

## 11. Empty States

| Surface | Empty state | Primary action |
|---|---|---|
| no active prompt | "No prompt is open right now." | "Create prompt" in demo/admin or "Check again later" |
| answered No today | "Rest day logged." | "Change to Yes" |
| no groups | "Answer today's prompt to form your first group." | "Go to Today" |
| no events | "No events yet. Create one or wait for today's match." | "Create event" |
| no venue results | "No venue found nearby. Add a custom location." | "Add custom location" |
| no AI suggestions | "No confident suggestion. Pick sports manually." | "Choose sports" |
| no chat | "Say where and when works for you." | focus message composer |
| no event chat | "Event-specific updates will appear here after the plan is confirmed." | "Open event details" |
| no notifications | "You're caught up. New matches, votes, and event updates will appear here." | "Back to Today" |
| no match yet | "You're queued. We'll match you as soon as enough nearby players answer Yes." | "Invite teammate" |

## 12. Loading and Error States

| Surface | Loading | Error/fallback |
|---|---|---|
| Today matching | stable matching card with count placeholders | queued state + Plan B action |
| group chat | skeleton rows with fixed composer | failed send stays in composer with retry |
| event chat | skeleton rows scoped to event tab | reconnect banner, retry load |
| notifications | fixed-height notification rows | retry + "Back to Today" |
| map | fixed aspect-ratio map shell | venue list fallback + directions links |
| AI analysis | progress row with cancel | manual sport chips |
| upload | thumbnail placeholder | invalid type/size/dimensions copy |
| Judge Mode | proof-row skeletons | seed/reset/scoring error with retry and no false green state |

## 13. Demo Script

1. Open landing page and explain one-tap sports matching.
2. Sign up as a new user.
3. Enter bio and run AI sport extraction.
4. Upload sport photo and run AI vision extraction.
5. Set location and skill.
6. Answer "Yes" on `/today`.
7. Auto-match into a group.
8. Show compatibility explanation.
9. Open live chat in a second browser.
10. Captain confirms auto-event with venue, price confidence, weather, map, directions.
11. Start a vote.
12. Export `.ics` invite.
13. Open event-specific chat.
14. Switch language RO/EN.
15. Show Judge Mode, Railway deployment, and CI checks.
