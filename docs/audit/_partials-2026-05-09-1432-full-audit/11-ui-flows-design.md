# 11 - UI Flows + Design System Audit

Cross-checked specs `docs/specs/06-ui-flows.md` and `docs/specs/07-design-system.md` against `src/app/[locale]/**`, `src/components/**`, `src/app/globals.css`, and `_review/screenshots/`. No `tailwind.config.*` exists - Tailwind 4 CSS-first config in `globals.css` is the source.

## A. Per-flow verdict (spec 06)

| # | Flow / route | Verdict | Primary file(s) | Notes |
|---|---|---|---|---|
| 4 | Landing `/` | DONE | `src/app/[locale]/page.tsx`, `src/components/landing/Hero.tsx`, `LiveCardsRow.tsx`, `HowItWorks.tsx`, `LandingFooter.tsx` | Authed users redirected to `/today`. Wordmark inline (s2m with chevron 2). |
| 5 | Signup `/signup` | DONE | `src/app/[locale]/signup/page.tsx`, `src/components/auth/SignupForm.tsx` | States: taken / weak / loading / success. Card uses `--r-surface`. |
| 5.1 | Recovery-code reveal | DONE | `src/components/auth/RecoveryCodeReveal.tsx` | 5-block JetBrains Mono tiles, copy/download, hard-gate checkbox. **Deviation:** continue is unlocked when copied OR downloaded OR ticked - spec says only the checkbox. Code never logged. |
| - | Login `/login` | DONE | `src/app/[locale]/login/page.tsx`, `LoginForm.tsx` | Includes brand line, Recover/Create links. |
| - | Recover `/recover` | DONE | `src/app/[locale]/recover/page.tsx`, `RecoverForm.tsx` | 3-step flow with eyebrow steps. |
| 6.1 | Onboarding profile `/onboarding/profile` | DONE | `src/app/[locale]/onboarding/profile/page.tsx`, `ProfileForm.tsx` | AI bio extraction wired through `aiBioExtract` server action. |
| 6.2 | Onboarding sports | DONE | `src/app/[locale]/onboarding/sports/page.tsx`, `SportsForm.tsx` | Sport list with skill picker. |
| 6.3 | Onboarding location | DONE | `src/app/[locale]/onboarding/location/page.tsx`, `LocationForm.tsx` | Continuous slider 1-10 km, default Timisoara. |
| 6.4 | Onboarding photo | PARTIAL | `src/app/[locale]/onboarding/photo/page.tsx`, `PhotoForm.tsx` | Upload + local stub for `localPhotoAnalyze`. **Deviation:** AI vision is hard-coded stub, not Groq vision; chip glyph is correct (chevron-burst, not sparkle). Photo step skip route OK. |
| 6.5 | Setup banner | DONE | `src/components/onboarding/SetupBanner.tsx` | Wired on `/today`; not yet wired on `/groups` or `/events` per spec. |
| 7 | Today `/today` | DONE | `src/app/[locale]/today/page.tsx`, `src/components/today/TodayPromptCard.tsx` | All 6 states (A prompt, B searching, C found, D queued, E said-no, F confirmed) implemented as separate components. State machine derived in `deriveState`. Reduced-motion handled in `RatchetRow`/`TodaySearching`. |
| 8 | Group `/groups/[id]` | DONE | `src/app/[locale]/groups/[groupId]/page.tsx`, `GroupTabs.tsx`, `CaptainBriefPanel.tsx`, `FormationTimeline.tsx`, `TeamBalancePanel.tsx` | Plan/Chat/Players tabs on mobile, 3-column desktop. Captain badge present. |
| - | Groups list `/groups` | DONE | `src/app/[locale]/groups/page.tsx` | Empty state with action. |
| 8.1 | Event detail `/events/[id]` | DONE | `src/app/[locale]/events/[eventId]/page.tsx`, `EventScreen.tsx`, `EventTabs.tsx`, `EventDetailsPanel.tsx`, `EventChatForm.tsx` | Details/Event chat/Vote tabs. Captain auto-event reveal in `CaptainAutoEventReveal.tsx`. |
| - | Events list `/events` | DONE | `src/app/[locale]/events/page.tsx` | Upcoming/Past/All chips. |
| 9 | Event creation `/events/new` | PARTIAL | `src/app/[locale]/events/new/page.tsx`, `CreateEventForm.tsx`, `CreateGroupEventForm.tsx` | Captain auto-event flow present. **Deviation:** spec §3 says "Mobile `Create` opens `/events/new`" and "manual public event with limited features"; current page only allows captain-of-group flow with explicit copy "Manual public events are stretch". Manual public event creation is gated. |
| 10 | Map `/map` | DONE | `src/app/[locale]/map/page.tsx`, `MapPageClient.tsx`, `MapInner.tsx`, `MapVenueSheet.tsx`, `MapDeniedFallback.tsx`, `MapBg.tsx`, `MapPin.tsx` | Lazy MapLibre, denied fallback with `Use my location`, public venues, privacy notice. |
| 10.0 | Notifications `/notifications` | PARTIAL | `src/app/[locale]/notifications/page.tsx`, `NotificationInbox.tsx`, `NotificationInboxActions.tsx`, `HeaderBell.tsx`, `AppHeader.tsx` | Inbox renders correctly with mono timestamps. **Deviation:** `HeaderBell` and `AppHeader` exist but are not imported by any authed page (`grep` shows zero call sites in `src/app`). `/today` renders a plain bell `<Link>` with no unread-count dot wired. Other authed pages (groups, events, settings, calendar, leaderboard, profile) have no bell at all. Spec: "The bell sits in the top-right header on every authed page." |
| 10.1 | Vote modal | DONE | `src/components/event/VoteCard.tsx`, `VenueVoteForm.tsx` | Spring-animated tally bars, mono `X/Y voted`, captain-only `Close vote`. Tied/closed/open variants present. |
| 10.2 | Judge / Demo `/demo` | DONE | `src/app/[locale]/demo/page.tsx`, `DemoControls.tsx`, `DemoHealth.tsx`, `RubricSection.tsx`, `ScoringProofRow.tsx` | Guarded by `isDemoModeEnabled()`; rubric proof rows present. |
| - | Settings `/settings` | DONE | `src/app/[locale]/settings/page.tsx`, `SettingsTabs.tsx`, `InlineEditPanels.tsx` | Profile/Sports/Location/Privacy/Reminders/Integrations tabs. |
| - | Public profile `/u/[username]` | DONE | `src/app/[locale]/u/[username]/page.tsx`, `PublicProfileCard.tsx`, `MatchPercentPanel.tsx` | Empty state for missing user. |
| - | Invite preview `/i/[token]` | PARTIAL | `src/app/[locale]/i/[token]/page.tsx` | Server-rendered, OG metadata wired, expired state OK. **Deviation:** still uses retired tokens `--lime`, `--navy`, `--court`, `--cloud`, `--panel-strong`, `--muted` and 8/12px radii (`rounded-md`, `rounded-lg`). Renders via legacy aliases but violates spec 07 §3 + §6. |
| - | Leaderboard `/leaderboard` | DONE (bonus) | `src/app/[locale]/leaderboard/page.tsx` | Mono rank padding, top-3 highlight, current-user row tinted with `--accent-tint`. |
| - | Calendar `/calendar` | DONE (bonus) | `src/app/[locale]/calendar/page.tsx`, `IcsExportButton.tsx` | `.ics` download wired. |
| - | Settings/Integrations | PARTIAL | `src/app/[locale]/settings/page.tsx` (section=integrations) | Strava is correctly disabled with "Coming soon" copy and `cursor: not-allowed`; meets the AGENTS.md rule that greyed coming-soon scores 0 and is honest about it. |
| - | Mobile bottom nav | PARTIAL | `src/components/layout/MobileTabBar.tsx` | 5 tabs: Today, Groups, Create (+), Map, Profile - canon. **Deviation:** spec §2 says "the centered `Create` tab uses the `--accent` (sodium orange) treatment as the only action-colored item in the bar". Current implementation gives Create the same `--ink-muted`/`--ink` treatment as the other tabs. No 2px accent underline on active tab; relies on color change only. |

