# 02 - Design Canon Delta

Read-only audit of how faithfully the implemented Next.js app reproduces the
canonical visual specification at `/Users/flv/hackathon_haufe/ShowUp2Move/`
(`screens.jsx` for component blueprints, `styles.css` for tokens).

The canon is the source of truth. Drift is measured FROM canon TO implementation.

---

## 1. Token fidelity

### 1.1 Colors - 10 / 10

Every Direction-B color token in the canon is reproduced verbatim in the
implementation, plus aliases for legacy code.

- `--bg #FAF7F0` - canon `styles.css:10` / impl `globals.css:14`. Identical.
- `--surface #FFFFFF` - canon `styles.css:12` / impl `globals.css:16`. Identical.
- `--ink #0E1A1F` - canon `styles.css:14` / impl `globals.css:18`. Identical.
- `--accent #FF5C2A` - canon `styles.css:20` / impl `globals.css:24`. Identical.
- `--accent-deep #E84A1B`, `--accent-soft #FFE4D6`, `--accent-tint #FFF1E8` -
  canon `styles.css:21-23` / impl `globals.css:25-27`. Identical.
- `--field #1E6E48`, `--field-soft #DCEDE2` - canon `styles.css:24-25` / impl
  `globals.css:28-29`. Identical.
- `--alert #C8331E`, `--alert-soft #FBE3DD` - canon `styles.css:27-28` / impl
  `globals.css:31-32`. Identical.
- Direction A and Direction C palettes (`globals.css:90-143`) match
  canon `styles.css:59-108` byte-for-byte.

Minor naming drift, not visual drift:

- Canon names the warm orange-brown `--warn`; impl renames it to `--warn-token`
  and rebinds `--warn` to `--accent` for legacy callers (`globals.css:33,78`).
  The remapped `--warn` paints a sodium-orange where the canon paints
  brown-orange (`screens.jsx:394`, `screens.jsx:768` use `var(--warn)` for the
  captain crown which the canon expects as brown). In the running app crowns
  pick up the bright accent instead. Small but worth a follow-up token cleanup.

### 1.2 Typography - 10 / 10

- Display `Bricolage Grotesque` 700 - canon `styles.css:46` / impl
  `layout.tsx:6-11`, `globals.css:50`. Identical face, weights 500/600/700 wired
  via `next/font`.
- Body `Inter Tight` 400-700 - canon `styles.css:47` / impl `layout.tsx:13-18`,
  `globals.css:51`. Identical.
- Mono `JetBrains Mono` 400-600 - canon `styles.css:48` / impl `layout.tsx:20-25`,
  `globals.css:52`. Identical and feature-flagged with `tnum`/`ss01`
  (`globals.css:202`, mirrors `styles.css:151`).
- `.display` letter-spacing `-0.025em`, line-height 1.02 - canon
  `styles.css:144-148` / impl `globals.css:194-199`. Identical.

### 1.3 Spacing & layout primitives - 8.5 / 10

The canonical surface, padding, border-radius and shadow values are reused
faithfully in the polished surfaces, but several pages improvise inner padding
and grid columns rather than tying to canon-derived rhythms.

- Inner mobile padding 22px - canon `screens.jsx:239,254`. Impl uses 20-24px
  inconsistently (`today/page.tsx:74` uses `px-5` = 20px; `groups/page.tsx:50`
  uses `px-5`; `notifications/page.tsx:117` uses 16px). 2-4px drift on every
  mobile container.
- Hero card padding `32px 28px 28px` - canon `screens.jsx:285`. Impl
  `TodayPromptHero.tsx:118` uses `28px 24px 26px`. -4px on all sides.
- Bottom tab bar height 78px - canon `styles.css:309` / impl
  `MobileTabBar.tsx:60`. Identical.
- 44px minimum tap target - impl declares `--tap-target: 44px`
  (`globals.css:87`); canon does not declare it but uses 36-44px sizes
  consistently. Match.
- Page max width - impl introduces `--page-max: 1120px` (`globals.css:81`)
  for desktop; canon is phone-only so no analog. Reasonable extension.

### 1.4 Border radii - 10 / 10

All five radius tokens reproduced exactly:

- `--r-pill 999px`, `--r-chip 10px`, `--r-card 18px`, `--r-surface 26px`,
  `--r-shell 32px` - canon `styles.css:34-38` / impl `globals.css:38-42`.
  Identical.

### 1.5 Shadows - 10 / 10

