# Phase 5 Bonus Audit - 2026-05-09

Spec sources: `docs/specs/12-implementation-plan.md` §7, `docs/specs/08-bonus-features.md`.

## Verdict Table

| # | Bonus | Verdict | Demo surface | Test/proof | Notes |
|---|---|---|---|---|---|
| 1 | `.ics` Calendar Export | DONE | `/calendar` page + event detail panel; server `/api/events/[eventId]/ics` | `src/lib/calendar.test.ts` (2 unit tests) | Server route folds long lines, escapes; client component handles one-tap download. |
| 2 | Open-Meteo Weather | PARTIAL | Event detail page only | `src/lib/weather.test.ts` (5 unit tests) | Real Open-Meteo fetch on event page; `/today` weather chip is hardcoded `"Clear, 18°C"`; auto-event venue selection does NOT prefer indoor on rain. |
| 3 | Team Balancing | DONE | `TeamBalancePanel` on group page (mobile + desktop tabs) | `src/lib/team-balance.test.ts` (6 unit tests) | Snake-draft, shuffle button, balance score, deterministic. |
| 4 | RO/EN i18n | PARTIAL | Locale prefix always; RO default; LandingFooter switcher only | No i18n-specific test (lint:i18n script exists) | Both message bundles exist (1006 lines each). No locale switcher in authenticated nav (`AppHeader`, `MobileTabBar`, settings). |
| 5 | Social Sharing / Invites | DONE | `EventInvitePanel` (create / share / copy / revoke); `/i/[token]` preview page | `src/lib/contracts/invite.test.ts` (4 contract tests) | `navigator.share` with copy-link fallback; OG metadata; rate-limited; revocation supported; privacy-safe preview. |
| 6 | Achievements | PARTIAL | `First Match` badge on group page; `/leaderboard` route renders points | No leaderboard/achievement unit test | Only `first_match` is wired (matching.ts). Spec lists 6 achievements (Showed Up 3 Times, Captain Mode, Weather Warrior, Team Balancer, Early Bird) - none implemented. Scoring proof self-labels this honestly. |
| 7 | Strava OAuth / Wearable Fixture | MISSING | Settings → Integrations shows "Coming soon" disabled button | None | No OAuth, no labeled demo fixture, no `demo_activity` row. Violates AGENTS.md ("greyed coming-soon button scores 0 and should not be shown as proof"). Scoring proof correctly omits row. |

---

## Evidence

### 1. `.ics` Calendar Export - DONE

- Library: `src/lib/calendar.ts:1-58` - `buildIcsCalendar()` with line folding, RFC-5545 escaping, UTC timestamps, optional URL/location/description.
- Server route: `src/app/api/events/[eventId]/ics/route.ts:84-173` - fetches event + venue + winning vote, picks venue label, generates RO/EN description, returns `text/calendar` with `Content-Disposition: attachment`.
- Client one-tap export: `src/components/event/IcsExportButton.tsx:43-105` - Blob download with toast; commented as the in-screen complement to the server route.
- Demo surface route: `src/app/[locale]/calendar/page.tsx:1-252` - lists upcoming events with one `IcsExportButton` per row, RO/EN copy hardcoded.
- Visible from event detail panel: `src/components/event/EventDetailsPanel.tsx:276-277`.
- Test: `src/lib/calendar.test.ts:4-39` - covers UTC formatting and escaping of `, ; \ \n`.
- E2E visual snapshot: `e2e/visual.spec.ts:55` ( `{ slug: "calendar", path: "/en/calendar" }` ).

### 2. Open-Meteo Weather - PARTIAL

