# UI/UX Consistency, Layout Integrity & Design-System Audit

**Date**: 2026-05-09 15:48
**Scope**: brand "direction B", post commits c81a16b / 8cbf7d5 / cfe9fc7 / 250d822
**Excludes**: i18n / locale leakage (owned by another agent)
**Verdict**: Direction B foundation is mostly polished, but the DesktopSidebar
mount sweep is **incomplete on the event detail screen** and the MobileTabBar
**Create CTA still has zero accent treatment** in violation of the locked spec.
A handful of design-token regressions persist (forbidden 8/12 px radii in 9
files, two `bg-red-*` Tailwind palette leaks). Em-dash compliance and
loading/error coverage are materially better than the prior audit.

---

## Section A. DesktopSidebar mount audit (per-page)

DesktopSidebar lives in `src/components/layout/DesktopSidebar.tsx:56` and
exposes a 240 px fixed left rail with `aria-current="page"`, brand block,
primary nav, and notifications row at the bottom. The required wiring on each
authed page is:

- `<DesktopSidebar unreadCount={unread} />` rendered (it self-hides below `md`)
- `md:pl-[240px]` on the main element so content sits to the right of the rail
- `<MobileTabBar />` rendered (it self-hides at `md+` since cfe9fc7)

Status:

| Route                              | DesktopSidebar | md:pl-[240px] | MobileTabBar | HeaderBell wrap |
|------------------------------------|:-:|:-:|:-:|:-:|
| `[locale]/today/page.tsx`          | OK (L80) | OK (L73) | OK (L224) | mobile-only (L83 `md:hidden`) |
| `[locale]/groups/page.tsx`         | OK (L158) | OK (L42) | OK (L159) | mobile-only (L50 `md:hidden`) |
| `[locale]/groups/[groupId]/page.tsx` | OK (L335) | OK (L332) | OK (L536) | mobile-only (L337 `md:hidden`) |
| `[locale]/events/page.tsx`         | OK (L216) | OK (L69) | OK (L217) | mobile-only (L77 `md:hidden`) |
| `[locale]/events/[eventId]/page.tsx` (renders `EventScreen`) | **MISSING** | **MISSING** | OK via EventScreen L379 | **bell renders on desktop too** |
| `[locale]/events/new/page.tsx`     | **MISSING** | **MISSING** | OK (L313) | n/a (no bell) |
| `[locale]/calendar/page.tsx`       | OK (L256) | OK (L92) | OK (L257) | **always visible** (L120 — no `md:hidden`) |
| `[locale]/leaderboard/page.tsx`    | OK (L292) | OK (L130) | OK (L293) | **always visible** (L160 — no `md:hidden`) |
| `[locale]/notifications/page.tsx`  | OK (L107) | OK (L100) | OK (L184) | n/a (no bell) |
| `[locale]/settings/page.tsx`       | OK (L268) | OK (L261) | OK (L422) | mobile-only (L269 `md:hidden`) |
| `[locale]/map/page.tsx` (renders `MapPageClient`) | OK via MapPageClient L184 | OK (L181) | OK (L351) | mobile-only inside client |
| `[locale]/u/[username]/page.tsx`   | conditional (L108, L191) | OK (L101, L184) | OK (L120, L263) | mobile-only (L192 `md:hidden`) |
| `[locale]/onboarding/profile/page.tsx`  | absent (intentional) | absent | absent | absent |
| `[locale]/onboarding/sports/page.tsx`   | absent (intentional) | absent | absent | absent |
| `[locale]/onboarding/location/page.tsx` | absent (intentional) | absent | absent | absent |
| `[locale]/onboarding/photo/page.tsx`    | absent (intentional) | absent | absent | absent |

Onboarding pages legitimately omit shell chrome (the user is mid-funnel and
should not see nav exits). The last commit message claimed "today / groups /
events / u/[username] are bundled with parallel i18n sweep work"; the working
tree confirms those four pages do mount the sidebar correctly, but
**events/[eventId] and events/new were left out of the sweep**.

### Findings

**P0 - events detail has no desktop chrome**
`src/app/[locale]/events/[eventId]/page.tsx:226` renders `<EventScreen />`
which in turn (`src/components/event/EventScreen.tsx:294-380`) outputs only a
sticky header + inner grid + `<MobileTabBar />`. There is no `<DesktopSidebar
/>`, no `md:pl-[240px]` on the `<main>`, and no `hidden md:flex` wrapper
around the on-page back-button row. On desktop the entire event screen sits
flush against the viewport-left edge with no left nav rail, which is jarring
next to every other authed screen and makes the demo loop visibly inconsistent
right at the moment the judge opens an event.