- `--shadow-1`, `--shadow-2`, `--shadow-3` - canon `styles.css:41-43` / impl
  `globals.css:45-47`. Identical color stops, identical offsets.

### 1.6 Motion - 9 / 10

- Easing `cubic-bezier(0.22, 0.61, 0.36, 1)` and spring
  `cubic-bezier(0.34, 1.56, 0.64, 1)` - canon `styles.css:51-52` / impl
  `globals.css:55-56`. Identical.
- Durations `--t-1 120ms` through `--t-4 600ms` - canon `styles.css:53-56` /
  impl `globals.css:57-60`. Identical.
- Signature animations `ratchet-in`, `vote-fill`, `caret`, `live-pulse`,
  `skel-shimmer` - canon `styles.css:154-244,362-369` / impl
  `globals.css:206-294,397-418`. Identical keyframes.
- Drift: canon `.ai-mark` is a chevron-burst with two layered chevrons
  (`styles.css:252-264`); impl ships a single chevron (`globals.css:296-313`)
  by deliberate simplification - documented inline in the impl. Visual signal
  is weaker than the canon intent. -1.

**Token fidelity average: ~9.6 / 10.** Tokens are nearly perfectly preserved;
only the `--warn` alias remap and the simplified `.ai-mark` glyph diverge.

---

## 2. Per-page layout fidelity

10 pages audited against canon analogs. Scoring scale 0-10.

### 2.1 `/today` (prompt + searching + found + queued + said-no + confirmed)

Canon: `screens.jsx:234-523` (TodayScreen + 6 sub-states).
Impl: `src/app/[locale]/today/page.tsx`,
`src/components/today/TodayPromptCard.tsx`,
`src/components/today/TodayPromptHero.tsx`,
`src/components/today/TodayFoundCard.tsx`,
`src/components/today/TodaySearching.tsx`,
`src/components/today/TodayQueuedCard.tsx`,
`src/components/today/TodaySaidNoCard.tsx`,
`src/components/today/TodayConfirmedCard.tsx`.

- **Layout fidelity 8.5** - mobile header, big display question with last word
  in accent, weather pill, two-button stack, nearby-avatars row all match.
  Desktop adds a 0.82fr/1.18fr split (`page.tsx:127`) that has no canon analog
  but does not contradict the canon.
- **Token fidelity 9** - `var(--surface)`, `var(--r-surface)`, `var(--shadow-3)`
  all reproduced (`TodayPromptHero.tsx:117-122`).
- **Interaction fidelity 8** - `RatchetRow`, type-on caret, live pill all
  preserved. Vote-fill not used here.
- **Average 8.5**
- Drift:
  - `TodayPromptHero.tsx:119` padding `28px 24px 26px` vs canon
    `screens.jsx:285` `32px 28px 28px`.
  - `TodayPromptHero.tsx:133` headline `clamp(48px, 11vw, 72px)` vs canon
    `screens.jsx:289` fixed `60px`. Reasonable mobile-first extension.
  - YES button uses `borderRadius: 14` (`TodayPromptHero.tsx:53`) instead of
    canon pill `var(--r-pill)` 999px (`screens.jsx:297`, `.btn` rule
    `styles.css:178`). Direct contradiction of the canon button radius.

### 2.2 `/` (landing)

Canon: no analog. The canon is phone-only; there is no public landing page in
`screens.jsx` or `app.jsx`. **No canon analog - skipping scoring.**

### 2.3 `/groups` (list)

Canon: no exact analog (canon shows only one group via `ChatScreen` and group
events through `CaptainRevealScreen`). The closest pattern is the "missed
yesterday" stack on `screens.jsx:476-490`.

- **Layout fidelity 7** - mobile eyebrow+title pattern matches the
  onboarding/header rhythm; cards stack vertically with consistent radius and
  border per canon. Desktop top-aligned page heading is reasonable.
- **Token fidelity 9** - `var(--surface-2)` background (`page.tsx:44`),
  `Pill` with crown icon for captain badge (`page.tsx:101`) matches canon
  pill style (`styles.css:213-228`).
- **Interaction fidelity 7** - empty state uses shared `EmptyState` (good);
  list items have subtle hover but no captain crown chevron-pulse like the
  canon's `pill.live`.
- **Average 7.6**
- Drift:
  - Background uses `var(--surface-2)` (`page.tsx:44`), canon would use
    `var(--bg)` for primary list pages (`screens.jsx:238`).
  - "Captain count" Pill recolored via inline `style={{ color: "var(--accent)" }}`
    wrapper (`page.tsx:100`) instead of canon's `pill.accent` class
    (`styles.css:227`).

