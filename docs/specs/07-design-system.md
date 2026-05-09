# 07 - Design System

## 1. Brand Direction

Name: **ShowUp2Move**

Brand idea (Direction B - locked): warm, confident, athletic. The interface reads like a calm command center: a cream daylight surface, a sodium-orange action that always means "do the thing", and an astroturf-green field that signals real play, real venues, real teams. It is fast, tactile, and a little bit human - never a generic SaaS dashboard, never a gamer dark mode, never a pastel social feed.

Mood words:

- daylight, sodium-arc, court chalk, confident type, immediate
- warm cream surfaces, ink-rich text, one loud accent
- shows up to play, not to scroll

Avoid:

- generic purple SaaS gradients
- fitness influencer / "athleisure" styling
- dark-only gamer styling
- overly playful cartoon visuals
- pastel social-feed neutrals
- sparkle / wand / magic-dust AI iconography

Prefer:

- crisp sports field energy with a single warm accent
- generous radius scale (10/18/26/32) and confident type
- tactile primary buttons in sodium orange
- map, schedule, and roster cues
- privacy-safe map language
- one clear primary action per screen

## 2. Logo Concept

Wordmark-first identity. Mark: **`s2m`** lowercase, set in Bricolage Grotesque 700, with the `2` styled as a forward arrow (right-pointing chevron-shaped numeral). It reads as "show up to move" without spelling it out, and it stays legible at 16px.

Construction rules:

- lowercase, tight tracking, no descenders
- the `2` is the only stylized glyph: its top curve is squared into a forward chevron, suggesting motion without being gimmicky
- never set the wordmark in Inter, never bolden into a fake "logo" effect, never wrap in a circle/badge
- pair with the AI mark only inside AI surfaces; the wordmark itself never carries the AI mark

Production SVG should use:

- simple geometric paths derived directly from Bricolage Grotesque 700 outlines
- no descenders, no enclosing shapes
- readable at 16px (mobile nav) and 24px (favicon)
- single-color and full-color variants
- full-color uses sodium orange `--accent` for the chevron-2 only; the `s` and `m` stay in `--ink`

Variants:

| Variant | Use |
|---|---|
| wordmark only | favicon, mobile nav, app header, OG image, landing header |
| monochrome | footer, emails, print |
| inverted | dark header or map overlay |
| split-color | full-color marketing (orange `2`, ink `s`/`m`) |

Wordmark:

- `s2m` (lowercase only)
- Bricolage Grotesque 700, tracking -1%
- the `2` is the only stylized character; nothing else is decorated
- in long-form marketing copy, the product name is written `ShowUp2Move`; the wordmark is `s2m`

## 3. Color Palette

Direction B - sodium orange + astroturf green on warm cream. These tokens are the canonical source. Tailwind/CSS variables must mirror them exactly.

Surfaces and ink:

| Token | Hex / value | Use |
|---|---|---|
| `--bg` | `#FAF7F0` | page background (warm cream) |
| `--bg-alt` | `#F4EFE5` | secondary page background, banded sections |
| `--surface` | `#FFFFFF` | cards, sheets, dialogs |
| `--surface-2` | `#FBF8F2` | nested or inset surfaces inside a card |
| `--ink` | `#0E1A1F` | primary text, icons |
| `--ink-2` | `#2A3942` | secondary text, captions |
| `--ink-muted` | `rgba(14,26,31,0.62)` | tertiary copy, helper text |
| `--ink-faint` | `rgba(14,26,31,0.36)` | placeholder, disabled labels |
| `--line` | `rgba(14,26,31,0.10)` | hairline borders, dividers |
| `--line-2` | `rgba(14,26,31,0.18)` | stronger borders, focus outline base |

Action accent (sodium orange) - the one loud color:

| Token | Hex / value | Use |
|---|---|---|
| `--accent` | `#FF5C2A` | primary CTA, ShowUpToday Yes, key brand strokes |
| `--accent-deep` | `#E84A1B` | accent hover/active, pressed state |
| `--accent-soft` | `#FFE4D6` | accent badge background, selected chip fill |
| `--accent-tint` | `#FFF1E8` | hover surface for accent-adjacent rows |
| `--on-accent` | `#1A0A03` | text/icons on top of `--accent` (high contrast on orange) |