- Library: `src/lib/weather.ts:36-175` - `evaluateWeatherFit()` implements all 4 spec rules (rain >60, wind >35 for tennis/badminton, temp <5, clear); `getOpenMeteoForecast()` calls `https://api.open-meteo.com/v1/forecast` with 2.5s timeout, schema-validates response with zod, picks closest hourly bucket.
- Test: `src/lib/weather.test.ts:4-65` - 5 cases covering all 4 fit branches plus `selectClosestHourlyIndex`.
- Wired surface: `src/app/[locale]/events/[eventId]/page.tsx:51-58, 78, 92-105, 213-220` - fetches Open-Meteo for recommended venue, passes to `EventDetailsPanel` and `EventScreen` (`outdoor_good | indoor_recommended | wind_warning | cold_warning`).
- Today surface - MISSING: `src/components/today/TodayPromptCard.tsx:299` hardcodes `const weatherLabel = "Clear, 18°C";`. The card prop pipeline supports a real value but the page (`src/app/[locale]/today/page.tsx`) never calls `getOpenMeteoForecast`. Spec §3 requires "Today card: weather hint for current slot."
- Auto-event indoor preference - MISSING: no callsite in `src/lib/venues.ts`, `src/lib/events.ts`, or any auto-event setup uses weather. Spec §3 requires "Auto-event setup: prefer indoor venues if rain/wind is bad." `SPORTS[*].indoor` flag exists in `src/lib/sports.ts:24,34,43,52,61,70` but nothing reads it for venue ranking against weather.
- Scoring proof labels this `fallback` (`src/lib/demo/scoring-proofs.ts:239-246`).

### 3. Team Balancing - DONE

- Library: `src/lib/team-balance.ts:44-100` - snake-draft (slot indices 0/3 and 1/2 via `index % 4`), normalized skill (clamps to 1-5), `a_first`/`b_first` variants, "balanced enough" score (`100 - gap*25`), id-tiebreak.
- Test: `src/lib/team-balance.test.ts:5-94` - 6 cases (snake draft, tiebreak, order invariance, normalization, variant, min-2-players guard).
- UI: `src/components/group/TeamBalancePanel.tsx:32-90` - title + score + 2 team cards + "Shuffle teams" button (captain-only via `canShuffle`).
- Demo surface: `src/app/[locale]/groups/[groupId]/page.tsx:51,207-209,424-426` (rendered in both Players tab and overview, gated on `SPORTS[group.sport].evenTeams && members.length >= 2`).
- i18n strings: `messages/en/common.json:389-395` and `ro` mirror.

### 4. RO/EN i18n - PARTIAL

- Routing: `src/i18n/routing.ts:3-7` - `["ro", "en"]`, default `ro`, `localePrefix: "always"`.
- Request config: `src/i18n/request.ts:5-15` - loads `messages/${locale}/common.json`.
- Message coverage: both `messages/en/common.json` and `messages/ro/common.json` are 1006 lines each (parity); CI script `pnpm lint:i18n` referenced in `package.json` "check".
- Locale switcher present: `src/components/landing/LandingFooter.tsx:29,115-132` - anchor to `/${otherLocale}` shown only on landing page.
- Locale switcher MISSING from authenticated app:
  - `src/components/layout/AppHeader.tsx:1-71` - no switcher.
  - `src/components/layout/MobileTabBar.tsx` - no switcher.
  - `src/app/[locale]/settings/page.tsx` - has Reminders + Integrations sections but no Language section.
- Spec §6 requires "switch language on `/today`, show same flow in RO and EN." A judge can manually edit the URL prefix, but there is no in-app affordance once authenticated.
- No e2e or vitest test asserts that RO and EN render the same flow.

### 5. Social Sharing / Invites - DONE

- Library: `src/lib/invites.ts:89-232` - `createEventInviteAction` (event-owner check, sha256 hash, 30-day expiry, revokes prior active invite, rate-limited), `revokeEventInviteAction`, `getEventInvitePreview` (rate-limited by IP).
- Schema: `src/db/schema.ts:285-294` - `eventInvites` table with `secretHash`, `revokedAt`, `expiresAt`, demo-run scoping.
- Form action: `src/lib/event-form-actions.ts` (referenced in panel).
- UI: `src/components/event/EventInvitePanel.tsx:28-139` - create button, copy-to-clipboard, `navigator.share` with copy fallback (`66-82`), revoke button.
- Public preview route: `src/app/[locale]/i/[token]/page.tsx:1-149` - privacy-safe (no chat, attendees, exact venue). OG metadata + Twitter card + `robots: noindex`. Signup/login CTAs preserve invite token.
- Tests: `src/lib/contracts/invite.test.ts:7-46` - covers input schema (locale default RO) and token shape (rejects path-like / dotted tokens).
- Scoring proof: `src/lib/demo/scoring-proofs.ts:347-353`.