### 2.4 `/groups/[groupId]` (group room)

Canon: `ChatScreen` `screens.jsx:685-746` + `CaptainRevealScreen`
`screens.jsx:601-642`.
Impl: `src/app/[locale]/groups/[groupId]/page.tsx` plus
`src/components/group/GroupChatForm.tsx`,
`src/components/group/GroupHeader.tsx`,
`src/components/group/CaptainBriefPanel.tsx`,
`src/components/group/GroupTabs.tsx`,
`src/components/group/FormationTimeline.tsx`,
`src/components/group/CreateGroupEventForm.tsx`.

- **Layout fidelity 8** - mobile sticky header (`page.tsx:336`), three-tab
  pattern (Plan/Chat/Players, `GroupTabs.tsx`) is exactly the AGENTS.md UX
  rule. Canon does not have an explicit tab UI here; the impl's tabbed split
  is an explicit AGENTS.md decision and the right call. Desktop 3-column
  shell (`page.tsx:365`) has no canon analog.
- **Token fidelity 8.5** - Cards, pills, accent backgrounds match canon
  (`page.tsx:148-155` reuses `var(--accent-soft)` / `var(--accent-deep)` pair
  matching `screens.jsx:368`).
- **Interaction fidelity 8** - GroupChatForm includes the canon's sticky
  composer + visualViewport keyboard handling
  (`GroupChatForm.tsx:111-120`); type-on dots animation reproduced via
  `caret` keyframe.
- **Average 8.2**
- Drift:
  - Captain crown on member cards uses generic `var(--warn)` which now
    aliases to `var(--accent)` (impl `globals.css:78`); canon `screens.jsx:394`
    expects the brown-orange `--warn`. Crown reads as orange where canon
    expects brown.
  - Avatar initials in chat use `<Avatar />` component while canon `Msg`
    inlines a 18px disc with name initial (`screens.jsx:763`). Functionally
    the same but the impl avatars are slightly larger.

### 2.5 `/events/[eventId]` (event room with vote)

Canon: `CaptainRevealScreen` (`screens.jsx:601-642`), VoteCard inside
`ChatScreen` (`screens.jsx:778-803`), VenueRow (`screens.jsx:665-680`).
Impl: `src/app/[locale]/events/[eventId]/page.tsx`,
`src/components/event/EventScreen.tsx`,
`src/components/event/CaptainAutoEventReveal.tsx`,
`src/components/event/VoteCard.tsx`,
`src/components/event/VenueRow.tsx`,
`src/components/event/TypeOn.tsx`,
`src/components/event/EventChatForm.tsx`,
`src/components/event/EventDetailsPanel.tsx`,
`src/components/event/EventTabs.tsx`.

- **Layout fidelity 9** - the captain reveal uses a Sheet
  (`CaptainAutoEventReveal.tsx:7,70-119`) with the same drag handle, accent
  pill, AI mark, type-on reasoning, and venue rows as canon
  `screens.jsx:618-642`. Tabs (Details/Chat/Vote) make sense given the
  combined event surface.
- **Token fidelity 9** - VoteCard shape, padding, border-radius 16,
  `var(--shadow-1)` reproduced exactly (`VoteCard.tsx:71-76` vs
  `screens.jsx:784`).
- **Interaction fidelity 9** - vote bars use `var(--accent-soft)` /
  `var(--field-soft)` and animate via the same `vote-fill` keyframe; type-on
  uses 28ms/char like canon (`TypeOn.tsx`).
- **Average 9**
- Drift:
  - Reveal exposes "Suggest something else" button not present in canon
    (canon has `Open poll` + `Confirm plan` only, `screens.jsx:634-637`).
    Reasonable extension.
  - Vote countdown shown as `0:42` text only in canon
    (`screens.jsx:787`); impl includes the same plus `total / Math.max(...)`
    voted ratio. Improvement, not a drift.

### 2.6 `/events` (list)

Canon: no direct analog. Closest is the missed-yesterday stack
(`screens.jsx:476-490`).

- **Layout fidelity 7.5** - filter chips (`page.tsx:145-184`), sticky create
  CTA on desktop, list cards. Matches canon visual rhythm.
- **Token fidelity 8** - `var(--accent)` round + button (`page.tsx:107-114`)
  reproduces canon's primary CTA color but not its pill radius (uses 999px,
  matches canon).
