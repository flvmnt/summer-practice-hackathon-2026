# 06 - UI Flows

## 1. Product Principle

The app should feel like a live sports coordination tool, not a generic social network. The first screen after login is always action-oriented: **Are you available today?**

Primary viewport: 360px wide mobile.
Desktop is a richer command center for maps, chat, and captain tools.

## 2. Navigation

Mobile bottom nav (5 tabs - canon, do not reduce to 4):

```text
[Today] [Groups] [Create] [Map] [Profile]
```

The 5-tab arrangement is locked. `Create` is the centered tab and uses the `--accent` (sodium orange) treatment as the only action-colored item in the bar; the other four tabs use `--ink` icons with active state `--ink` plus a 2px `--accent` underline. Do not replace the centered `Create` tab with a floating action button - the FAB pattern is rejected because it hides the verb on small screens and conflicts with the warm-cream chrome.

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
- success with recovery code (see Recovery-code reveal screen below)

### 5.1 Recovery-code reveal screen

Shown immediately after successful signup, before any onboarding step. Matches the design canvas screen 01.

```text
┌──────────────────────────────┐
│ s2m                          │
│                              │
│ Save this recovery code      │
│ It is the only way to get    │
│ back into your account.      │
│                              │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│ │ RX │ │ 7Q │ │ K9 │ │ VB │  │
│ └────┘ └────┘ └────┘ └────┘  │
│ ┌────┐                       │
│ │ 2T │                       │
│ └────┘                       │
│                              │
│ [Copy] [Download .txt]       │
│                              │
│ ☐ I saved it somewhere safe  │
│ [Continue]  (disabled until  │
│              checkbox ticked)│
└──────────────────────────────┘
```

Rules:

- Each block renders one segment of the recovery code in `JetBrains Mono 28px`, weight 500, on `--surface-2` with `--r-chip` corners and a `--line-2` hairline.
- Copy button writes the full code to clipboard and shows a Toast confirmation; Download writes a `.txt` named `s2m-recovery-<username>.txt`.
- Continue is disabled until the "I saved it" checkbox is ticked - this is a hard gate, not a soft hint.
- The recovery code is shown exactly once per signup. After Continue, route to `/onboarding/profile`.
- Never log the code to console, telemetry, or server logs.

## 6. Onboarding

Use Glamingo's pro onboarding pattern as the reference mechanic, adapted down to a lightweight consumer flow. **Four steps, locked**: profile (name + bio), sports, location, photo.

- centered onboarding shell with compact `s2m` wordmark in header
- path-persisted step state: `/onboarding/profile`, `/onboarding/sports`, `/onboarding/location`, `/onboarding/photo`
- mobile sticky action bar for Back/Next using `WizardStickyActionBar`
- desktop card shell with clear step title, subtitle, and progress (4-dot ratchet using `RatchetRow`)
- accessible progress region with `aria-valuenow="N"` and `aria-valuemax="4"`
- step-level validation before continuing
- step commit hook before navigation so uploads/saves cannot be skipped accidentally
- app entry redirects to the next missing required step until profile, sports, and location are present
- after required steps are present, `/today` can show a slim "Finish setup" banner for optional photo/AI suggestions
- optional photo is recommended, not blocking

Do not copy Glamingo's pro-specific complexity: Supabase bootstrap recovery, worker/business roles, phone verification, billing, or publish gates.

### 6.1 Name + Bio

```text
┌──────────────────────────────┐
│ Step 1 of 4   ●●○○           │
│ How should people see you?   │
│ [Andrei Popescu___________]  │
│ @andrei27                    │
│                              │
│ What do you like to play?    │
│                              │
│ [I play football after work  │
│  and run on weekends...]     │
│                              │
│ [Glyph] Suggest sports       │
│                              │
│ Suggested by AI              │
│ ┌──────────────┐ ┌─────────┐ │
│ │ [Glyph] foot │ │ running │ │
│ │  92%         │ │  81%    │ │
│ └──────────────┘ └─────────┘ │
│                              │
│ [Next]                       │
└──────────────────────────────┘
```

AI suggested-sports chips:

- Each chip uses `--r-chip` (10px), `--accent-soft` background, `--ink` label.
- A 14px chevron-burst Glyph sits left of the sport name. **No sparkle icons.**
- Confidence appears below the sport name in `JetBrains Mono 11px` (mono micro), e.g. `92%`.
- Tapping a chip toggles selected state (`--accent` fill, `--on-accent` text). Selected chips are pre-checked when arriving at `/onboarding/sports`.
- If extraction is loading, render skeleton chips with the same dimensions; if extraction fails, show "No confident suggestion. Pick sports manually." with a chevron Glyph in muted state.

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
│ Step 3 of 4   ●●●○           │
│ Where can you play?          │
│                              │
│ City                         │
│ [Timisoara_______________]   │
│ [Use my location]            │
│                              │
│ How far will you travel?     │
│ 1 km ────●────────── 10 km   │
│            5.5 km            │
│                              │
│ [Next]                       │
└──────────────────────────────┘
```

Distance is a **continuous slider**, not discrete buttons:

- range 1.0 km - 10.0 km, step 0.5 km
- the live value renders below the track in `JetBrains Mono 17px` (e.g. `5.5 km`)
- track uses `--line-2` rail, `--accent` fill from the start to the thumb, thumb is a 24px circle in `--surface` with a `--accent` 2px ring
- writes to `users.maxDistanceKm` (the schema column stays `smallint`; the slider still emits values like `5` or `6`, with future change to support half-km values noted in the data-model spec rather than gating UX work now)
- accessible: `role="slider"`, `aria-valuemin="1"`, `aria-valuemax="10"`, `aria-valuenow="<value>"`, keyboard `Left/Right` adjusts by 0.5

### 6.4 Photo

```text
┌──────────────────────────────┐
│ Step 4 of 4   ●●●●           │
│ Add a photo (optional)       │
│                              │
│ ┌──────────────────────────┐ │
│ │  Drop a photo here       │ │
│ │  or tap to choose        │ │
│ │  ───────────────────     │ │
│ │  jpg / png / heic, 8 MB  │ │
│ └──────────────────────────┘ │
│                              │
│ [Glyph] Analyze with AI      │
│ Suggested from photo         │
│ [Glyph tennis 76%]           │
│ [Glyph sneakers 64%]         │
│                              │
│ [Finish] [Skip]              │
└──────────────────────────────┘
```

Photo step rules:

- Upload area accepts drag-and-drop on desktop and tap-to-choose on mobile. Drop hover state thickens the border to 2px `--accent` and tints the inside `--accent-tint`.
- After upload, the dropzone collapses into a 96x96 thumbnail with a "Replace" link.
- AI vision chips appear with an 80ms staggered fade-in (each chip starts 80ms after the previous), capped at 4 chips. Each chip uses the chevron-burst Glyph; **never a sparkle**.
- Each chip shows `<sport>` and a `JetBrains Mono` confidence label (`76%`).
- "Skip" is always available. "Finish" is enabled at all times - photo is optional, not blocking.
- After Finish or Skip, route to `/today`. If photo was skipped, surface the optional-photo affordance via the SetupBanner on `/today`.

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

This is the product's main screen. It has **five explicit states**, each with a stable card shell so the dimensions never jump.

### 7.1 State A - prompt (default)

```text
┌──────────────────────────────┐
│ Today                        │
│ Timisoara · 18:00 window     │
│                              │
│ ShowUpToday?                 │
│                              │
│ [ Yes, I can play ]    ←--- accent
│ [ Not today        ]    ←--- ink ghost
│                              │
│ Sports for today             │
│ [football] [running] [+]     │
│                              │
│ Weather: clear, 18 C         │
└──────────────────────────────┘
```

The Yes button is the only `--accent` element on the screen.

### 7.2 State B - searching (after Yes)

```text
┌──────────────────────────────┐
│ Finding your group...        │
│                              │
│ ████████████ 8 nearby        │
│   ██████████ 6 available     │
│     ████████ 4 compatible    │
│                              │
│ [Glyph] AI is checking       │
│ skill mix and travel times   │
└──────────────────────────────┘
```

Animated 8 → 6 → 4 funnel:

- Three horizontal bars stack with reduced widths (e.g. 100% / 75% / 50%).
- Each bar fills from left in 280ms, sequential with a 120ms gap (total ~1s before final state).
- Bars use `--accent` fill on `--accent-tint` track, `--r-pill` ends.
- Numeric labels render in `JetBrains Mono 13px`.
- The chevron-burst Glyph rotates slowly (4s loop) at 14px while searching.
- Respect `prefers-reduced-motion`: render the final widths instantly, no rotation.

### 7.3 State C - found (matched)

```text
┌──────────────────────────────┐
│ You're in                    │
│ Football · 10/12 players     │
│ Captain: Ionut [field badge] │
│                              │
│ Venue suggestion             │
│ Baza 2 · 2.1km · $$ est.     │
│ [Glyph] Why this group?      │
│ Same sport · 1.4km avg · 18h │
│                              │
│ [Open group chat]            │
│ [Confirm participation]      │
└──────────────────────────────┘
```

The captain badge uses `--field` background and `--field-ink` text. "Why this group?" expands the Formation Timeline panel (see §8).

### 7.4 State D - queued (not enough players)

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

A mono badge `1/2` sits next to the sport line so the gap is unambiguous.

### 7.5 State E - said-no (Not today)

```text
┌──────────────────────────────┐
│ Rest day logged              │
│ See you tomorrow.            │
│                              │
│ Change your mind?            │
│ [ Switch to Yes ]            │
│                              │
│ [Glyph] Or browse public     │
│ events nearby                │
└──────────────────────────────┘
```

Stable dimensions match State A so the card does not collapse.

### 7.6 State F - confirmed

```text
┌──────────────────────────────┐
│ Confirmed for tonight        │
│ Football · Baza 2 · 18:30    │
│ 8 going · 2 maybe            │
│                              │
│ [Open event] [Add to .ics]   │
│ [Group chat]                 │
└──────────────────────────────┘
```

Confirmed state uses a thin `--field-soft` band along the top edge of the card to reinforce "this is real, you are committed".

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
- A `CaptainBriefPanel` is sticky at the top of the Plan tab (mobile) and the right column (desktop). It summarizes: captain name + field badge, next deadline (mono countdown), missing decisions, and the next AI-suggested action. Visible to all members; only the captain sees the action buttons.
- "Why this group?" opens the **Formation Timeline** panel using `FormationTimeline`. The timeline renders five vertical steps with an accent rail:
  1. distance gate (members within radius)
  2. shared sport
  3. skill mix (mono delta, e.g. `±0.6` skill spread)
  4. group-size fit (`10/12 players`)
  5. AI explanation (Glyph + one-sentence rationale, mono confidence)
- Captain badge (`--field` fill, `--field-ink` label, `--r-pill`) is visible beside the captain's name in the header and in the members list.

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

### 10.2.1 Map - denied or unavailable location

If the user denies geolocation or the browser refuses, render the list-first fallback shown below. Do not block the page.

```text
┌──────────────────────────────┐
│ Nearby games                 │
│ [Football] [Tennis] [Today]  │
│                              │
│ ⚠ Location unavailable       │
│ We can show events but       │
│ cannot sort by distance.     │
│                              │
│ [ Use my location ]          │
│                              │
│ Public events                │
│ Baza 2 · Football · 18:30    │
│   Timisoara, RO              │
│   [Directions]               │
│ Parcul Rozelor · Run · 19:00 │
│   Timisoara, RO              │
│   [Directions]               │
│                              │
│ Privacy: we never store your │
│ exact home address.          │
└──────────────────────────────┘
```

Denied-state rules:

- The `Use my location` button re-requests permission via the browser API. If the browser remembers a denial, show a Toast linking to OS instructions.
- Each list row is a `--r-card` row with venue, sport, time, city, and an external Directions link.
- The privacy notice at the bottom is always visible in this state - it is part of the trust contract.
- If geolocation later succeeds, the page promotes to the standard map view without a full reload.

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

- **Header bell** on mobile and desktop. The bell sits in the top-right header on every authed page. When unread > 0, a 16px `--accent` dot sits over the upper-right corner of the bell with a `--ink` 1.5px ring. Tapping opens `/notifications` (mobile full screen) or a 360px-wide popover (desktop).
- desktop nav item (also routes to `/notifications`)
- toast action after prompt/match/vote updates - toast tap opens the relevant deep link, never opens the inbox
- the inbox itself uses the `NotificationInbox` component (warm cream surface, `--r-card` rows, mono timestamps)

## 10.1 Vote Modal

Wireframe (using the `VoteCard` component on a sheet with `--r-shell` top corners on mobile, `--r-surface` on desktop):

```text
┌──────────────────────────────┐
│ Vote: choose a venue         │
│ 8/12 voted   ·   closes 17:55│
│                              │
│ ◉  Baza 2                    │
│    ████████████████░░░  6    │
│ ○  Parcul Rozelor            │
│    ████████░░░░░░░░░░░  3    │
│ ○  Custom location           │
│    ██░░░░░░░░░░░░░░░░░  1    │
│                              │
│ [Cast vote]  [Close vote]    │
│                  ↑ captain   │
└──────────────────────────────┘
```

Vote modal rules:

- Each option is a radio-large row (full-width tap target, 56px tall, `--r-card`, `--surface-2` fill).
- Tally bars animate width on every vote update with a spring ease (stiffness 220, damping 28); reduced-motion shows the final width instantly.
- The `8/12 voted` counter is `JetBrains Mono 13px` and updates live.
- Closing time is `JetBrains Mono`.
- Captain sees a `Close vote` button; non-captains do not.
- Voting states (each is a distinct visual variant of this card):
  - **open**: user has not voted; primary action `[Cast vote]` enabled when a row is selected.
  - **voted**: user's choice is highlighted with a `--field` ring; primary action becomes `[Change vote]`.
  - **closed**: tally bars stay; option with most votes shows a `--field-soft` background and `Winner` chip; no actions for members.
  - **tie**: top options share `--warn-soft` background; copy `Captain to break tie` and `[Pick winner]` button visible to captain only.
  - **all-voted**: when count equals total confirmed members, captain sees `[Close vote]` highlighted in `--accent` to encourage early close; non-captains see the live tally only.

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