## B. Per-token verdict (spec 07)

| Section | Verdict | File | Notes |
|---|---|---|---|
| §3 Color tokens (Direction B) | DONE | `src/app/globals.css` lines 14-35 | All canonical tokens present and match spec hex values. |
| §3 Retired tokens guard | FAIL | `globals.css` 67-80 | Legacy aliases (`--lime`, `--navy`, `--court`, `--cloud`, `--mint`, `--coral`, `--panel`, `--panel-strong`, `--danger`, `--warn`) are still defined as compat aliases. Spec: "Never reintroduce". 15+ call sites still consume them: `not-found.tsx`, `i/[token]/page.tsx`, `ui/button.tsx` (default variant), `TeamBalancePanel.tsx`, `EventInvitePanel.tsx`, `VenueVoteForm.tsx`. |
| §3 Dark mode | DONE | `globals.css` 90-143 | Spec says "Dark mode is out of scope". Direction A (dark) and C (warm dusk) palettes are defined as `[data-brand="A"|"C"]`. Layout sets `data-brand="B"` so these never activate. Dead code per strict reading; harmless but worth removing. |
| §4 Type families | DONE | `src/app/layout.tsx` 6-25 | `Bricolage_Grotesque`, `Inter_Tight`, `JetBrains_Mono` from `next/font/google` (Next self-hosts at build - confirmed by commit `480dcb2 fix: self-host fonts and repair mobile tabs`). No external `<link>` to googleapis. |
| §4 Plain Inter banned | DONE | `src` | `grep "import.*Inter[^_]"` returns 0 hits. |
| §4 Type scale | PARTIAL | various pages | Token utilities `.display` and `.mono` are defined and used widely. **Deviation:** some hero blocks use `font-size: clamp(...)` (landing `page.tsx:89`) - spec §4 says "No viewport-based font sizing". Several inline pixel sizes (e.g. `fontSize: 36`, `fontSize: 44`) bypass the scale tokens (`h1`, `h2`...) which are not exposed as CSS vars. |
| §5 shadcn/ui patterns | PARTIAL | `src/components/ui/*` | Required components present: Button, IconButton, Input, Textarea, Select, Slider, Badge, Avatar, Dialog, Sheet, Tabs, Toast, Skeleton, Card, SegmentedControl, EmptyState, Glyph (chevron-burst), AIMark. **Deviation:** Most are custom-rolled, only `@radix-ui/react-slot` is in deps. Spec language is "shadcn/ui patterns" so not strictly required - patterns are followed. `WizardMobileHeader`, `WizardStickyActionBar`, `SetupBanner`, `NotificationInbox`, `ScoringProofRow`, `FormationTimeline`, `CaptainBriefPanel`, `VoteCard`, `RatchetRow`, `MapBg`, `MapPin` all present. `SetupChecklistDialog` not found - banner replaces it. |
| §5 Card radius rule | FAIL | multiple | Spec: "border radius 8px... no cards inside cards". `Card` ui component uses `--r-card` (18px) which contradicts the spec note "border radius 8px" but matches §6 radius scale (10/18/26/32). Spec is internally inconsistent here; implementation matches §6 which is the canonical token list. **Real failures:** 25+ `rounded-md` (6px) / `rounded-lg` (8px) class uses across `not-found.tsx`, `i/[token]/page.tsx`, `today/page.tsx:122`, `settings/page.tsx:364,392`, `events/new/page.tsx:173`, `groups/[groupId]/page.tsx:454` (`rounded-[12px]`), `TeamBalancePanel.tsx`, `EventInvitePanel.tsx`, `VenueVoteForm.tsx`, `LocationForm.tsx`, `Toast.tsx`, etc. Spec §6: "Never use 8px or 12px radii." |
| §5 Button rules | PARTIAL | `globals.css` `.btn-s2m`, `src/components/ui/button.tsx` | Two button systems: `.btn-s2m` (spec-aligned: pill, accent, secondary, ghost, field variants) is used pervasively. `src/components/ui/button.tsx` (legacy shadcn) still uses `--lime`/`--navy`/`--mint`/`--cloud`/`--danger` tokens and `rounded-md`. Spec §5 says "primary action: green" which contradicts §3 "primary CTA: --accent (sodium orange)" - implementation correctly follows §3 (orange). |
| §5 Touch target 44px | DONE | `MobileTabBar.tsx` 80-81, button styles | `--tap-target: 44px` defined; tab links explicitly set `minWidth: 44, minHeight: 44`. |
| §6 Layout tokens | DONE | `globals.css` 81-87 | `--page-max: 1120px`, `--mobile-pad: 16px`, `--desktop-pad: 32px`, `--nav-height-mobile: 64px`. |
| §6 Radius scale | DONE | `globals.css` 38-42 | `--r-pill 999`, `--r-chip 10`, `--r-card 18`, `--r-surface 26`, `--r-shell 32`. Tokens correct; consumption inconsistent (see §5 above). |
| §7 Motion | DONE | `globals.css` 55-60, 423-430 | `--t-1 120ms`, `--t-2 180ms`, `--t-3 250ms`, plus `--ease`, `--ease-spring`. Reduced-motion media query present and respected by `RatchetRow`, `TodaySearching`, `VoteCard`. |
| §8 Accessibility | PARTIAL | various | Focus ring defined: `:focus-visible { outline: 3px solid var(--field) }`. Form labels present. AI confidence rendered as text not color. Map has list fallback. **Gap:** no axe smoke output checked here; `aria-valuenow` on `RatchetRow` not asserted. |
| §11 AI mark | DONE | `src/components/ui/Glyph.tsx`, `AIMark.tsx`, `globals.css` 296-316 | Chevron-burst Glyph used everywhere. `grep -rn "Sparkles\|sparkles\|wand-2\|WandSparkles\|Wand2" src` returns 0 hits. Forbidden lucide AI icons confirmed absent. |
| §10 Logo | DONE | `Hero.tsx:Wordmark`, landing | s2m wordmark with stylized 2 in `--accent`, `s` and `m` in `--ink`. |