- **Interaction fidelity 7** - filter chips reuse `var(--accent-soft)` for
  active state.
- **Average 7.5**
- Drift:
  - Mobile create button is a 40x40 round, but canon's bottom-tab "create"
    glyph is the only canon entry point - no canon analog for a header create
    button.
  - Filter chips use ad-hoc inline `style` rather than canon `.pill`/`.pill.accent` classes (`page.tsx:157-172`) - cosmetically identical, structurally diverged.

### 2.7 `/events/new`

Canon: no analog (canon has no "create event from scratch" screen).
**No canon analog - skipping scoring.**

### 2.8 `/map`

Canon: `MapScreen` `screens.jsx:808-869`, `MapBg` `screens.jsx:871-908`,
`Pin` `screens.jsx:910-919`.
Impl: `src/app/[locale]/map/page.tsx`,
`src/components/map/MapPageClient.tsx`,
`src/components/map/MapView.tsx`,
`src/components/map/MapInner.tsx`,
`src/components/map/MapBg.tsx`,
`src/components/map/MapPin.tsx`,
`src/components/map/MapVenueSheet.tsx`,
`src/components/map/MapFilters.tsx`,
`src/components/map/MapDeniedFallback.tsx`.

- **Layout fidelity 6** - canon is a single phone screen with absolute
  filter bar, search bar, bottom sheet listing nearby venues
  (`screens.jsx:824-865`). Impl is a desktop-first 320px sidebar + 1fr map
  split (`MapPageClient.tsx:185`). The mobile path collapses to a sheet but
  the geometry differs significantly.
- **Token fidelity 8** - venue rows reuse `var(--accent-tint)`,
  `var(--accent-soft)`, `var(--field-soft)` consistent with canon.
- **Interaction fidelity 7** - geolocation handling and denied-fallback are
  canon-faithful (`MapDeniedFallback`). Filter chips match canon pill
  pattern.
- **Average 7**
- Drift:
  - Canon mobile uses absolute-positioned top filter bar + bottom sheet
    (`screens.jsx:825,841`); impl mobile uses a top header card and sheet
    sections (`MapPageClient.tsx:187`). Different visual language.
  - Canon's stylized `MapBg` with parks, streets, "TINERETULUI" text label
    and animated user-location pulse (`screens.jsx:871-908`) is preserved in
    `MapBg.tsx` only as a fallback skeleton; live map uses Leaflet which
    has its own visual language.

### 2.9 `/onboarding/profile`

Canon: `OnboardBioScreen` `screens.jsx:980-1043`.
Impl: `src/app/[locale]/onboarding/profile/page.tsx`,
`src/components/onboarding/ProfileForm.tsx`,
`src/components/onboarding/WizardMobileHeader.tsx`,
`src/components/onboarding/WizardStickyActionBar.tsx`.

- **Layout fidelity 7** - step counter dots, eyebrow, display headline,
  bio textarea all match. Photo uploader uses a 76px circle
  (`ProfileForm.tsx:275-300`) where canon uses a 22px-padding rectangular
  drag-drop card (`screens.jsx:1027-1033`). Material drift.
- **Token fidelity 8.5** - `var(--surface)`, dashed border via `var(--line-2)`,
  `var(--ink-muted)` mono labels all match canon pattern.
- **Interaction fidelity 8** - AI suggest chips with `ratchet-in` animation
  preserved (canonical `AiChip` `screens.jsx:1045-1061`); the impl renders
  suggestions on the next step instead.
- **Average 7.8**
- Drift:
  - Total steps: canon `OnboardHeader` shows `Step X of 4`
    (`screens.jsx:1067`); impl shows `step 1 of 3` (`ProfileForm.tsx:253-257`)
    because photo was merged into step 1 (intentional). Step counts visually
    differ from canon.
  - AI chip strip lives on the sports step (`SportsForm.tsx:257-310`) not
    on the bio step. Adjacent to canon but not identical.
  - Bio textarea border-radius `var(--r-card)` 18px
    (`ProfileForm.tsx:439`) matches canon 14px-ish radius
    (`screens.jsx:991`) loosely.

### 2.10 `/onboarding/sports`

Canon: `OnboardSportsScreen` `screens.jsx:1085-1130`.
Impl: `src/components/onboarding/SportsForm.tsx`.

- **Layout fidelity 8.5** - 3-column tile grid (`SportsForm.tsx:313-316`)
  matches canon `screens.jsx:1102-1106`. Active tile uses `var(--accent-soft)`
  background + 2px `var(--accent)` border (`SportsForm.tsx:336-340`)
  matching canon's `var(--accent-tint)` + 1.5px border
  (`screens.jsx:1134`). Slight strength variance.
