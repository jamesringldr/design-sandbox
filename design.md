# Vanyshr design system

Source of truth for production. Generated from the design sandbox artifact.
Integrate by diffing this file into the app; do not copy sandbox HTML into the app.

- Version: v1
- Date: 2026-09-04
- Scope: foundations. Component specs are appended as each component is adopted.
- Target stack: React + Tailwind
- Theme: dark only

---

## 1. Principles

1. One accent. `--brand` blue carries every primary action and active state. Orange, mint
   and red are semantic signals and never decoration.
2. Status reads as outline. Filled backgrounds are reserved for counts in navigation, so a
   filled shape anywhere else means "quantity", not "state".
3. Compact by default. This is a data product: 32–36px controls, 12–13px labels, tight
   vertical rhythm on a 4px base.
4. Monospace carries data. Plex Mono handles IDs, timestamps, counts, and uppercase labels.
5. Terminal type is quarantined. Space Grotesk lowercase appears only in log and activity
   output, which makes machine voice visually distinct from interface voice.

---

## 2. Color tokens

```css
:root {
  /* Neutrals — Brick */
  --background: #282828;
  --surface: #404040;
  --surface-elevated: #333333;
  --border: rgba(255, 255, 255, 0.10);

  --text: #FFFFFF;
  --text-muted: #A3A3A3;

  /* Brand */
  --brand: #14ABFE;
  --brand-hover: #0B8FD9;
  --brand-subtle: rgba(20, 171, 254, 0.14);

  /* Semantic */
  --warning: #FF5E1F;
  --warning-subtle: rgba(255, 94, 31, 0.14);
  --success: #3DDC97;
  --success-subtle: rgba(61, 220, 151, 0.14);
  --destructive: #E5484D;
  --destructive-subtle: rgba(229, 72, 77, 0.14);

  /* Inverted control (rare) */
  --control-contrast: #E0DEDC;
  --on-control-contrast: #1A1A1A;

  /* Splash / hero only */
  --background-brand: #0A1628;
}
```

### Usage

| Token | Where it is used | Where it must not be used |
|---|---|---|
| `--background` | Page and app shell | Cards sitting on the page |
| `--surface-elevated` | Panels, cards, popovers on `--background` | Page background |
| `--surface` | Secondary buttons, inputs on panels, filled rows | Large fill areas |
| `--border` | Every divider and control outline at rest | Emphasis — raise to 18% or 24% instead |
| `--brand` | Primary action, active tab, progress fill, links | Text over `--surface` at body size |
| `--warning` | Needs-review and identity-check states | Any decorative accent |
| `--success` | Completed removals, healthy status | Primary actions |
| `--destructive` | Destructive actions and failures | Warnings |
| `--control-contrast` | Rare high-emphasis control (segmented selection) | More than one instance per screen |
| `--background-brand` | Splash and hero surfaces only | Any in-app panel |

Text on `--brand` and `--control-contrast` is `--on-control-contrast` (#1A1A1A), never white.

### Border emphasis ladder

| Level | Value | Use |
|---|---|---|
| Rest | `rgba(255,255,255,0.10)` | Dividers, panels, inputs |
| Hover / secondary control | `rgba(255,255,255,0.18)` | Outline buttons, hoverable rows |
| Emphasis | `rgba(255,255,255,0.24)` | Unchecked checkbox and radio |
| Status outline | Status hue at 35% | Status chips, destructive outline button |

---

## 3. Typography

Interface: **IBM Plex Sans** (400, 500, 600)
Data and labels: **IBM Plex Mono** (400, 500)
Terminal output only: **Space Grotesk** (400, 500), always lowercase

| Role | Family | Size | Weight | Tracking | Line height |
|---|---|---|---|---|---|
| display | Plex Sans | 30px | 600 | -0.03em | 1.05 |
| title | Plex Sans | 22px | 600 | -0.02em | 1.15 |
| heading | Plex Sans | 15px | 600 | 0 | 1.3 |
| body | Plex Sans | 14px | 400 | 0 | 1.6 |
| caption | Plex Sans | 12px | 400 | 0 | 1.4 |
| label | Plex Mono | 10px | 400 | 0.14em | 1.2 |
| data | Plex Mono | 13px | 500 | 0 | 1.4 |
| terminal | Space Grotesk | 13px | 400 | 0 | 1.45 |

Rules: `label` is always uppercase and `--text-muted`. `data` is monospace so figures align
in columns. `terminal` is always lowercase and colored by its semantic token. Body copy
carries `text-wrap: pretty`. Nothing below 10px.

---

## 4. Geometry and spacing

Radius: `4px` chips and small fills · `6px` controls, inputs, buttons · `10px` panels and
cards · `999px` pills, toggles, avatars, progress tracks.

Spacing scale, 4px base: `4 · 8 · 12 · 16 · 24 · 32 · 48`. Compact rhythm — panel padding 16,
control padding 8/14, row padding 14/20, section gap 16, group gap 48.

Control heights: input and select `34px`, button `34px` (8px vertical padding on a 13px
label), icon button `32×32`, toggle `34×20`, checkbox and radio `16px`, progress bar `6px`.

No shadows. Elevation is expressed by surface value and border, not by shadow.

---

## 5. Tailwind mapping

```js
// tailwind.config.js — extend
theme: {
  extend: {
    colors: {
      background: '#282828',
      surface: { DEFAULT: '#404040', elevated: '#333333' },
      brand: { DEFAULT: '#14ABFE', hover: '#0B8FD9', subtle: 'rgba(20,171,254,0.14)' },
      warning: { DEFAULT: '#FF5E1F', subtle: 'rgba(255,94,31,0.14)' },
      success: { DEFAULT: '#3DDC97', subtle: 'rgba(61,220,151,0.14)' },
      destructive: { DEFAULT: '#E5484D', subtle: 'rgba(229,72,77,0.14)' },
      contrast: { DEFAULT: '#E0DEDC', on: '#1A1A1A' },
      hero: '#0A1628',
      muted: '#A3A3A3',
    },
    fontFamily: {
      sans: ['"IBM Plex Sans"', 'Helvetica', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'monospace'],
      terminal: ['"Space Grotesk"', 'monospace'],
    },
    borderRadius: { chip: '4px', control: '6px', panel: '10px' },
    borderColor: { DEFAULT: 'rgba(255,255,255,0.10)' },
  },
}
```

---

## 6. Components

None adopted yet. Each adopted component gets a section here with anatomy, tokens used,
states, and interaction notes. Components are built from Mobbin references for structure
and behavior only; visual language always comes from sections 2–4 above.