## C. Specifically requested checks

### Mobile-first responsive (NOT PWA)
- DONE. Every authed page has a 360px mobile shell, `MobileTabBar` rendered fixed-bottom, `safe-area-inset-bottom` padding accounted for. Desktop layouts kick in at `md:` (768px) with grid columns. No `manifest.json` PWA entry, no service worker - confirmed by absence of `next-pwa` or service-worker registration.

### Empty / loading / error states
- Empty: `EmptyState` component used in groups list, events list, calendar, leaderboard, public profile not-found, notifications. Spec table §11 covered.
- Loading: `Skeleton` defined and reused; matching uses stable-dimension `RatchetRow` per spec §7.2; chat uses fixed composer dimensions.
- Error: `formError` block in `TodayPromptCard.tsx:249-261`, alert variants in `Toast.tsx`, denied-fallback panel in `MapDeniedFallback.tsx`. Spec table §12 covered.
- Gap: notifications page has empty-state copy but no explicit loading skeleton.

### Self-hosted fonts
- DONE. `src/app/layout.tsx` uses `next/font/google` which downloads fonts at build and serves them from the same origin (no `<link>` to fonts.googleapis.com). Commit `480dcb2 fix: self-host fonts and repair mobile tabs` is the canonical change.

### Consistent spacing / colors per design tokens
- Tokens defined and mostly used. Real violations:
  - Legacy palette tokens (`--lime`, `--navy`, `--court`, `--cloud`, `--mint`, `--coral`, `--panel-strong`, `--danger`, `--muted`) consumed in `not-found.tsx`, `i/[token]/page.tsx`, `ui/button.tsx`, `TeamBalancePanel.tsx`, `EventInvitePanel.tsx`, `VenueVoteForm.tsx`. Total ~15 hits.
  - 8/12px radii (`rounded-md`, `rounded-lg`, `rounded-[12px]`) appear in 25+ places. Spec §6 forbids these.
  - Hero typography uses inline `clamp(...)` (landing `page.tsx:89`); spec §4: "No viewport-based font sizing".