- **Token fidelity 8** - canon uses internal `<Glyph.football />` etc.
  (cap-height-aligned mono glyphs); impl uses
  `react-icons/md` (`SportsForm.tsx:13-19`). The MD icons have a different
  weight/cap-height than canon. Material visual drift in icon rendering.
- **Interaction fidelity 7.5** - `Segmented` with active background +
  `var(--shadow-1)` matches canon (`screens.jsx:1142-1152`).
- **Average 8**
- Drift:
  - Icon family swap (canon `Glyph.*` mono outline vs impl `react-icons/md`
    filled) - `SportsForm.tsx:13-20`. Visually inconsistent with canon's
    icon weight (`screens.jsx:381-396` `.glyph svg` rule).
  - Active tile uses 2px solid border vs canon's 1.5px tinted border
    (`SportsForm.tsx:339` vs `screens.jsx:1134`). Heavier visual weight.

### 2.11 `/onboarding/location`

Canon: `OnboardLocationScreen` `screens.jsx:1157-1232`.
Impl: `src/components/onboarding/LocationForm.tsx`.

- **Layout fidelity 6** - canon has a stylized SVG mini-map preview with
  building patterns, dashed radius ring, slider with km scale, and a privacy
  shield card (`screens.jsx:1187-1223`). Impl has plain inputs (city, lat,
  lng) plus a slider but no canonical map preview.
- **Token fidelity 8** - tokens consistent.
- **Interaction fidelity 6.5** - "Use my location" button reproduces canon
  primary CTA, but the radius preview map (the most visually distinctive part
  of the canon screen) is missing.
- **Average 6.8**
- Drift:
  - No mini-map preview canvas - canon `screens.jsx:1188-1208`. The
    "you're in city" + radius scale is the canon's signature for this
    screen and it is absent.

### 2.12 `/onboarding/photo`

Canon: photo capture is part of `OnboardBioScreen` step 1
(`screens.jsx:1025-1034`). The impl exposes a dedicated route but the
PhotoForm renders the same capture UI fragment.

- **No canon analog** for a standalone photo step. Skipping scoring per
  brief.

### 2.13 `/signup` (recovery code reveal)

Canon: `RecoveryScreen` `screens.jsx:924-975`.
Impl: `src/app/[locale]/signup/page.tsx`,
`src/components/auth/RecoveryCodeReveal.tsx`,
`src/components/auth/SignupForm.tsx`.

- **Layout fidelity 9** - eyebrow + display headline + accent-soft dashed
  card + monospace code + copy button + privacy shield + saved checkbox +
  continue all match canon `screens.jsx:930-971` precisely.
- **Token fidelity 10** - `var(--accent-soft)`, `var(--r-surface)`,
  `var(--accent-deep)` mono label, `var(--ink)` for code, all match canon
  `screens.jsx:943-947`.
- **Interaction fidelity 9.5** - code blocks split into 5 mono tiles
  (`RecoveryCodeReveal.tsx:43-52`); canon uses one continuous string but the
  tile split is visually superior. Continue button gated on copy/download
  /confirm exactly matches the canon's saved-checkbox gate
  (`screens.jsx:961-971`).
- **Average 9.5**
- Drift:
  - Tiles vs continuous string (improvement).
  - Adds a Download `.txt` button not in canon (improvement).

### 2.14 `/login`

Canon: no analog (canon has signup flow only).
**No canon analog - skipping scoring.**

### 2.15 `/recover`

Canon: closest is `RecoveryScreen` repurposed for entry. Not an exact analog.
**No canon analog - skipping scoring.**

### 2.16 `/calendar`

Canon: no analog. **No canon analog - skipping scoring.**

### 2.17 `/leaderboard`

Canon: no analog. **No canon analog - skipping scoring.**

### 2.18 `/notifications`

Canon: no analog. The canon's "live pill" + system message rows on
`screens.jsx:748-757` are the closest atomic pattern.

- **Layout fidelity 7** - sticky header with back button + eyebrow + display
  title + Pill matches canon header rhythm
  (`notifications/page.tsx:108-166`).
- **Token fidelity 8** - `color-mix(in oklch, var(--surface) 92%, transparent)`
  + 16px blur on the header (`page.tsx:118-120`) matches canon's tabbar pattern
  (`styles.css:312-315`).
