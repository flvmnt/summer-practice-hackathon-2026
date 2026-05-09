# 00 - Overview

## 1. Problem

Modern schedules make it hard to maintain fixed sports groups. People want to stay active but coordinating with others is high-friction. ShowUp2Move makes it as low-friction as possible - describe yourself, declare availability with one tap, get matched, show up.

## 2. Goals

1. **Lowest possible friction** to "I'm playing today." Target: under 60s from cold-open to first ShowUpToday answer for a returning user.
2. **AI does the boring work** - sport tags from a bio, sport tags from a photo, compatibility scoring, recommendations.
3. **Real groups form automatically.** A user answering "Yes" to today's prompt should be in a chat with the right number of compatible humans for that sport: 2-4 for racket sports, larger squads for team sports, and small packs for running/cycling.
4. **Production-shaped from day 1.** GDPR-safe, secured, observable, deployed under a real domain.

## 3. Form factor

**Mobile-first responsive web app.** Design starts at 360px and scales up to desktop. **Not a PWA** - no service worker, no install prompt, no offline shell. The "ShowUpToday?" answer flow lives on phones; the captain dashboard / map / event creation read better on desktop and the same pages adapt up.

Lighthouse target: **≥ 95 on both mobile and desktop** across Performance / Accessibility / Best Practices / SEO. Mobile is the primary form factor - the prompt-answer loop happens on phones.

## 4. Non-goals (this round)

- PWA install / service worker / web push (web push lives in [08-bonus-features.md](08-bonus-features.md) only as an enhancement; reminders MVP is in-app SSE banner + email).
- Native iOS/Android binaries (Capacitor wrap is **stretch only**).
- Payments, subscriptions, premium tiers.
- Long-form social features (feeds, comments, stories, follows).
- Multi-tenant / org accounts.

## 5. Scoring strategy

Theoretical maximum across the rubric is **16,600p**. The planning pack's `16,900p` total is wrong because Smart Matching is **2,600p**, not 2,800p. Realistic target with quality bar: **~13,000-13,700p** depending on whether optional wearables ship with real proof. We hit the core loop hard, avoid fake credit, and make every claimed row judge-visible.

### Per-category targets

| Category | Cap | Target | Strategy |
|---|---:|---:|---|
| **Mandatory Foundation** | 1,300 | **1,300** | Ship it running, integrated, mobile-first, with clean lib/ split (curbe + Cadentra discipline). |
| **User Profiles** | 1,300 | **1,300** | curbe auth + sports preferences + photo + skill level. Easy max. |
| **Smart Matching** | 2,600 | **2,400** | All six features. Proximity uses lat/lng + Haversine; group-size aware via per-sport config. |
| **AI Enhancements** | 1,600 | **1,600** | Groq text + vision do all four: bio→sports, photo→sports, compatibility, recommendations. |
| **Communication** | 1,600 | **1,500-1,600** | Group chat + real event-scoped chat + SSE real-time + in-app/email reminders. Web push stays stretch only. |
| **Event & Location** | 4,100 | **3,500-3,900** | Captain assign, auto-event setup, manual events, seeded/cached/Overpass venues, voting, MapLibre map, directions links, privacy-safe map/list fallback. Price estimation is heuristic with confidence labels. |
| **Bonus** | 2,100 | **1,000-1,500** | Calendar (.ics export), weather (Open-Meteo), team balancing, basic gamification, i18n RO/EN, social share. Wearables count only if Strava OAuth/import or an explicitly accepted demo fixture works. |
| **Innovation** | 2,000 | **1,500-1,800** | Polished UX, AI Captain Brief, Group Formation Timeline, demo mode, production-shaped deploy/test/security. |
| **TOTAL** | **16,600** | **~13,000-13,700** |

### Where we cut

- Wearables: optional Strava only. Do not claim the 500p row unless OAuth/import works or the judges explicitly accept a labeled fixture.
- Price estimation: heuristic per-venue type, not real-time scraping. Saves 4-6h.
- Real-time updates: SSE only, no socket.io. Saves 4-8h.
- Capacitor mobile wrap: stretch.

## 6. Success criteria

A demo passes if:

1. A new user goes from `/signup` to receiving an AI-generated group within 90s.
2. The "ShowUpToday?" prompt fires and resolves without manual nudging.
3. Two simultaneous browsers see chat messages within 2s of each other (SSE).
4. A photo of someone holding a tennis racket gets `tennis` auto-suggested.
5. Two users within 1km match; a compatible user outside the configured radius does not. The UI shows the distance gate and explanation.
6. The auto-formed group shows venue suggestions on a map/list with distance, directions, weather hint, and rough price confidence.
7. Captain can call a vote, members can vote, result tallies live.
8. Lighthouse **≥ 95 on both mobile and desktop** across Performance, Accessibility, Best Practices, SEO.
9. All tests pass in CI; no broken links; no console errors in prod.

## 7. Personas

- **Andrei, 27, software dev** - wants pickup football twice a week, hates spinning up WhatsApp groups.
- **Maria, 22, student** - runs casually, looking for jogging partners on the same trail.
- **Ionut, 35, captain type** - willing to organize events if the app handles venue + voting.

The product must serve all three without features that feel "for the other person."

## 8. Out of this doc

- Schema details → [02](02-data-model.md)
- Endpoints → [03](03-server-actions-and-routes.md)
- AI prompts → [05](05-ai-features.md)
- Screens → [06](06-ui-flows.md)
- Full scoring coverage → [13](13-scoring-coverage.md)
- Matching/event algorithm → [14](14-matching-and-event-algorithm.md)
