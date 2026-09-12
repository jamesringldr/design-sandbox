# Design bible language

Single vocabulary for every app and site this playground authors.
Vanyshr-specific names (`brand-500`, `navy-hero`, `§2 —`) do not belong here.

## Files

| File | Job |
|---|---|
| `docs/DESIGN.md` | Rules. Agents read this first. |
| `src/styles/tokens.css` (or the project's token path) | Values. If a value disagrees with DESIGN.md, this file wins. |
| `docs/COMPONENTS.md` | Adopted primitives. If a rule disagrees with DESIGN.md, DESIGN.md wins. |

## Headings

`## {n} {Title}` — number, space, title. No section sign, no em dash.

```
## 0 Quick Reference
## 1 Principles
## 2 Color
## 3 Type
## 4 Space
## 5 Layout
## 6 Depth
## 7 Motion
## 8 Icons
## 9 States
## 10 Anti-patterns
## 11 Components
## 12 Effects          ← optional
```

Subheads under 10: `### 10a Mechanical` and `### 10b Judgment`.

## Core Colors

CSS custom properties. Seed names are the token. Group labels are documentation only — they are not a column in the UI.

| Seed token | What it controls |
|---|---|
| `--color-primary` | Main buttons, active tabs, key accents, selected states. Brand identifier. |
| `--color-primary-on` | Text/icons on `color-primary`. Must hold contrast. |
| `--color-secondary` | Secondary buttons, badges, subtle interactive elements. |
| `--color-accent` | Sparse callouts, feature highlights, promo. |
| `--color-bg-app` | Screen/viewport canvas. |
| `--color-bg-surface` | Cards, modals, sidebars, dropdowns. |
| `--color-text-primary` | Headings, body, primary icons. |
| `--color-text-secondary` | Captions, muted, disabled, placeholders. |
| `--color-border` | Outlines, input borders, dividers. |
| `--color-status-danger` | Errors, destructive actions, delete alerts. |

Do not emit `--brand-500`, `--gray-950`, or hex in components. Hex lives only in `tokens.css`.

## Space, depth, motion, type

- Space: `--space-1` … `--space-8` on a 4px base
- Radius: `--radius-sm` `--radius-md` `--radius-lg` `--radius-pill`
- Motion: `--duration-fast` `--duration-normal` `--duration-slow`
- Type sizes: `--size-display` `--size-title` `--size-heading` `--size-body` `--size-caption` `--size-label` `--size-data`

Font family names are filled per product. The skeleton leaves them `_unset_`.

## Template

`+ Template` writes this skeleton with empty color values. If the repo already has design files, intake asks **Integrate existing** (map harvested colors onto these names) or **Start fresh** (empty skeleton). Until Save commits, the field reads **Un-Committed**.
