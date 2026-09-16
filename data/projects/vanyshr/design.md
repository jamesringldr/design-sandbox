# Vanyshr design system

Agent-facing bible. Fill this in the playground. Values live in the token file;
rules live here. If a value disagrees, the token file wins. If a rule disagrees, this file wins.

- Token file: `packages/ui/src/styles/tokens.css`
- Components: `docs/COMPONENTS.md`

## 0 Quick Reference

**Composition:** _unset — layout type, content width, framing (flat / glass / other)._

**Hard rules:** No raw hex, rgb(), or rgba() in component files. No arbitrary px for spacing. No font families outside 3 Type. When a component exists in the catalog, use it. When ambiguous, stop and ask.

**Color:** `--color-primary`, `--color-primary-on`, `--color-secondary`, `--color-accent`, `--color-bg-app`, `--color-bg-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-status-danger`, `--color-brand-highlight`

Token file: `packages/ui/src/styles/tokens.css`. Catalog: `docs/COMPONENTS.md`.

**Components:** none adopted yet — see 11 Components.

## 1 Principles

1. Named tokens only. Components never invent a color, space, or type size.
2. If a component exists in COMPONENTS.md, use it. Do not rebuild it.
3. When this file does not cover a case, stop and ask. Do not freelance.

## 2 Color

This block must match the token file. Edit values in the playground, not by hand here.

```css
/* Design bible tokens. Values are filled in the playground. Do not edit by hand. */

:root {
  /* Color */
  --color-primary: #14ABFE;
  --color-primary-on: #1A1A1A;
  --color-secondary: #0B8FD9;
  --color-accent: #FF8400;
  --color-bg-app: #1E1E1E;
  --color-bg-surface: #333333;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A3A3A3;
  --color-border: #FFFFFF1A;
  --color-status-danger: #E5484D;
  /* Branding */
  --color-brand-highlight: #FF5E1F;
  /* Space */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
  /* Depth */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-pill: 999px;
  /* Motion */
  --duration-instant: 50ms;
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
  --duration-slower: 500ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --ease-linear: linear;
  /* Type sizes */
  --size-display: 30px;
  --size-title: 22px;
  --size-heading: 15px;
  --size-body: 14px;
  --size-caption: 12px;
  --size-label: 11px;
  --size-data: 13px;
  /* Type families */
  --font-ui: ;
  --font-display: ;
  --font-mono: ;
}

.light {
  --color-primary: #14ABFE;
  --color-primary-on: #1A1A1A;
  --color-secondary: #0B8FD9;
  --color-accent: #FF8400;
  --color-bg-app: #1E1E1E;
  --color-bg-surface: #333333;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A3A3A3;
  --color-border: #FFFFFF1A;
  --color-status-danger: #E5484D;
}
```

### Core Colors

| Seed token | Dark | Light |
|---|---|---|
| `--color-primary` | — | — |
| `--color-primary-on` | — | — |
| `--color-secondary` | — | — |
| `--color-accent` | #FF8400 | #FF8400 |
| `--color-bg-app` | — | — |
| `--color-bg-surface` | — | — |
| `--color-text-primary` | — | — |
| `--color-text-secondary` | — | — |
| `--color-border` | — | — |
| `--color-status-danger` | — | — |

### Branding Colors

Project-defined brand colors beyond the core set. Use them only for the role their name describes.

| Token | Name | Dark | Light |
|---|---|---|---|
| `--color-brand-highlight` | Highlight | #FF5E1F | — |

### Usage

| Seed token | What it controls |
|---|---|
| `--color-primary` | Main buttons, active tabs, key visual accents, selected states. Core brand identifier. |
| `--color-primary-on` | Text and icons that sit on color-primary. Must hold contrast (usually white or dark navy). |
| `--color-secondary` | Secondary buttons, badge highlights, active indicators, subtle interactive elements. |
| `--color-accent` | Used sparingly for high-interest callouts, feature highlights, or promo elements. |
| `--color-bg-app` | Foundational canvas of the entire screen and viewport. |
| `--color-bg-surface` | Cards, modals, sidebars, and dropdowns. Depth against color-bg-app. |
| `--color-text-primary` | Headings, main body text, primary icons. Overall contrast and feel. |
| `--color-text-secondary` | Captions, muted text, disabled labels, placeholder text. |
| `--color-border` | Card outlines, input borders, dividers. Soft vs sharp changes how dense the UI feels. |
| `--color-status-danger` | Error states, destructive buttons, delete alerts. The main functional alarm color. |

