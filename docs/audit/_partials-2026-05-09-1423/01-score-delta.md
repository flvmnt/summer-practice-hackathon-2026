# Score Delta — 2026-05-09 14:23

## TL;DR

**11,700 → ~12,750 (Δ +1,050) / 16,600.** The aim is the full 16,600 p.

17 commits landed in 30 min — much of the wave is **lib-ready, UI-unwired**: server actions shipped without callers (notifications fetch/markRead, match-confirm, bio→sport, captain-brief). The clean wins are visible-surface: MapLibre directions, invite preview page, compat-score on public profile, judge-mode rebuild, font self-host. Cross-validation against the AI lane and schema lane partials forced down two rows the score-delta surface alone would have over-credited (match-confirm and notifications fetch).

---

## Per-rubric-row delta

> Spec base: `docs/specs/13-scoring-coverage.md`. Deeper specs cited inline.

| Row | Cap | Spec ref | Prior (13:53) | Today | Δ | Blocker |
|---|---:|---|---:|---:|---:|---|
| App runs | 500 | 13-scoring-coverage.md §1 / 11-deployment-railway.md | 450 | 480 | +30 | Railway healthcheck still red at audit time (separate thread) |
| Frontend/backend integration | 300 | §1 | 280 | 280 | 0 | — |
| Clean architecture | 300 | §1 / 01-architecture.md | 250 | 290 | +40 | New routes follow boundary; demo proof rows formalized in `scoring-proofs.ts` |
| Responsive UI | 200 | §1 / 07-design-system.md | 180 | 200 | +20 | ✅ max — mobile-tabs fix + font self-host (`480dcb2`) |
| Registration/login | 300 | §2 / 04-auth-and-profile.md | 280 | 280 | 0 | — |
| Profile creation | 300 | §2 / 04-auth-and-profile.md | 280 | 300 | +20 | ✅ max — `/u/[username]` route shipped (`e3ba573`) |
| Sports preferences | 300 | §2 | 300 | 300 | 0 | ✅ max |
| **Profile photo upload** | **200** | §2 / 03-server-actions-and-routes.md:144-149 | **0** | **120** | **+120** | R2 client + `uploadProfilePhotoAction` shipped (`4feee63`), MIME sniff + sharp resize + webp ✓; **R2 delete-on-replace MISSING** (AGENTS.md mandate); UI caller in onboarding photo step needs verification |
| Skill levels | 200 | §2 | 200 | 200 | 0 | ✅ max |
| ShowUpToday availability | 500 | §3 / 06-ui-flows.md:220 | 450 | 460 | +10 | demo seed needs ≥6 yes-responders |
| Auto sport matching | 500 | §3 / 14-matching-and-event-algorithm.md | 400 | 420 | +20 | — |
| **Description matching (AI)** | **500** | §3 / 05-ai-features.md:41 | **0** | **0** | 0 | `extractSportsForCurrentUserAction` shipped (`7745867`) but **ZERO callers** — onboarding profile form does not invoke it |
| Group-size aware | 300 | §3 | 250 | 250 | 0 | UI doesn't show "needs N more" |
| Proximity matching | 500 | §3 / 02-data-model.md (Haversine indexes) | 300 | 320 | +20 | — |
| **Match confirmation** | **300** | §3 / 03-server-actions-and-routes.md:64 | **0** | **50** | +50 | `confirmMembershipAction`/`declineMembershipAction` shipped (`5d9fe0c`) but **UNWIRED** — no UI button calls them; partial credit for lib readiness |
| **Bio → sport (AI)** | **500** | §4 / 05-ai-features.md:41 | **0** | **0** | 0 | Lib + server-action wrapper ready, **zero call sites**; same row as description matching above (rubric counts once) |
| **Photo → sport (vision)** | **500** | §4 / 05-ai-features.md:81 | **0** | **0** | 0 | `getVisionModel()` exported but **0 usage**; `PhotoForm.tsx` uses `localPhotoAnalyze()` stub (line 43–46 comment acknowledges this) |
| **AI compatibility scoring** | **300** | §4 / 05-ai-features.md:116 | **0** | **200** | **+200** | **WIRED** — `scoreCompatibility()` called from `profile-public.ts:197`, surfaced on `/u/[username]` match panel (commits `da84ff4` + `e3ba573`) |
| **Smart teammate recs** | **300** | §4 / 05-ai-features.md:145 | **0** | **0** | 0 | MISSING entirely — no recommendation ranking module; spec'd at 05-ai-features.md:149-165 |
| Group chat | 500 | §5 | 450 | 450 | 0 | — |
| Event-specific chat | 500 | §5 | 450 | 450 | 0 | — |
| **Notifications/reminders** | **300** | §5 / 03-server-actions-and-routes.md:178 | **150** | **150** | 0 | Migration `0010_black_mauler` adds table; `fetch/markRead/markAllRead` server actions shipped (`80ef6a0`) but **UNWIRED** — `notifications/page.tsx` is dirty/WIP, not committed |
| Real-time updates | 300 | §5 | 200 | 200 | 0 | SSE polling spec'd, not wired |
| Auto captain | 300 | §6 | 280 | 280 | 0 | — |
| **Auto-event setup** | **1,000** | §6 / 05-ai-features.md:167 | 600 | 620 | +20 | `generateCaptainBrief()` shipped + tested (`7be52fd`) but **DEAD** — zero callers in event creation flow; row stuck at deterministic plan only |
| Manual event creation | 500 | §6 | 450 | 470 | +20 | `/events/new` route shipped (`e3ba573`) |
| Venue suggestions | 500 | §6 | 350 | 350 | 0 | seed venues OK; Overpass live optional |
| Price estimation | 300 | §6 | 200 | 200 | 0 | $/$$/$$$ chip placeholder |
| Voting | 500 | §6 | 450 | 470 | +20 | VoteCard externalized + aria-live (`01f99a2`) |
| **Maps assistance** | **1,000** | §6 / 06-ui-flows.md:338 | **600** | **800** | **+200** | **WIRED** — Google/Apple/Waze deep-link buttons in `MapVenueSheet.tsx:156-194` (`84c42d7`); remaining 200 needs in-app routing or chat-share |
| Calendar | 300 | §7 | 280 | 280 | 0 | — |
| Weather-aware | 300 | §7 | 250 | 250 | 0 | — |
| Team balancing | 300 | §7 | 250 | 250 | 0 | — |
| Gamification | 300 | §7 | 200 | 200 | 0 | — |
| Multi-language | 200 | §7 / 16-i18n-plan.md | 200 | 200 | 0 | ✅ max — d41abd0 sweep maintained parity, RO/EN both clean |
| **Social sharing/invites** | **200** | §7 / 08-bonus-features.md:104 | **100** | **200** | **+100** | ✅ max — `/[locale]/i/[token]` page with OG metadata + expired state (`8317fc3`) |
| Wearables | 500 | §7 | 0 | 0 | 0 | Strava — cuttable |
| Innovation | 1,000 | §8 | 700 | 770 | +70 | Judge Mode rebuilt with rubric proof rows + DemoHealth (`3f79922`); `scoring-proofs.ts` formalizes evidence |
| UX/UI quality | 500 | §8 | 400 | 460 | +60 | Settings + public profile + events/groups list pages, font self-host, mobile tabs fix, RO/EN diacritic clean |
| Technical excellence | 500 | §8 | 450 | 480 | +30 | Visual QA harness (`6ea612f`), AI tests (compat-score 14 cases, captain-brief), R2 sanity |

