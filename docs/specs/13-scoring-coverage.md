# 13 - Scoring Coverage

This is the judge-facing coverage map. Every scoring row from the challenge should have:

- planned implementation
- demo proof
- fallback if an external service fails

Official maximum: **16,600p**. Do not use the planning pack's `16,900p` total; it double-counted Smart Matching as 2,800p instead of the upstream 2,600p.

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
| Nearby/proximity matching | numeric lat/lng, user `maxDistanceKm`, bounding-box + Haversine | 1km users match; compatible 6km/out-of-radius user stays queued |
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
| Event-specific group chat | separate `eventId` message scope plus group system messages | event chat tab shows messages not present in group chat |
| Notifications/reminders | persistent notification center + in-app SSE reminder + email if configured | notification row appears/read state toggles; prompt reminder displayed/sent |
| Real-time updates | SSE streams for chat/prompt/votes | two-browser message appears within 2s |

Web push is stretch only because the MVP is not a PWA.

## 6. Event & Location Coordination

| Rubric row | Plan | Demo proof | Fallback |
|---|---|---|---|
| Automatic captain assignment | heuristic captain selection with random tie-break | captain pill visible and timeline explains why | manual captain action |
| Auto-event setup | deterministic venue/time/weather ranking plus AI Captain Brief | one-click proposed event and captain brief | deterministic best venue/time |
| Manual event creation | event form | create event live | custom location |
| Venue/location suggestions | seeded venues + cached venues + Overpass + manual captain entry | nearby venue cards with distance | manual venue |
| Price estimation | heuristic price tier plus confidence: verified/captain_entered/estimated/unknown | `$`, `$$`, `$$$ est.` on venues | unknown price label |
| Group voting/polling system | votes and choices | live vote counts | captain can decide manually |
| Maps/location assistance | MapLibre + list fallback + radius circle + directions links + privacy-safe pins | map with venue pins, distance chips, directions | venue list |

## 7. Bonus Features

| Rubric row | Plan | Demo proof |
|---|---|---|
| Calendar integration | `.ics` export | download/open calendar file |
| Weather-aware recommendations | Open-Meteo rules | rain/clear venue hint |
| Team balancing by skill | snake-draft teams | balanced team panel |
| Gamification/achievements | achievements table and badges | First Match badge |
| Multi-language support | RO/EN with next-intl | switch language |
| Social sharing/invites | event invite link + share sheet | copy/share invite |
| Wearables/fitness integrations | Stretch only: Strava OAuth/import or labeled fixture if allowed | claim 0 unless connection/import or accepted fixture is visible |

## 8. Innovation Bonus

Judge-facing story:

1. **60-second loop:** signup, describe yourself, tap Yes, get a group.
2. **AI profile setup:** text and photo suggestions remove setup friction.
3. **Auto group-to-event pipeline:** matching does not stop at recommendations; it produces a playable plan.
4. **Location intelligence:** venue distance, price confidence, weather, directions, and map/list fallback work together.
5. **Human control remains:** every AI result is editable and every external API has a manual fallback.
6. **Production-shaped:** Railway, R2, CI, health check, GDPR basics, tested demo path.
7. **AI Captain Brief:** the captain gets a concise action summary with venue, weather, votes, and next decision.
8. **Group Formation Timeline:** judges can inspect exactly why the group formed.

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
11. event-specific chat
12. vote for time/venue
13. confirm event
14. export calendar
15. show weather/team balancing/i18n as quick bonus cards
16. open Judge Mode scoring proof