Field (astroturf) - the team / venue / map color:

| Token | Hex / value | Use |
|---|---|---|
| `--field` | `#1E6E48` | venue chips, captain badge, map field, formation pitch |
| `--field-soft` | `#DCEDE2` | success surfaces, "going" status, group available |
| `--field-ink` | `#FFFFFF` | text on `--field` fills |

State colors:

| Token | Hex / value | Use |
|---|---|---|
| `--alert` | `#C8331E` | destructive, critical errors, declined, vote tie-break |
| `--alert-soft` | `#FBE3DD` | alert badge background |
| `--warn` | `#B8741B` | low-confidence pricing, weather warning, queue |
| `--warn-soft` | `#F8ECCC` | warn badge background |

Usage rules:

- Exactly one `--accent` action per screen. If you need a second orange element, it is the wrong screen.
- `--field` is reserved for "this is real play": venue chips, captain badge, formation pitch background, going-status pill. Do not use it as a generic success color outside group/event surfaces.
- Page bodies stay on `--bg`. Cards stay on `--surface`. Do not stack three surface tints on one screen.
- Body text always uses `--ink`. Never use `--accent` for body copy.
- Never reintroduce `--navy`, `--lime`, `--court`, `--coral`, `--mint`, `--cloud`, or `--danger` from the previous palette - those tokens are retired.
- Dark mode is out of scope for the hackathon; only the warm cream Direction B is implemented.

## 4. Type

Three-face system, all loaded via Google Fonts:

```css
--font-display: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
--font-body:    'Inter Tight',         ui-sans-serif, system-ui, sans-serif;
--font-mono:    'JetBrains Mono',      ui-monospace,  SFMono-Regular, Menlo, monospace;
```

Roles:

- **Display - Bricolage Grotesque 700.** Wordmark, hero headlines, landing titles, marketing one-liners. Tight tracking. Never used for body copy.
- **Body - Inter Tight 400 / 500 / 600.** All running UI text, labels, buttons, chat. Inter Tight only - **plain Inter is forbidden** because it does not match the optical sizing of Bricolage and ships visibly differently from Inter Tight.
- **Mono - JetBrains Mono 500.** Numbers, codes, scores, recovery codes, vote tallies, timers, lat/lng readouts. Anything that needs to feel measured.

Scale (mobile / desktop):

| Token | Size (mobile / desktop) | Face | Use |
|---|---|---|---|
| display | 40 / 64 | display | landing hero, demo screens only |
| h1 | 28 / 34 | display | screen titles |
| h2 | 22 / 28 | display or body 600 | sections, card headers |
| body | 15 / 17 | body 400 / 500 | running copy |
| small | 13 / 14 | body 500 | metadata, helper |
| micro | 11 / 12 | body 600 or mono 500 | chips, confidence badges, micro labels |

Rules:

- Inter (without "Tight") is forbidden. If you see it imported, replace it with `Inter Tight`.
- Display face is reserved for `display`, `h1`, and select `h2` headers. Never set body or buttons in Bricolage Grotesque.
- Mono is reserved for numeric / code content. Do not set sentences in mono.
- No viewport-based font sizing.
- Buttons must keep text within bounds at 360px width.
- Dense surfaces (Judge Mode rows, group rosters) use `body` or smaller, never display sizes.
- Tracking: display -1%; body 0; mono 0. No negative letter spacing on body text.

## 5. Component Rules

Use shadcn/ui patterns plus lucide-react icons.

Required components:

- Button
- IconButton
- Input
- Textarea
- Select
- Slider
- Badge
- Avatar
- Dialog
- Sheet
- Tabs
- Toast
- Skeleton
- Card
- SegmentedControl
- EmptyState
- SetupBanner
- WizardMobileHeader
- WizardStickyActionBar
- SetupChecklistDialog
- NotificationInbox
- ScoringProofRow
- FormationTimeline
- CaptainBriefPanel
- VoteCard
- RatchetRow
- Glyph (chevron-burst AI mark wrapper)
- MapBg (warm cream map canvas with stroke pattern)
- MapPin (sodium-orange pin with field-green dot)

Cards:

- border radius 8px
- no cards inside cards
- cards only for repeated items, tools, and modals

Buttons:

- icon-only buttons use lucide icons with tooltips
- primary action: green
- secondary: white with border
- destructive: red
- touch target minimum 44px

## 6. Screen Layout Tokens

```css
--page-max: 1120px;
--mobile-pad: 16px;
--desktop-pad: 32px;
--nav-height-mobile: 64px;

/* Direction B radius scale */
--r-pill: 999px;     /* pills, full-rounded buttons, segmented controls */
--r-chip: 10px;      /* chips, small badges, tags */
--r-card: 18px;      /* inner cards, list rows, message bubbles */
--r-surface: 26px;   /* hero cards, primary CTAs, sheets */
--r-shell: 32px;     /* full-screen sheets, mobile shell, dialogs */

--tap-target: 44px;
```

Radius rules:

- Never use 8px or 12px radii. The scale is 10/18/26/32 (plus pill).
- A button on a card uses `--r-pill` or `--r-surface`; the card itself uses `--r-card` or `--r-surface`. The button is always at least one step smaller than its container.
- Sheets and dialogs use `--r-shell` on the top corners on mobile.

Mobile:

- one column
- fixed bottom nav
- primary action near thumb zone
- maps use bottom sheet controls

Desktop:

- centered max width
- optional left status rail
- 2 or 3 column layout only when content benefits

Product surfaces:

- Today: one primary action, thumb-zone CTA, stable matching state card.
- Group: mobile tabs for Plan/Chat/Players; desktop members/chat/tools columns.
- Event: Details/Event chat/Vote tabs on mobile; venue/map/vote side panel on desktop.
- Judge Mode: dense checklist rows, green/yellow/red proof status, no marketing hero.

## 7. Motion

Use motion sparingly:

- prompt card slides in on first visit
- matched group card expands from loading state
- chat messages fade/translate 4px
- vote result bars animate width

Duration:

- 120ms for controls
- 180ms for cards
- 250ms max for page-level transitions

Respect `prefers-reduced-motion`.

## 8. Accessibility

Targets:

- WCAG AA contrast
- keyboard reachable everything
- visible focus rings
- form labels always present
- map has list fallback
- chat stream does not trap screen readers
- AI suggestions explain confidence in text, not only color
- maps always have list fallback and directions links outside the map canvas
- exact user home locations are never plotted

## 9. UI Quality Checklist

Before demo:

- no overlapping text at 360px, 390px, 768px, 1440px
- every empty state has a next action
- every loading state has stable dimensions
- every failed external API has fallback copy
- every icon-only button has tooltip/aria-label
- map lazy-load verified
- Lighthouse 95+ on mobile and desktop
- no console errors
- Judge Mode proof rows do not claim stretch integrations unless a real route or labeled fixture exists

## 11. AI Mark

The AI surfaces in this product never use a sparkle, wand, or magic-dust glyph. The canonical mark is the **chevron-burst Glyph**: two stacked, slightly rotated 14px squares with a chevron stroke through them, drawn in `--accent` on `--accent-soft`.

Usage:

- Wherever the user is looking at AI-generated content (sport extraction, photo analysis, captain brief, compatibility explanation, vote rationale), the chevron-burst Glyph sits to the left of the heading or chip.
- Confidence is communicated in `mono` micro text under the chip ("92%"), never as the only signal.
- Glyph size: 14px in chips, 18px in section headers, 24px in hero AI panels.
- Glyph color: stroke `--accent`, fill `--accent-soft`. On `--field` surfaces use `--field-ink` stroke on a `--field` fill.

Forbidden:

- Lucide `sparkles` icon for AI affordances. (Use `Glyph` instead.)
- Lucide `wand-2` / `wand-sparkles` for AI affordances.
- Generic gradient halos, "AI" pill text, or rainbow shimmer.

The Glyph component is the single source of truth - if a designer drops a sparkle into a mock, it does not get implemented.

## 10. Visual Identity in Demo

Judges should remember:

1. the one-tap "ShowUpToday?" card
2. the live matching explanation
3. the group chat + event plan split view
4. the map with venue and weather context
5. the logo mark in header, favicon, and OG image
