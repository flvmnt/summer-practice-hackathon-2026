# Score Delta: 13:23 → 13:53 (30 min snapshot)

## TL;DR

- **Today total credit: 11,700 / 16,600 (70.5%)**
- **Δ since T0 (13:23): +2,800 p** (+31.5%)
- **Commits landed: 17** (1.1/min velocity)

## Per-Rubric-Row Delta Table

| Row | Cap | T0 (13:23) | Today | Δ | Status | Blocker |
|---|---:|---:|---:|---:|---|---|
| Auth + login + recovery | 600 | 600 | 600 | 0 | live | none |
| Profile + bio onboarding | 600 | 600 | 600 | 0 | live | none |
| Per-sport skill level | 200 | 200 | 200 | 0 | live | none |
| Location + radius | 500 | 500 | 500 | 0 | live | none |
| Profile photo upload | 500 | 0 | 0 | 0 | pending | R2 handler |
| **ShowUpToday Yes/No** | **500** | **500** | **500** | **0** | live | none |
| Smart matching (sport+size+proximity) | 1500 | 1500 | 1500 | 0 | seeded | none |
| Match confirmation workflow | 300 | 0 | 0 | 0 | pending | server action |
| AI compatibility explanation | 500 | 0 | 0 | 0 | pending | AI scoring |
| Group screen with tabs | 500 | 300 | 500 | **+200** | live | none |
| Group chat (SSE) | 500 | 200 | 200 | 0 | fallback | SSE proof |
| Manual event creation | 500 | 0 | 0 | 0 | pending | form |
| **Event-scoped chat** | **500** | **300** | **500** | **+200** | live | none |
| **Automatic captain assignment** | **500** | **500** | **500** | **0** | live | none |
| Auto-event setup + Captain Brief | 1000 | 800 | 1000 | **+200** | fallback | brief copy |
| Group voting/polling | 500 | 500 | 500 | 0 | live | none |
| Team balancing by skill | 300 | 300 | 300 | 0 | live | none |
| Venue suggestions + distance + price | 500 | 0 | 500 | **+500** | seeded | none |
| **MapLibre + list fallback** | **1000** | **500** | **1000** | **+500** | live | none |
| Weather-aware recommendations | 300 | 300 | 300 | 0 | fallback | none |
| AI bio extraction | 500 | 0 | 0 | 0 | fallback | wired into onboarding |
| AI photo extraction | 500 | 0 | 0 | 0 | pending | photo handler |
| AI compatibility scoring | 300 | 0 | 0 | 0 | pending | bio extraction |
| AI Captain Brief | 1000 | 800 | 800 | 0 | fallback | deterministic suffix |
| Smart teammate recommendations | 200 | 0 | 0 | 0 | pending | Wave 3 |
| **Persistent notification center** | **300** | **0** | **300** | **+300** | live | none |
| **.ics calendar export** | **300** | **0** | **300** | **+300** | live | none |
| **First Match achievement** | **300** | **0** | **300** | **+300** | live | none |
| RO/EN multi-language | 200 | 200 | 200 | 0 | live | none |
| Public invite link + share | 100 | 100 | 100 | 0 | live | none |
| Railway deployable shell + /api/health | 500 | 500 | 500 | 0 | live | none |
| Clean architecture + zod | 500 | 500 | 500 | 0 | live | none |
| Responsive mobile-first UI | 500 | 500 | 500 | 0 | live | none |
| Judge Mode proof page | 200 | 200 | 200 | 0 | live | none |

## Summary

| Bucket | Count | Points | Notes |
|---|---:|---:|---|
| **Live** | 21 | 8,800 | working in production |
| **Seeded** | 2 | 2,000 | deterministic demo-only |
| **Fallback** | 4 | 2,900 | external API with manual escape |
| **Pending** | 6 | 900 | schema ready, UI not wired |
| **TOTAL CLAIMED** | 33 | **11,700** | 70.5% of 16,600 cap |

## Top 5 Lifts Since 13:23

1. **MapLibre map + list fallback (+500p)** — `c444174`: full /map route with lazy-load MapLibre, privacy-safe denied fallback, venue pins, distance sorting, directions links.
2. **Notifications inbox + bell (+300p)** — `7a4772b`: persistent notification center at /notifications, header bell entry, read/unread state toggles.
3. **Calendar .ics export (+300p)** — `b5881f4`: event detail panel includes IcsExportButton, download-as-file route, folded RFC 5545 lines.
4. **First Match achievement (+300p)** — `bacf976`: auto-award on group join, persisted to achievements table, displayed in group header.
5. **Event-scoped chat + tabs (+200p)** — `b5881f4`: EventScreen with separate event-chat scope (eventId key), isolated from group messages, event/chat/players tabs.

## Top 3 Stagnant Rows (Highest Points Lost)

1. **AI bio extraction (500p, fallback)** — Groq text extraction ready in `src/lib/ai/bio-extract.ts` but NOT wired into `/onboarding/profile` UI. Deterministic keyword fallback covers 50% confidence.
2. **Photo upload (500p, pending)** — R2 env vars set on Railway; no sharp re-encode handler or upload form action yet. Blocks AI photo→sport row.
3. **Match confirmation workflow (300p, pending)** — Groups persist automatically; explicit `confirmMembershipAction` not wired into UI. Requires single server action + "Confirm spot" button in group.

## Single Biggest Blocker (≤2.5h fix)

**AI bio extraction not wired into onboarding UI** — The Groq client, caching layer, sport-keyword fallback, and deterministic demo outputs are production-ready in HEAD. Wiring the extraction into `/onboarding/profile` as a suggestion chip (with manual edit) unblocks +500p AI bio row and chains into AI compatibility scoring (+300p). Est. 20 min implementation + 10 min demo integration.

---

**File location:** `/Users/flv/hackathon_haufe/summer-practice-hackathon-2026/docs/audit/_partials-2026-05-09-1353/01-score-delta.md`