### shadcn/ui components per spec
- All 22 named components in spec §5 are present in `src/components/ui/` or `src/components/{onboarding,today,group,event,notifications,demo,map,layout}/`. `SetupChecklistDialog` is not literally named but `SetupBanner` covers the same role; spec calls for both.

## D. Screenshots cross-check (`_review/screenshots/`)

- `today-360w.png` is byte-identical to `login-360w.png` (89,064 bytes). The `/today` route correctly redirects unauthed users to `/login`, so this is the harness lacking an authed session, not broken UI. Worth adding an authed Lighthouse/screenshot harness step (AGENTS.md already calls this out for Lighthouse: "`/today` Lighthouse must use an authenticated seeded demo session").
- `onboarding-profile-360w.png` is also the login screen for the same reason.
- `landing-en-360w.png` renders correctly: hero, live cards, sign-up CTA, "How it works" steps, "Why ShowUp2Move" three-card grid, footer.
- `map-360w.png` renders the denied-fallback state with the "Use my location" pill, privacy notice, and the 5-tab mobile bar with Create rendered as a plus glyph.
- `signup-360w.png` and `recover-360w.png` render the signup/recover forms with the warm-cream surface, sodium-orange CTA, and back chip.
- 88 PNGs total across 360/390/768/1440 widths - good responsive coverage.