### 6. Achievements - PARTIAL

- Schema: `src/db/schema.ts:297-313` - `achievements` table keyed by `(userId, code)` with demo-run scope.
- Award path: `src/lib/matching.ts:210-221` - inserts `code: "first_match"` for every member of a newly formed group, with `onConflictDoNothing`.
- UI surface (group page): `src/app/[locale]/groups/[groupId]/page.tsx:56-57,136-141,320` - renders First Match badge.
- Profile surface: `src/lib/profile-public.ts:72-90` - public profile aggregates achievements by code.
- Chat-side load: `src/lib/chat.ts:294-301,330-332` - eagerly loads only `first_match`.
- Leaderboard route: `src/app/[locale]/leaderboard/page.tsx` (full page); action: `src/lib/leaderboard.ts:74-241` (counts achievements as points, attendance, weekly-streak via ISO weeks).
- Spec §5 lists 6 achievements: First Match, Showed Up 3 Times, Captain Mode, Weather Warrior, Team Balancer, Early Bird. **Only First Match is wired.** No award path for the other 5 in any source file (`grep` for `showed_up|captain_mode|weather_warrior|team_balancer|early_bird` returns 0 hits).
- No vitest test for `leaderboard.ts` or for achievement award logic.
- Scoring proof transparently states: "Only First Match is claimed" (`src/lib/demo/scoring-proofs.ts:329-336`).
- Leaderboard page is not linked from authenticated nav (only from `LandingFooter.tsx:87`).

### 7. Strava OAuth / Wearable Fixture - MISSING

- Spec §8 + Plan §10 + AGENTS.md "Wearables" decision: row claimed only with real OAuth/import OR explicitly accepted labeled fixture; "a greyed coming-soon button scores 0 and should not be shown as proof."
- Implementation: `src/app/[locale]/settings/page.tsx:68-70,157-159,386-441` - Settings → Integrations renders a disabled button with copy `"Coming soon"` / `"În curând"`. No OAuth code, no `demo_activity` table, no fixture seed, no `verified by Strava` tagging anywhere (`grep -rn "strava\|Strava" src` returns only the 9 lines in `settings/page.tsx`).
- AGENTS.md violation: "greyed coming-soon button" present but explicitly forbidden. Honest fix: either remove it or label it clearly as "Demo fixture only - not connected" with a seeded mock import.
- Scoring proof correctly does not include a Strava/wearable row.

---

## Recommendations (priority order)

1. **Strava button** - remove the disabled "Coming soon" CTA from settings (AGENTS.md compliance) OR replace with a labeled-fixture demo (seed one `demo_activity`, badge a sport tag as "verified by Strava (demo fixture)").
2. **Today weather** - replace hardcoded `"Clear, 18°C"` (`TodayPromptCard.tsx:299`) by passing through a server-fetched `getOpenMeteoForecast` result from `today/page.tsx`. Spec §3 explicitly lists this surface.
3. **Auto-event indoor preference** - wire `evaluateWeatherFit` into venue ranking when `recommended.fit === "indoor_recommended"`, prefer venues whose sport is indoor-friendly (`SPORTS[sport].indoor`).
4. **Locale switcher in authenticated app** - add to `AppHeader` or settings; spec §6 says "switch language on `/today`".
5. **Additional achievements** - at minimum award `team_balancer` (when shuffle is used) and `weather_warrior` (RSVP yes when weather fit ≠ outdoor_good); these are cheap and visible. Avoid claiming `Showed Up 3 Times` unless seeded attendance is real.
6. **Leaderboard nav entry** - link from authenticated header or profile; currently only reachable via landing footer.
7. **i18n parity test** - add a vitest snapshot or key-coverage test asserting RO and EN bundles share the same key set (the existing `lint:i18n` script likely does this; surface it as a vitest sanity check).
