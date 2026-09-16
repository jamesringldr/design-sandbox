# AppShots conversion

AppShots turn uploaded screenshots into lightweight, token-driven pages. The playground's Colorway, Spacing, and Elevation/Borders/Radius panels restyle them live. Screenshots come from uploads (Visualizer → Static → AppShots) or the **Capture** button on the Live tab, which saves a full-page headless-Chromium screenshot of the current view. **Conversion is done by a Claude Code session** following this document.

## Files

```
data/projects/<slug>/appshots/
  appshots.json        index: [{ id, label, device, width, height, image, createdAt }]
  <id>.png|jpg|webp    the screenshot
  <id>.html            the converted page — you write this
```

A shot is pending until `<id>.html` exists; the playground picks it up within a few seconds. Do not edit `appshots.json` or the images.

`width` is the CSS width the page is designed at: uploads use 393 (mobile) or 1440 (desktop); Live-tab captures use the device size they were captured at (e.g. 430 for iPhone 15 Pro Max). `height` is the screenshot's height at that width. Tall screenshots are full-page captures: convert the whole page.

## Job

For each pending shot: read the screenshot, then write `<id>.html` that reproduces its **structure and real text** at `width` CSS px, painted only through tokens.

- **Keep:** layout, sections, components (nav, cards, lists, forms, buttons, chips, tabs), their order and rough proportions, and all visible copy, verbatim.
- **Replace:** photos, illustrations, maps, charts, logos → placeholder blocks of the same size (`.ph`). Icons → simple shapes (an outlined rounded square or circle at the icon's size). Avatars → circles.
- **Skip:** the device status bar and home indicator on mobile screenshots, browser chrome on desktop screenshots.

This is a lightweight page, not a pixel copy. Prefer fewer, reusable classes over one-off tweaks.

## Format

One HTML fragment: a `<style>` block, then markup. It renders inside a shadow root sized `width` × `height`, so styles are scoped automatically — use short class names freely.

```html
<style>
  .page { min-height: 100%; display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-4); }
  .card { background: var(--surface); border: var(--border-width) solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); box-shadow: var(--shadow-1); }
  .btn { height: 44px; padding: 0 var(--space-4); border-radius: var(--radius-md); background: var(--brand); color: var(--on-control-contrast); font-weight: 600; }
  .muted { color: var(--text-muted); }
  .ph { background: var(--surface-elevated); border-radius: var(--radius-md); }
</style>
<div class="page">
  <div class="card">
    <h2>Real heading from the screenshot</h2>
    <p class="muted">Real supporting copy.</p>
    <div class="ph" style="height: 160px"></div>
    <button class="btn">Get started</button>
  </div>
</div>
```

The host already sets `background: var(--background)`, `color: var(--text)`, `font-family: var(--font-ui)`, `font-size: 14px`, and `box-sizing: border-box`; `h1`–`h4` use `var(--font-display)` and `code`/`pre` use `var(--font-mono)`. Give other headline-style text (hero numbers, big stats) `var(--font-display)` and data text (IDs, timestamps, tabular numbers) `var(--font-mono)`. Reset default margins on headings and paragraphs you use.

## Token rules (enforced by the checker)

| Property | Must use | Never |
|---|---|---|
| Any color (`color`, `background`, `border-color`, `fill`, `stroke`, `outline`, gradients) | color tokens below, or `transparent` / `currentColor` / `inherit` | hex, `rgb()`, `hsl()`, named colors |
| `margin`, `padding`, `gap`, `row-gap`, `column-gap`, `inset`, `top/right/bottom/left` offsets used as spacing | `var(--space-*)`, `0`, `auto`, `%` | bare px spacing |
| `border-radius` | `var(--radius-*)`, `0`, `50%` | px |
| Border widths (`border`, `border-*`, `outline`) | `var(--border-width)`, `0`, `none` | px widths |
| `box-shadow` | `var(--shadow-1/2/3)`, `none` | literal shadows |
| `font-family` | `var(--font-ui)`, `var(--font-display)`, `var(--font-mono)`, `inherit` | family names |

**Allowed as literals:** font size, weight, line height, letter spacing; fixed element sizes (`width`, `height`, `min-*`, `max-*`, `flex-basis`, grid track sizes) — e.g. a 44px button height, a 40px avatar, a 160px placeholder; opacity; z-index.

Pick the nearest token instead of an exact pixel match (a 14px gap → `var(--space-3)` or `var(--space-4)`).

**Color tokens** (dark and light values come from the project):

| Token | Use |
|---|---|
| `--background` | Page canvas |
| `--surface` | Cards, panels, inputs |
| `--surface-elevated` | Raised surfaces, placeholders, tracks |
| `--border` | Outlines and dividers |
| `--text`, `--text-muted` | Primary and secondary text |
| `--brand`, `--brand-hover`, `--brand-subtle` | Primary actions, links, active and selected states, tints |
| `--on-control-contrast` | Text/icons on `--brand` and `--control-contrast` fills |
| `--control-contrast` | High-contrast fills (e.g. a white pill button on dark) |
| `--background-brand` | Brand-tinted hero or section backgrounds |
| `--warning`, `--success`, `--destructive` (+ `-subtle`) | Status only, never decoration |
| `--brand-<name>` | Project branding colors (e.g. `--brand-highlight`), when the screenshot uses that role |

**Scale tokens:** `--space-1,2,3,4,5,6,8` (4, 8, 12, 16, 24, 32, 48px by default) · `--radius-sm/md/lg/pill` · `--border-width` · `--shadow-1/2/3`.

**Font tokens:** `--font-ui` · `--font-display` · `--font-mono` (set in Libraries → Font).

## Hard rules

- No `<script>`, `<link>`, `<iframe>`, external images, fonts, or URLs. The loader strips scripts, links, and iframes.
- No `<img>`: use `.ph` blocks.
- Inline `style` attributes only for fixed sizes (e.g. `style="height: 160px"`), never for color, spacing, radius, borders, or shadows.
- Root element fills the width (`width` is the page width); don't set a fixed page width.

## Check before finishing

Run the checker on every page you wrote, and fix everything it reports:

```
node app/scripts/check-appshot.mjs data/projects/<slug>/appshots/<id>.html [...more]
```

Then tell the user which shots were converted and anything you approximated (e.g. a chart replaced by a placeholder).