## E. Top fixes ranked by spec impact

1. **MobileTabBar Create tab is not accent-treated** (`src/components/layout/MobileTabBar.tsx`). Spec §2 explicitly requires `Create` to be the only `--accent` item in the bar. Easy fix: add a per-tab `accent: true` flag and special-case the `+` glyph fill.
2. **Header bell not wired on authed pages** (`src/app/[locale]/today/page.tsx` and other authed pages). `HeaderBell` and `AppHeader` components exist but have zero call sites in `src/app`. Today renders a plain non-counted bell link; other authed pages have none. Spec §10.0 says the bell appears on every authed page with a 16px accent dot when unread > 0.
3. **Retired color tokens still consumed** (`not-found.tsx`, `i/[token]/page.tsx`, `ui/button.tsx`, `TeamBalancePanel.tsx`, `EventInvitePanel.tsx`, `VenueVoteForm.tsx`). Spec §3: "never reintroduce".
4. **8/12px radii in 25+ places**. Spec §6: "Never use 8px or 12px radii." Replace `rounded-md`/`rounded-lg` with `rounded-[10px]`/`rounded-[18px]` or `style={{ borderRadius: 'var(--r-chip|--r-card)' }}`.
5. **`/events/new` blocks manual public event creation**. Spec §3: "Mobile `Create` opens `/events/new`" with "manual public event with limited features". Page currently shows captain-of-group flow only with explicit "Manual public events are stretch" disclaimer.
6. **PhotoForm uses local stub for AI vision** (`src/components/onboarding/PhotoForm.tsx:48`). Photo step is optional per spec, so this is OK for MVP, but the stub should be replaced before demo or the chip confidence numbers will look fabricated.
7. **`clamp()` font sizes on landing** (`src/app/[locale]/page.tsx:89`). Spec §4: "No viewport-based font sizing." Swap to discrete mobile/desktop sizes via media queries.
8. **Recovery-code continue gate is OR'd, not AND'd**. Spec §5.1: "disabled until the 'I saved it' checkbox is ticked - this is a hard gate, not a soft hint." Implementation accepts copy OR download OR checkbox.

## F. Things worth keeping

- Direction B token system in `globals.css` is clean and matches spec §3 exactly.
- `Glyph.tsx` chevron-burst AI mark is the single source of truth - no sparkles or wands anywhere in `src`.
- `RatchetRow`, `TodaySearching`, `VoteCard` correctly honor `prefers-reduced-motion`.
- Today state machine in `TodayPromptCard.tsx` cleanly maps to all 6 spec states (A-F) with stable card dimensions.
- 5-tab canonical mobile nav (no FAB) - spec-correct.
- All required onboarding redirects (`/today` -> next missing step) wired in `src/app/[locale]/today/page.tsx:33-43`.