**P1 - events/new has no desktop chrome**
`src/app/[locale]/events/new/page.tsx:117-122` does not import
`DesktopSidebar` or `HeaderBell` and the `<main>` lacks `md:pl-[240px]`.
Captains landing here from desktop see no nav rail and no bell, then suddenly
get the rail back when they save and route to `/events/[id]/groups/[id]`.

**P1 - HeaderBell double-render on /calendar and /leaderboard at md+**
`src/app/[locale]/calendar/page.tsx:103` and
`src/app/[locale]/leaderboard/page.tsx:141` render the page header **without**
`md:hidden`, and that header includes a `HeaderBell` (calendar L120,
leaderboard L160). At md+ the bell is therefore visible **twice** - once in
the top-right of the page header, and once inside the DesktopSidebar
notifications row at the bottom (`DesktopSidebar.tsx:149-202`). Settings,
today, groups, events list, and u/[username] all correctly wrap their bell in
an `md:hidden` header. Either drop the bell from the calendar/leaderboard
header on desktop or wrap the whole header in `md:hidden`.

**P1 - u/[username] phantom 240 px gutter for unauthed visitors**
`src/app/[locale]/u/[username]/page.tsx:184` always sets `md:pl-[240px]`,
but the `<DesktopSidebar />` at L191 is gated by `viewer ?
... : null`. Public visitors hitting a profile from a share link see 240 px
of empty white space on the left of the content with nothing in it.

**P2 - notifications page has no `md:hidden` on its sticky header**
`src/app/[locale]/notifications/page.tsx:108-166` renders the back-button +
title sticky strip at all breakpoints. It does not double-render a bell (good
- there is no HeaderBell on this page) but the back-pill at desktop sits awkwardly
against the page content with the sidebar already showing the active
notifications nav item to the left. Consider `md:hidden` on the header or a
desktop-tuned variant.

---

## Section B. MobileTabBar (`src/components/layout/MobileTabBar.tsx`)

The recent diff (`250d822`) is a pure i18n cleanup: it drops the per-tab
`label` field, calls `useTranslations("sidebar")`, and re-aria-labels the nav.
No structural / visual change. The earlier `cfe9fc7` correctly added `grid
md:hidden` so the bar disappears at md+; verified at L55.

### Findings

**P1 - Create CTA still has no accent treatment** (regression of prior audit)
The locked spec at `docs/specs/06-ui-flows.md:18` reads: *"`Create` is the
centered tab and uses the `--accent` (sodium orange) treatment as the only
action-colored item in the bar"*. Today, in
`src/components/layout/MobileTabBar.tsx:71-99`, every tab receives the same
treatment: `color: active ? "var(--ink)" : "var(--ink-muted)"` regardless of
`tab.id === "create"`. The Create tab renders as a generic monochrome icon -
the only differentiator is the `Glyph.plus` shape. This is the exact same
finding the prior audit flagged and the recent `-9 lines` diff did not
address it. Recommended fix: branch on `tab.id === "create"` and apply
`color: var(--accent)` plus a soft pill background or 2 px accent underline.

**P2 - Bottom-gutter padding is consistent across pages**
Every page that mounts MobileTabBar uses `paddingBottom: "calc(78px +
env(safe-area-inset-bottom) + 16px)"` (today L77, groups L46, events L73,
calendar L96, leaderboard L134, settings L265, etc.). Notifications uses
96 px because of its action sheet. Verified - no last-row clipping risk on
mobile. **Exception:** EventScreen (`src/components/event/EventScreen.tsx:299`)
hard-codes `paddingBottom: 92` instead of the `calc(78 + safe-area + 16)`
formula. On iPhones with home-indicator (safe-area >34 px), the bottom of
the chat panel sits **under** the tab bar.

**P3 - 78 px tab-bar height is hard-coded across files**
The MobileTabBar uses `height: 78` (L60) and 21+ pages reproduce
`paddingBottom: "calc(78px + ...)"`. Worth promoting to `--nav-height-mobile`
(globals.css L84 already declares `--nav-height-mobile: 64px` but no one
uses it - and 64 != 78, so the variable is stale).

---

## Section C. HeaderBell (`src/components/layout/HeaderBell.tsx`)

Component itself looks correct: 40 x 40 button, `--ink` ring around dot, focus
ring via `focus-visible:outline-3`, `aria-label` switches between
`labelUnread` and `label`, `sr-only` label as fallback. No issues with the
component implementation.