**Sum: ~12,750 / 16,600 (76.8%)**.

---

## Big swings (Δ ≥ +100)

| Row | Δ | Driving commit(s) | Why |
|---|---:|---|---|
| Maps assistance | **+200** | `84c42d7` | Google/Apple/Waze deep-link buttons live in venue sheet — verified at `src/components/map/MapVenueSheet.tsx:156-194` |
| AI compatibility scoring | **+200** | `da84ff4` + `e3ba573` | `scoreCompatibility()` called from `profile-public.ts:197`, surfaced on `/u/[username]` match panel — verified by AI lane partial |
| Profile photo upload | **+120** | `4feee63` | R2 client + `uploadProfilePhotoAction` ship with MIME sniff + sharp + webp; capped under cap pending UI caller verification AND missing R2 delete-on-replace |
| Social sharing/invites | **+100** | `8317fc3` + `6b07f72` | `/i/[token]` invite preview page with OG metadata + expired state |

---

## The remaining gaps (ranked by points/min)

> Each cites the commit that shipped the lib without wiring it. All are fast UI hookups.

| # | Row | Pts available | Wiring | Pts/min |
|---|---|---:|---|---:|
| 1 | Description matching (bio→sport AI) | 500 | Call `extractSportsForCurrentUserAction()` from onboarding profile form post-bio (`7745867` shipped action) | ~100 |
| 2 | Auto-event setup (captain brief) | ~380 | Call `generateCaptainBrief()` from event creation completion handler (`7be52fd` shipped + tested) | ~75 |
| 3 | Match confirmation | 250 | Add Confirm/Decline buttons calling `confirmMembershipAction`/`declineMembershipAction` to group/today flow (`5d9fe0c` shipped) | ~50 |
| 4 | Notifications/reminders | 150 | Wire `fetchNotificationsAction` + `markNotificationReadAction` into `notifications/page.tsx` and `HeaderBell` (`80ef6a0` shipped; page is dirty WIP — likely in-flight) | ~30 |
| 5 | Photo → sport (vision) | 500 | Implement `photo-extract.ts` server action wrapping `getVisionModel()`, call from `PhotoForm` post-upload (~15 min build, no shipped lib yet) | ~33 |
| 6 | R2 delete-on-replace | (cap restoration on photo upload row) | Add `DeleteObjectCommand` for old objectKey before insert in `upload-actions.ts` | low pts but compliance |

**If 1+2+3+4 wire in next 30 min: +1,280 p projected → ~14,030 / 16,600 (84.5%).**

---

## Total

**~12,750 / 16,600 (76.8%)** · **Δ +1,050 vs 11,700 baseline** · 30 min elapsed since T0.

Δ is honest: the score-delta surface alone would read +1,400, but cross-validation with the AI partial (3 unwired libs) and schema partial (4 unwired actions) forced match-confirm and notifications down to lib-only credit.
