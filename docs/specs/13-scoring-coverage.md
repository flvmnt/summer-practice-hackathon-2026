# 13 - Scoring Coverage

This is the judge-facing coverage map. Every scoring row from the challenge should have:

- planned implementation
- demo proof
- fallback if an external service fails

## 1. Mandatory Foundation

| Rubric row | Plan | Demo proof |
|---|---|---|
| Application runs successfully | Railway web service, `/api/health`, seed script | production URL opens, health returns ok |
| Frontend/backend integration | Next server actions, route handlers, Postgres | signup, prompt, match, chat, event all persist |
| Clean architecture | `src/app`, `src/lib`, `src/server/actions`, zod contracts | code tour in presentation |
| Responsive/mobile UI | 360px-first layouts, bottom nav, desktop split views | Playwright screenshots across mobile/desktop |

## 2. User Profiles

| Rubric row | Plan | Demo proof |
|---|---|---|
| Registration/login | iron-session + bcrypt + recovery code | create account live |
| Profile creation | onboarding profile fields | bio/city/profile visible |
| Sports preferences | sport chips + per-sport skill | selected sports show on profile |
| Profile photo upload | upload, sharp re-encode, object storage | upload photo and see avatar |
| Skill level/preferences | beginner/casual/competitive or 1..5 | matching explanation includes skill fit |

## 3. Smart Matching

| Rubric row | Plan | Demo proof |
|---|---|---|
| ShowUpToday availability | prompt windows + Yes/No response | answer Yes on `/today` |
| Automatic sport matching | group formation after Yes | group created automatically |
| Description/interests matching | AI bio extraction + compatibility scoring | bio creates sport chips and reason |
| Group-size aware matching | sport config min/ideal/max | football forms 10-14, tennis 2-4 |
| Nearby/proximity matching | PostGIS/Haversine radius | users in same city match; far users do not |
| Match confirmation workflow | `confirmMembershipAction` | user confirms spot in group |

## 4. AI / Smart Enhancements

| Rubric row | Plan | Demo proof | Fallback |
|---|---|---|---|
| Identify sports from profile description | Groq text extraction | bio suggests running/tennis | keyword extraction |
| Identify sports from profile photo | Groq vision extraction | photo suggests visible sport | manual chips |
| AI compatibility scoring | cached pair/group explanation | "87% match because..." | deterministic score |
| Smart teammate recommendations | ranked candidates | invite drawer shows suggestions | deterministic ranking |

## 5. Communication

| Rubric row | Plan | Demo proof |
|---|---|---|
| Group chat | persisted messages | send message |
| Event-specific group chat | event context/system messages inside group | event proposal appears in chat |
| Notifications/reminders | in-app SSE reminder + email | prompt reminder displayed/sent |
| Real-time updates | SSE streams for chat/prompt/votes | two-browser message appears within 2s |

Web push is stretch only because the MVP is not a PWA.

## 6. Event & Location Coordination

| Rubric row | Plan | Demo proof | Fallback |
|---|---|---|---|
| Automatic captain assignment | random/default captain on group creation | captain pill visible | manual captain action |
| Auto-event setup | AI + venue + weather planner | one-click proposed event | deterministic best venue/time |
| Manual event creation | event form | create event live | custom location |
| Venue/location suggestions | Overpass + cached venues | nearby venue cards | manual venue |
| Price estimation | price tier heuristic | `$`, `$$`, `$$$` on venues | unknown price label |
| Group voting/polling system | votes and choices | live vote counts | captain can decide manually |
| Maps/location assistance | MapLibre + list fallback | map with venue pins | venue list |

## 7. Bonus Features

| Rubric row | Plan | Demo proof |
|---|---|---|
| Calendar integration | `.ics` export | download/open calendar file |
| Weather-aware recommendations | Open-Meteo rules | rain/clear venue hint |
| Team balancing by skill | snake-draft teams | balanced team panel |
| Gamification/achievements | achievements table and badges | First Match badge |
| Multi-language support | RO/EN with next-intl | switch language |
| Social sharing/invites | event invite link + share sheet | copy/share invite |
| Wearables/fitness integrations | Strava OAuth | connected sport verification |

## 8. Innovation Bonus

Judge-facing story:

1. **60-second loop:** signup, describe yourself, tap Yes, get a group.
2. **AI profile setup:** text and photo suggestions remove setup friction.
3. **Auto group-to-event pipeline:** matching does not stop at recommendations; it produces a playable plan.
4. **Location intelligence:** venue, price tier, weather, and map work together.
5. **Human control remains:** every AI result is editable and every external API has a manual fallback.
6. **Production-shaped:** Railway, PostGIS, CI, health check, GDPR basics, tested demo path.

## 9. Minimum Demo To Unlock Most Points

If time is tight, this exact demo still covers the majority of the rubric:

1. signup
2. AI bio extraction
3. photo upload + AI photo suggestion
4. location setup
5. ShowUpToday Yes
6. auto match into group
7. confirm spot
8. captain shown
9. two-browser chat
10. venue suggestion on map
11. vote for time/venue
12. confirm event
13. export calendar
14. show weather/team balancing/i18n as quick bonus cards