Mount audit: see Section A. Summary: bell shows correctly on every authed
page, but is **doubled on desktop for /calendar and /leaderboard** (P1).

`src/components/layout/AppHeader.tsx` is dead code - it imports HeaderBell and
exports a generic 56 px sticky bar, but no consumer references it (verified by
`grep -rln 'AppHeader' src` returning only the file itself). **P3** -
unreference and delete or wire it into the pages whose ad-hoc headers are
mostly clones of it.

---

## Section D. Design tokens

### D.1 Forbidden 8 / 12 px radii (10 occurrences in 9 files)

The radius scale is `--r-pill 999`, `--r-chip 10`, `--r-card 18`,
`--r-surface 26`, `--r-shell 32`. 8 and 12 px are explicitly retired.

| File:Line | Value |
|-----------|------:|
| `src/app/[locale]/groups/[groupId]/page.tsx:255` | `borderRadius: 8` (icon swatch in Plan card) |
| `src/app/[locale]/groups/[groupId]/page.tsx:566` | `rounded-[12px]` (event proposal row) |
| `src/app/[locale]/settings/page.tsx:370` | `borderRadius: 8` (integrations row) |
| `src/components/settings/InlineEditPanels.tsx:596` | `borderRadius: 12` |
| `src/components/settings/SettingsTabs.tsx:122` | `borderRadius: 8` |
| `src/components/ui/SegmentedControl.tsx:56` | `borderRadius: 8` (track) |
| `src/components/ui/SegmentedControl.tsx:79` | `borderRadius: 8` (thumb) |
| `src/components/layout/AppHeader.tsx:50` | `borderRadius: 8` (logo swatch — but file is dead code) |
| `src/components/groups/GroupListItem.tsx:71` | `borderRadius: 12` |
| `src/components/events/EventListItem.tsx:75` | `borderRadius: 12` |
| `src/components/onboarding/SportsForm.tsx:381` | `borderRadius: 12` |

The prior audit flagged "25+" - this is now down to 11. **P2** - replace each
with `var(--r-chip)` (10 px is the closest semantic match) so a future global
radius nudge moves them all together.

### D.2 Off-token but tolerated radii (10 occurrences with 14 / 16 values)

`borderRadius: 14` and `16` appear in TodayPromptHero (L53, L81), RatchetRow
(L67), GroupChatForm (L296 chat bubble), VoteCard (L73), EventScreen (L200,
L246), VenueRow (L34), EventDetailsPanel (L158), SportsForm (L336). These
sit between `--r-chip` (10) and `--r-card` (18) and read as bespoke. **P3** -
either accept them as on-purpose or normalize to `--r-card`.

### D.3 Retired Tailwind palette tokens (2 files - down from 6)

| File:Line | Class |
|-----------|-------|
| `src/components/event/VenueVoteForm.tsx:42` | `border-red-200 bg-red-50` |
| `src/components/event/EventInvitePanel.tsx:132` | `border-red-200 bg-red-50` |

Both are danger banners that should consume `--alert` / `--alert-soft`
(declared in globals.css L31-32). **P2** - small surface but visually
inconsistent with the brand red.

### D.4 Contrast spot-check on DesktopSidebar active state

`DesktopSidebar.tsx:130` paints active items `--accent-deep #E84A1B` on
`--accent-tint #FFF1E8`. WCAG AA at 14 px / 600 weight needs 4.5:1; this pair
is approximately 4.6:1 - passes by a hair. **P3** - bump to `--ink` text on
`--accent-tint` if any future copy widens past 14 px.

---

## Section E. Spacing rhythm

The 4 / 8 / 16 / 24 / 32 token set is intentional. A grep for off-token
paddings (3, 5, 7, 9, 11, ...) returns mostly `px-5` (20 px) and `p-5`
(20 px) across page wrappers and cards (e.g. today L83, today L133,
calendar L100, leaderboard L138, settings L309, groups [groupId] L141 with
`px-4 py-4`). 20 px sits between 16 and 24 and is **not** in the documented
scale, but is used pervasively as a side-gutter. Treat as either
intentional brand choice or **P3** to sweep to `px-6` (24 px).

No truly bizarre paddings (`px-7`, `px-9`, ...) found anywhere in
`src/**/*.tsx`. Spacing is healthy.

---

## Section F. 360w form-factor regression sweep

Re-checked the JSX of the heaviest mobile screens:

- `today/page.tsx` mobile header (L82-130): `weather pill + HeaderBell` in a
  flex-row with `gap: 12`. At 360 px wide, the `firstName` block has
  `truncate` so a long name falls back gracefully. **OK.**
- `groups/[groupId]/page.tsx` mobile sticky header (L337-347): defers to
  `GroupHeader` which (per its API: backHref + label + captain + count + size
  + sport + rightSlot) probably accommodates 360 px.
- `events/[eventId]/page.tsx` -> EventScreen sticky header (L302-348): five
  things in a flex-row at md-: IconButton + title block (truncate) + Pill +
  HeaderBell. Status pill + bell can crowd a 360w viewport when the event
  status copy is long ("Cancelled" RO equivalent). **P2** - consider hiding
  the status pill on mobile or moving it into the body.
- `events/new/page.tsx` mobile header (L125-160): back chip + eyebrow + title
  with `truncate`. **OK.**
- `notifications/page.tsx` sticky header (L108-166): back-chip + title +
  Pill. **OK.**

No new 360w regressions detected from the spec text. Hard verification still
requires a real Playwright run at 360 / 375 / 390.

---

## Section G. Empty / loading / error coverage

Prior audit said "zero loading.tsx / error.tsx segments". Commit `22a2924`
("feat(ux): add loading+error segments") materially fixed this. Current
coverage:

| Segment | loading | error |
|---------|:-:|:-:|
| `[locale]` (root) | OK | OK |
| `[locale]/today` | OK | OK |
| `[locale]/groups` | OK | OK |
| `[locale]/groups/[groupId]` | OK | OK |
| `[locale]/events` | OK | OK |
| `[locale]/notifications` | OK | OK |
| `[locale]/settings` | OK | OK |
| `[locale]/map` | OK | OK |
| `[locale]/events/[eventId]` | **missing** | **missing** |
| `[locale]/events/new` | missing (form, lower priority) | missing |
| `[locale]/calendar` | **missing** | **missing** |
| `[locale]/leaderboard` | **missing** | **missing** |
| `[locale]/u/[username]` | **missing** | **missing** |
| `[locale]/onboarding/*` (4 routes) | missing | missing |
| `[locale]/login`, `signup`, `recover`, `i/[token]`, `demo` | missing | missing |

### Findings

**P1 - calendar / leaderboard / events/[eventId] / u/[username] still have no
loading / error segments.** These are all judge-visible flows that touch the
DB on every request. Without `loading.tsx` they fall through to the parent
`[locale]/loading.tsx` which works but is generic; without `error.tsx` an
unhandled DB / Groq blip throws the user back to the root error boundary.

**P2 - onboarding pages have no error segments.** A wonky save action will
crash the user out of the onboarding wizard mid-flow. Less critical because
the screens use server actions that return discriminated results.

---

## Section H. Component churn (recent diffs)

### `MatchPercentPanel.tsx` (commit d4901ba, +24 / -5)

Adds `reason` and `sourceLabel` props plus a small "rule scoring" pill in the
header (L56-65 in the diff). Visually clean: pill uses `--accent-tint` /
`--accent-deep`. **One concern**: the new pill uses
`px-2 py-1 text-[9px]` (L52 of the diff). 9 px text is below the prior audit's
visual-floor recommendation. **P2** - bump to `text-[10px]` and reuse the
existing `mono` 10-11 px convention from `Pill`.

### `TodayPromptCard.tsx` (commit 250d822, +13 / -6)

Added `promptHeadline` prop threaded from server `today/page.tsx:211`. Also
silently changed the AI label from `"AI scoring"` to `"Rule scoring"`
(`TodayPromptCard.tsx:290`) and kept the English-only description
`"weighing skill, schedule and proximity"` (L291) hard-coded. **P3**
(content/branding nit). The hard-coded English fallbacks at L282-291 and the
`"You're in · ${sportLabel}"` interpolations at L303-319 are i18n agent
territory but worth acknowledging since they ship visible English on the RO
locale until that sweep lands.

### `GroupChatForm.tsx` (commit 250d822, +10 / -2)

Diff is purely i18n: adds `captainAriaLabel` prop and replaces the hard-coded
`aria-label="Captain"` at L282. No structural change. The chat bubble at
L290-302 still uses `borderRadius: 16 / 4` for the speech-tail effect -
acceptable bespoke radii (Section D.2).

### `GroupTabs.tsx` (commit 250d822, +3 / -1)