Text on `--color-primary` uses `--color-primary-on`.

## 3 Type

Named roles, never bare pixel sizes in components. Use `var(--size-body)`, not `16px`.

Families: **_unset_**. Name the UI font, data font, and any quarantined face here.

| Role | Size token | Size | Weight | Where used |
|---|---|---|---|---|
| display | `--size-display` | 30px | 600 | Hero / empty-state title |
| title | `--size-title` | 22px | 600 | Panel titles |
| heading | `--size-heading` | 15px | 600 | Section heads |
| body | `--size-body` | 14px | 400 | Running copy |
| caption | `--size-caption` | 12px | 400 | Helper text |
| label | `--size-label` | 11px | 500 | Field labels |
| data | `--size-data` | 13px | 500 | IDs, counts, timestamps |

## 4 Space

Base unit: **4px**. Do not invent off-scale gaps.

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Tight icon gaps |
| `--space-2` | 8px | Control padding, inline gaps |
| `--space-3` | 12px | Compact stacks |
| `--space-4` | 16px | Panel padding, section gap |
| `--space-5` | 24px | Group separation |
| `--space-6` | 32px | Page-level blocks |
| `--space-8` | 48px | Major region gaps |

## 5 Layout

_Stub. Add container max-widths, named breakpoints, and stacking rules for this product._

## 6 Depth

_Stub. Name elevation (border vs shadow), radius, and any recurring construction recipes._

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 4px | Chips, small fills |
| `--radius-md` | 6px | Inputs, buttons |
| `--radius-lg` | 10px | Panels, cards |
| `--radius-pill` | 999px | Pills, toggles, avatars |

## 7 Motion

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 50ms | Press feedback, focus ring |
| `--duration-fast` | 120ms | Color, chip state, hover |
| `--duration-base` | 200ms | Panel open, tabs, menus |
| `--duration-slow` | 320ms | Dialogs, sheets |
| `--duration-slower` | 500ms | Page-level reveal |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | Default for state changes |
| `--ease-emphasized` | cubic-bezier(0.34, 1.56, 0.64, 1) | Overshoot for lifts and pops |
| `--ease-decelerate` | cubic-bezier(0.05, 0.7, 0.1, 1) | Elements entering |
| `--ease-accelerate` | cubic-bezier(0.3, 0, 0.8, 0.15) | Elements leaving |
| `--ease-linear` | linear | Progress, spinners |

Honor `prefers-reduced-motion: reduce`.

**Intensity:** _unset._

**Hover properties allowed:** _unset._

## 8 Icons

_Stub. Name the icon package, import pattern, and sizing scale._

## 9 States

Hover, focus, active, disabled, loading, and error are token assignments, not per-component inventions.

- Hover on primary actions: `--color-secondary` or a dedicated hover once named
- Focus: 2px `--color-primary` ring
- Disabled: `--color-text-secondary`
- Danger: `--color-status-danger`

## 10 Anti-patterns

Two tiers. 10a is hook-enforced. 10b is agent judgment — not regex-checkable.

### 10a Mechanical (hook-enforced)

NEVER in component files:

- Raw hex
- `rgb()` / `rgba()` with literal values
- CSS color names
- Arbitrary utility values (`text-[#666]`, `p-[13px]`)
- Inline `style` carrying color or spacing values
- Font sizes in px not on the type scale
- New font families not named in 3 Type

### 10b Judgment (agent self-checked)

- Do not add a second accent without a new semantic state.
- Do not invent a component when COMPONENTS.md already covers the case.
- Do not exceed the motion intensity in 7 Motion without a stated reason.

## 11 Components

None adopted yet. Catalog: `docs/COMPONENTS.md`. Add a row when a primitive is adopted.
