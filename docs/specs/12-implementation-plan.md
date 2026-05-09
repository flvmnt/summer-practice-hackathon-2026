# 12 - Implementation Plan

## 1. Rule

Implement in thin vertical slices. The first working product should cover signup -> onboarding -> ShowUpToday -> group -> chat before any bonus work.

## 2. Phase 0 - Fork and Project Setup

Goal: fork-based, runnable skeleton.

Tasks:

1. Confirm `origin` is the team fork and `upstream` is `deeagabor/summer-practice-hackathon-2026`.
2. Scaffold Next.js app in the fork.
3. Add pnpm, TypeScript, Tailwind, shadcn/ui, Drizzle, Vitest, Playwright.
4. Add Railway config.
5. Add GitHub Actions CI.
6. Add `/api/health`.

Done when:

- `pnpm dev` runs
- `pnpm check` runs
- Railway deploy opens a blank app with health green

## 3. Phase 1 - Auth and Profiles

Tasks:

1. Implement Postgres schema base.
2. Implement iron-session.
3. Implement signup/login/logout/recovery.
4. Implement profile settings.
5. Implement onboarding flow.
6. Implement sport selection and skill levels.
7. Implement photo upload and resizing.

Rubric coverage:

- registration/login
- profile creation
- sport preferences
- profile photo upload
- skill support

Done when:

- E2E signup -> onboarding -> `/today` passes

## 4. Phase 2 - Availability and Matching

Tasks:

1. Implement prompt windows.
2. Implement ShowUpToday Yes/No.
3. Implement deterministic matching.
4. Implement group-size rules.
5. Implement proximity matching.
6. Implement captain assignment.
7. Implement match confirmation.

Rubric coverage:

- availability system
- automatic matching
- group-size aware matching
- proximity matching
- captain assignment
- match confirmation

Done when:

- seeded users form valid groups after prompt response

## 5. Phase 3 - Chat and Events

Tasks:

1. Implement group page.
2. Implement persisted chat.
3. Implement SSE message stream.
4. Implement event creation.
5. Implement event RSVP.
6. Implement event-specific chat context.
7. Implement reminders as in-app/email first.

Rubric coverage:

- group chat
- event-specific chat
- real-time updates
- notifications/reminders
- manual event creation

Done when:

- two-browser chat works
- event creation and RSVP works

## 6. Phase 4 - AI and Location

Tasks:

1. Implement Groq wrapper.
2. Implement bio sport extraction.
3. Implement photo sport extraction.
4. Implement AI compatibility explanations.
5. Implement teammate recommendations.
6. Implement venue search using Overpass.
7. Implement MapLibre map.
8. Implement price tier heuristic.
9. Implement auto-event setup.

Rubric coverage:

- all AI categories
- venue suggestions
- price estimation
- maps/location assistance
- auto-event setup

Done when:

- judge can see all AI and map features in one seeded demo

## 7. Phase 5 - Bonus

Tasks:

1. `.ics` export.
2. Open-Meteo weather recommendations.
3. Team balancing.
4. RO/EN i18n.
5. Social sharing/invites.
6. Achievements.
7. Strava OAuth if time allows.

Done when:

- each bonus has a visible demo surface and a test

## 8. Phase 6 - Polish and Proof

Tasks:

1. Visual QA on mobile and desktop.
2. Lighthouse 95+ pass.
3. Error/loading/empty states.
4. Demo seed quality pass.
5. README setup and demo instructions.
6. Presentation outline.
7. Railway smoke test.

Done when:

- production URL is demo-ready
- all checks pass
- demo script can be run in under 5 minutes

## 9. Atomic Task Order

Suggested commit flow:

1. `chore: scaffold next app`
2. `chore: add railway and ci`
3. `feat: add database schema and migrations`
4. `feat: add session auth`
5. `feat: add onboarding profile flow`
6. `feat: add sport preferences`
7. `feat: add photo upload`
8. `feat: add today prompt`
9. `feat: add matching engine`
10. `feat: add groups and captain assignment`
11. `feat: add chat`
12. `feat: add event creation`
13. `feat: add venue search and map`
14. `feat: add groq bio suggestions`
15. `feat: add groq photo suggestions`
16. `feat: add compatibility recommendations`
17. `feat: add auto event setup`
18. `feat: add calendar export and weather`
19. `feat: add i18n and sharing`
20. `test: add e2e demo flow`
21. `docs: add demo and deployment guide`

## 10. Hour Budget

| Phase | Hours |
|---|---:|
| setup | 2 |
| auth/profile | 5 |
| prompt/matching | 6 |
| chat/events | 6 |
| AI/location | 8 |
| bonus | 6 |
| polish/testing | 5 |
| buffer | 4 |
| total | 42 |

If time is shorter, cut Strava first, then gamification, then social sharing. Do not cut the core prompt -> match -> chat -> event loop.

## 11. Risk Register

| Risk | Mitigation |
|---|---|
| Groq unavailable | deterministic fallbacks |
| Overpass slow | cached venues + manual location |
| map bundle too heavy | lazy-load MapLibre |
| Railway volume setup slow | fallback to DB-stored photo path and local uploads in demo |
| SSE unstable | polling fallback |
| too many bonus features | build visible small versions only |