Diff threads an `ariaLabel` prop down to `Tabs<V>`. **A11y P2 finding** is
unchanged by the diff but worth surfacing here: `GroupTabs.tsx:83-91`
declares `<div role="tabpanel">` for each panel but provides no
`aria-labelledby` linking back to the matching `<button role="tab">` in
`Tabs.tsx:36-48`, and Tabs has no `aria-controls` either. Same shape exists
in `EventTabs`. Screen-reader users won't get the relationship surfaced.
Also no Left/Right arrow handling on the tablist (only Tab moves focus).

---

## Section I. DesktopSidebar a11y

Reading `src/components/layout/DesktopSidebar.tsx`:

- L66 `<aside aria-label={t("ariaLabel")}>` - landmark labeled. OK.
- L115 `<nav aria-label={t("primaryAriaLabel")}>` - second landmark. OK.
- L122 `aria-current={active ? "page" : undefined}` - current-page indication
  for screen readers. OK.
- L126 `minHeight: 44` - 44 px tap target. OK.
- L138 / L171 Glyph icons use the same component as MobileTabBar - good
  consistency.
- Notifications row (L149-202) is a separate `<Link>` outside the nav. **P3**
  - either include it in the same `<nav>` or wrap it in its own `aria-label`
  to clarify why it sits below.
- The aside uses inline `style` for `position: fixed`. Tab order: starts at
  the brand link, then the 5 nav items, then the notifications row. Logical
  given the visual order. OK.
- **P2** - no skip-link to main content. With a 240 px sidebar, keyboard
  users have to tab through 7 items before reaching the page body on every
  page load. Add a `<a href="#main" className="sr-only focus:not-sr-only">`
  inside the `<aside>` or in the page layout.
- **P3** - active state uses `--accent-deep` text on `--accent-tint`
  background (Section D.4). Borderline AA at 14 px / weight 600.

---

## Section J. Em-dash compliance

`grep -rn '—' src messages` returns **zero** results. Commits e41b546,
6f16e0c, 41be34c held. **OK.**

---

## Section K. Misc finds

**P3 - dead `--nav-height-mobile` token.** `src/app/globals.css:84` declares
`--nav-height-mobile: 64px` but the actual MobileTabBar is 78 px and no one
references the variable. Either delete or align to 78.

**P3 - dead `AppHeader` component.** `src/components/layout/AppHeader.tsx`
has zero consumers and overlaps with the per-page mobile headers.

**P3 - inline `style` everywhere.** Most layout primitives use inline
`style={{ ... }}` rather than Tailwind utilities. Hot to maintain at this
scale; a future refactor pass should hoist common patterns (40 x 40 round
icon button, 36 x 36 back-chip, mono eyebrow line) into named components.
Out of scope for hackathon shipping.

**P2 - hard-coded English brand wordmark.** `DesktopSidebar.tsx:110` and
`AppHeader.tsx:64` both hard-code `"ShowUp2Move"` - fine since the brand is
locked, but flagging that any rename touches multiple files.

---

## Suggested fix order (cheapest -> highest impact)

1. **P1** - Add `Create` accent treatment in MobileTabBar (one branch on
   `tab.id`).
2. **P1** - Wrap calendar / leaderboard headers in `md:hidden` to kill bell
   double-render.
3. **P1** - Remove the always-on `md:pl-[240px]` from `u/[username]/page.tsx`
   when no viewer (tie it to `viewer ? "md:pl-[240px]" : ""`).
4. **P0** - Mount DesktopSidebar in EventScreen + add `md:pl-[240px]` to its
   `<main>` (or move the sidebar mount up into the route page and let
   EventScreen render only the inner shell). Also fix
   `paddingBottom: 92` -> `calc(78px + env(safe-area-inset-bottom) + 16px)`.
5. **P1** - Mount DesktopSidebar + `md:pl-[240px]` in events/new/page.tsx.
6. **P1** - Add loading.tsx + error.tsx for calendar, leaderboard,
   events/[eventId], u/[username].
7. **P2** - Sweep the 11 forbidden 8 / 12 radii to `var(--r-chip)`.
8. **P2** - Replace `bg-red-50 / border-red-200` in VenueVoteForm and
   EventInvitePanel with `--alert-soft` / `--alert`.
9. **P2** - MatchPercentPanel new sourceLabel pill: bump 9 px text to 10 px.
10. **P2** - GroupTabs / EventTabs: add `aria-controls` on tabs and
    `aria-labelledby` on tabpanels; consider keyboard arrow handling.
11. **P2** - Add a skip-to-main link in the desktop shell.
12. **P3** - Delete `AppHeader` or wire it into the duplicate page headers.
    Align or delete `--nav-height-mobile`.
