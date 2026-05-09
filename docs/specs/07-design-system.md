# 07 - Design System

## 1. Brand Direction

Name: **ShowUp2Move**

Brand idea: immediate, social movement. The interface should feel quick and useful: a sports coordination command center with enough warmth to make users want to join.

Avoid:

- generic purple SaaS gradients
- fitness influencer styling
- dark-only gamer styling
- overly playful cartoon visuals

Prefer:

- crisp sports field energy
- clean cards
- tactile buttons
- map and schedule cues
- confident contrast
- privacy-safe map language
- one clear primary action per screen

## 2. Logo Concept

Logo mark: **a location pin combined with a forward/play arrow and a court center dot**.

ASCII construction:

```text
      /\
   __/  \__
  /   ○    \
  \__    __/
     \  /
      \/

Pin + play arrow + ball/court dot
```

Production SVG should use:

- simple geometric paths
- no text inside the icon
- readable at 24px
- single-color and full-color variants

Variants:

| Variant | Use |
|---|---|
| icon only | favicon, mobile nav, app header |
| icon + wordmark | landing header, OG image |
| monochrome | footer, emails |
| inverted | dark header or map overlay |

Wordmark:

- `ShowUp2Move`
- use a strong sans face, semibold
- keep `2` visually compact, not gimmicky

## 3. Color Palette

Primary palette:

| Token | Hex | Use |
|---|---|---|
| `--navy` | `#101828` | app chrome, primary text |
| `--lime` | `#B7F34A` | primary "Yes" action, availability |
| `--court` | `#2563EB` | links, secondary emphasis |
| `--coral` | `#FF6B4A` | alerts, "Not today", destructive states |
| `--mint` | `#DDFCE8` | soft success surfaces |
| `--cloud` | `#F7F9FC` | page background |
| `--ink` | `#101828` | primary text |
| `--muted` | `#667085` | secondary text |
| `--line` | `#D7DEE8` | borders |
| `--surface` | `#FFFFFF` | cards and panels |
| `--danger` | `#DC2626` | destructive/error |

Use lime sparingly and with navy text for contrast. The app itself stays mostly white/cloud surfaces with navy text, court-blue links/maps, and coral warnings. Do not let the UI become a one-note green template.

## 4. Type

Recommended stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Scale:

| Token | Size | Use |
|---|---:|---|
| display | 40/44 | landing headline only |
| h1 | 28/34 | screen titles |
| h2 | 22/28 | sections |
| body | 16/24 | normal copy |
| small | 14/20 | metadata |
| micro | 12/16 | badges |

Rules:

- no negative letter spacing
- no viewport-based font sizing
- buttons must keep text within bounds at 360px
- dense surfaces use h2 or smaller, never hero-sized headings

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
--radius-card: 8px;
--radius-control: 8px;
--tap-target: 44px;
```

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

## 10. Visual Identity in Demo

Judges should remember:

1. the one-tap "ShowUpToday?" card
2. the live matching explanation
3. the group chat + event plan split view
4. the map with venue and weather context
5. the logo mark in header, favicon, and OG image
