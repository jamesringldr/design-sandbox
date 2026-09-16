# Design bible language

Single vocabulary for every app and site this playground authors.
Vanyshr-specific names (`brand-500`, `navy-hero`, `§2 —`) do not belong here.

## Files

| File | Job |
|---|---|
| `docs/DESIGN.md` | Rules. Agents read this first. |
| `src/styles/tokens.css` (or the project's token path) | Values. If a value disagrees with DESIGN.md, this file wins. |
| `docs/COMPONENTS.md` | Adopted primitives. If a rule disagrees with DESIGN.md, DESIGN.md wins. |
| `docs/DESIGN-BIBLE.md` | Marker and log. No design content. The header (`bible`, `status: draft\|solidified`, `project`, and the `design` / `tokens` / `components` / `claude` paths) tells the playground a bible exists and where its files are. Below it, dated entries (`## YYYY-MM-DD — Title`), newest first, record each change: creation, token value changes on Integrate (format-only rewrites such as `rgb()` → hex are not logged), solidify / reopen. |

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
- Type families: `--font-ui` (body, controls) `--font-display` (headings, hero, big numbers) `--font-mono` (data, IDs, code)

Font families are chosen per product from Google Fonts in the playground (Visualizer → Libraries → Font). Unset families stay `--font-x: ;` in tokens.css and `_unset_` in 3 Type. When set, 3 Type lists each family token, family, and weights, plus the Google Fonts css2 URL to load them. Components use the family tokens, never family names.

## Template

Intake looks for `docs/DESIGN-BIBLE.md` first. If it exists, the bible is already built: intake loads the paths from its header and writes nothing. If it does not exist but design files do (`DESIGN.md`, `COMPONENTS.md`, `tokens.css`, `theme.css`), intake asks right away whether to build from them. If nothing exists, choose **Upload** or **+ Template**.

`+ Template` writes this skeleton. If the repo already has design files, intake asks **Integrate existing** or **Start fresh**. Every path writes `DESIGN-BIBLE.md` with a first log entry.

- **Start fresh** writes the empty skeleton.
- **Integrate existing** treats this template as the format. An already-shaped DESIGN.md is not overwritten. An old-shaped DESIGN.md is ingested: its section bodies fill the template; color *names* stay Core Colors, with values harvested from the repo.
- Until Save commits, the field reads **Un-Committed**.