- **Interaction fidelity 7** - chevron-burst not used; standard list rows.
- **Average 7.3**

### 2.19 `/settings`

Canon: no analog. **No canon analog - skipping scoring.**

### 2.20 `/u/[username]`

Canon: no analog (no public profile in canon). **No canon analog - skipping
scoring.**

---

## 3. Aggregate adherence score

Pages scored: `/today`, `/groups`, `/groups/[groupId]`, `/events/[eventId]`,
`/events`, `/map`, `/onboarding/profile`, `/onboarding/sports`,
`/onboarding/location`, `/signup`, `/notifications`. **11 pages.**

Averages: 8.5, 7.6, 8.2, 9.0, 7.5, 7.0, 7.8, 8.0, 6.8, 9.5, 7.3 = 87.2 / 11 =
**~7.9 / 10 average design canon adherence across 11 audited pages.**

---

## 4. Top 5 design drift offenders

1. **`/onboarding/location` (6.8)** - canon's signature stylized mini-map
   preview with dashed radius ring (`screens.jsx:1188-1208`) is replaced with
   plain lat/lng inputs in `LocationForm.tsx`. The most visually distinctive
   element of the canon screen is missing.
2. **`/map` (7.0)** - canon's hand-drawn SVG map atmosphere with park labels
   and pulsing user pin (`screens.jsx:871-908`) only survives as a fallback;
   the live Leaflet view does not honor canon's earthen-paper aesthetic.
3. **`/notifications` (7.3)** - no canon analog, but the chevron-burst AI
   mark and live-pulse pills used elsewhere in canon are not surfaced; rows
   feel generic compared to the canon's typographic energy
   (`screens.jsx:748-757`).
4. **`/events` list (7.5)** - filter chips and sticky create CTA improvise
   with inline styles instead of reusing the canon `.pill` /
   `.pill.accent` classes (`events/page.tsx:157-172`); cosmetically close,
   structurally divergent.
5. **`/groups` list (7.6)** - background uses `var(--surface-2)` instead of
   canon's `var(--bg)` for primary list pages, and the captain pill is
   recolored via an inline wrapper rather than canon's `.pill.accent`
   (`groups/page.tsx:44,99-103`).

---

## 5. Top 5 design wins

1. **`/signup` recovery (9.5)** - tile-split mono code, accent-soft dashed
   card, gated continue, privacy shield - all from canon
   (`screens.jsx:924-975`). Reproduces canon faithfully and adds one tasteful
   improvement (5-tile split) without breaking the rhythm
   (`RecoveryCodeReveal.tsx:43-180`).
2. **`/events/[eventId]` (9.0)** - captain reveal sheet matches canon
   `CaptainRevealScreen` (`screens.jsx:601-642`) with drag handle, accent
   pill, type-on reasoning, venue rows, and the `vote-fill` animated bars
   (`CaptainAutoEventReveal.tsx`, `VoteCard.tsx`).
3. **`/today` (8.5)** - hero, live pill, weather chip, big display question
   with accent last-word, two-button stack, nearby-avatars row all match
   canon (`screens.jsx:234-280`); searching, queued, found, said-no,
   confirmed sub-states each have a faithful component.
4. **`/groups/[groupId]` (8.2)** - sticky composer with iOS visualViewport
   keyboard handling, three-tab Plan/Chat/Players split per AGENTS.md UX
   rule, canonical accent-soft+accent-deep icon pair on cards.
5. **`/onboarding/sports` (8.0)** - 3-column tile grid, segmented controls
   for level, AI suggestion chip strip with `ratchet-in` animation - all
   canon-faithful (`screens.jsx:1085-1130`). Lower-grade only because the
   icon family was swapped from canon `Glyph.*` to `react-icons/md`.

---

## Notes on token system gap

The single biggest token-system gap is the `--warn` alias remap in
`globals.css:78` - the canon defines `--warn: #B8741B` (a brown-orange used
for the captain crown and "wind warning" venue rows) but the impl rebinds
`--warn` to `--accent` for legacy callers and stashes the real warn under
`--warn-token`. Components written against the canon (`screens.jsx:394`,
`screens.jsx:768`, `screens.jsx:631`) used `var(--warn)` for crowns and wind
warnings; in the running app these spots paint sodium-orange, weakening the
"caution" semantic. The `--warn-token` rename also means future canon-derived
work has to remember the alias trap. A token-cleanup pass that retires
`--warn` and renames `--warn-token` back to `--warn` would close the gap.
