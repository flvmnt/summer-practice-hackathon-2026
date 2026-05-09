# 00 — Overview

## 1. Problem

Modern schedules make it hard to maintain fixed sports groups. People want to stay active but coordinating with others is high-friction. ShowUp2Move makes it as low-friction as possible — describe yourself, declare availability with one tap, get matched, show up.

## 2. Goals

1. **Lowest possible friction** to "I'm playing today." Target: under 60s from cold-open to first ShowUpToday answer for a returning user.
2. **AI does the boring work** — sport tags from a bio, sport tags from a photo, compatibility scoring, recommendations.
3. **Real groups form automatically.** A user answering "Yes" to today's prompt should be in a chat with 3-13 other compatible humans within seconds.
4. **Production-shaped from day 1.** GDPR-safe, secured, observable, deployed under a real domain.

## 3. Form factor

**Mobile-first responsive web app.** Design starts at 360px and scales up to desktop. **Not a PWA** — no service worker, no install prompt, no offline shell. The "ShowUpToday?" answer flow lives on phones; the captain dashboard / map / event creation read better on desktop and the same pages adapt up.

Lighthouse target: **≥ 95 on both mobile and desktop** across Performance / Accessibility / Best Practices / SEO. Mobile is the primary form factor — the prompt-answer loop happens on phones.

## 4. Non-goals (this round)

- PWA install / service worker / web push (web push lives in [08-bonus-features.md](08-bonus-features.md) only as an enhancement; reminders MVP is in-app SSE banner + email).
- Native iOS/Android binaries (Capacitor wrap is **stretch only**).
- Payments, subscriptions, premium tiers.
- Long-form social features (feeds, comments, stories, follows).
- Multi-tenant / org accounts.

## 5. Scoring strategy

Theoretical maximum across the rubric is **16,600p**. Realistic target with quality bar: **~13,500p (≈81%)**. We hit every category, max what's tractable, hit "Up to" caps with judge-impressing polish, and skip nothing.

### Per-category targets

| Category | Cap | Target | Strategy |
|---|---:|---:|---|
| **Mandatory Foundation** | 1,300 | **1,300** | Ship it running, integrated, mobile-first, with clean lib/ split (curbe + Cadentra discipline). |
| **User Profiles** | 1,300 | **1,300** | curbe auth + sports preferences + photo + skill level. Easy max. |
| **Smart Matching** | 2,600 | **2,400** | All six features. Proximity uses lat/lng + Haversine; group-size aware via per-sport config. |
| **AI Enhancements** | 1,600 | **1,600** | Groq text + vision do all four: bio→sports, photo→sports, compatibility, recommendations. |
| **Communication** | 1,600 | **1,500** | Group chat + event chat + SSE real-time + in-app/email reminders. Web push stays stretch only. |
| **Event & Location** | 4,100 | **3,500** | Captain assign, auto-event setup, manual events, venues via Overpass, voting, MapLibre map. Price estimation (300p) is heuristic-only. |
| **Bonus** | 2,100 | **1,500** | Calendar (.ics export), weather (Open-Meteo, free), team balancing, basic gamification, i18n RO/EN, social share. **Strava OAuth = wearables credit.** |
| **Innovation** | 2,000 | **1,500** | Polished UX, AI used in distinctive ways, technical excellence in deploy/test/security. |
| **TOTAL** | **16,600** | **~13,500** |

### Where we cut

- Wearables: Strava only, not Garmin/Polar/Apple Watch native. Saves 2-4h.
- Price estimation: heuristic per-venue type, not real-time scraping. Saves 4-6h.
- Real-time updates: SSE only, no socket.io. Saves 4-8h.
- Capacitor mobile wrap: stretch.

## 6. Success criteria

A demo passes if:

1. A new user goes from `/signup` to receiving an AI-generated group within 90s.
2. The "ShowUpToday?" prompt fires and resolves without manual nudging.
3. Two simultaneous browsers see chat messages within 2s of each other (SSE).
4. A photo of someone holding a tennis racket gets `tennis` auto-suggested.
5. Two users in the same city get matched into the same group; two in different cities don't.
6. The auto-formed group shows a venue suggestion on a map with rough price tier.
7. Captain can call a vote, members can vote, result tallies live.
8. Lighthouse **≥ 95 on both mobile and desktop** across Performance, Accessibility, Best Practices, SEO.
9. All tests pass in CI; no broken links; no console errors in prod.

## 7. Personas

- **Andrei, 27, software dev** — wants pickup football twice a week, hates spinning up WhatsApp groups.
- **Maria, 22, student** — runs casually, looking for jogging partners on the same trail.
- **Ionut, 35, captain type** — willing to organize events if the app handles venue + voting.

The product must serve all three without features that feel "for the other person."

## 8. Out of this doc

- Schema details → [02](02-data-model.md)
- Endpoints → [03](03-server-actions-and-routes.md)
- AI prompts → [05](05-ai-features.md)
- Screens → [06](06-ui-flows.md)
- Full scoring coverage → [13](13-scoring-coverage.md)
- Matching/event algorithm → [14](14-matching-and-event-algorithm.md)
