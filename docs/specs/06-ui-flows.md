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

Desktop shell:

```text
┌────────────────────────────────────────────────────────────┐
│ ShowUp2Move             Today Groups Events Map Profile    │
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
- `/settings`
- `/u/[username]`

Bonus:

- `/map`
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

### 6.1 Bio

```text
┌──────────────────────────────┐
│ Step 1 of 4                  │
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

Matched:

```text
┌──────────────────────────────┐
│ You're in                    │
│ Football · 10/12 players     │
│ Captain: Ionut               │
│                              │
│ Venue suggestion             │
│ Baza 2 · 2.1km · $$          │
│                              │
│ [Open group chat]            │
│ [Confirm participation]      │
└──────────────────────────────┘
```

## 8. Group Screen

Mobile:

```text
┌──────────────────────────────┐
│ Football today          10/12│
│ Captain: Ionut               │
│ [Confirmed 8] [Maybe 2]      │
│                              │
│ Event proposal               │
│ 18:30 · Baza 2 · $$          │
│ [Going] [Maybe] [No]         │
│                              │
│ Chat                         │
│ Maria: 18:30 works           │
│ Ionut: booking court now     │
│ [Message...] [send icon]     │
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

## 11. Empty States

| Surface | Empty state |
|---|---|
| no groups | "Answer today's prompt to form your first group." |
| no events | "No events yet. Create one or wait for today's match." |
| no venue results | "No venue found nearby. Add a custom location." |
| no AI suggestions | "No confident suggestion. Pick sports manually." |
| no chat | "Say where and when works for you." |

## 12. Loading and Error States

Loading:

- skeleton cards for group/event lists
- optimistic "Yes" prompt response
- AI analysis progress with cancel option

Errors:

- external API failure shows fallback action
- location denied still allows city entry
- failed chat send remains in composer with retry
- invalid upload explains allowed type and size

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
10. Captain confirms auto-event with venue, price tier, weather, map.
11. Start a vote.
12. Export `.ics` invite.
13. Switch language RO/EN.
14. Show Railway deployment and CI checks.
