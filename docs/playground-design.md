# Design: Vanyshr Design Playground

Date: 2026-09-10
Branch: main
Mode: Builder (internal tool; James is the day-one user)

This file is the product design for the playground. It is not the Vanyshr visual spec.
The visual spec remains `design.md`. Do not merge the two.

---

## Problem Statement

Frontend agents on Vanyshr are directed page by page and component by component. That produces two failures:

1. **Slow visual iteration.** Seeing a token change currently means editing React (or the static DC artifact) and rebuilding. Minor tweaks are expensive, so they get skipped or accepted as "close enough."
2. **Non-prescriptive design.** Tokens live in `design.md` and a static artifact, but they are incomplete (no adopted components) and not the runtime source of the app. Agents invent near-miss hex values and one-off components. Pages drift.

The long-term vision is a multi-project design lab (any app, Mobbin ingest, repo connect, apply tokens onto real pages). That is not the first product. The first product is a live playground that owns Vanyshr's tokens, shows them on canonical screens, and exports files agents and the app must consume.

---

## Agreed Premises

1. Day-one user is James, on Vanyshr. Generic multi-app support is a data-model choice, not a v1 feature.
2. Agent drift is fixed by **exported files plus rules in the app repo**, not by a prettier preview alone.
3. v1 does not iframe, parse, or restyle Vanyshr-mono pages. Canonical screens in the playground are enough.
4. The DC artifact (`Vanyshr Design System.dc.html`) is a harvest source and a v1 snapshot. It is not the runtime. The DC format (inline styles, no CSS variables, no classes) cannot host this product.
5. Vanyshr stays dark-only in v1. Light/dark is a later token-set feature.
6. Randomize starts as **color only**, and respects semantic roles (brand stays brand; warning/success/destructive stay in their hue families).

---

## This session vs v1 vs later

These are three different products. Do not build the next column.

| | This session | v1 playground | Later |
|---|---|---|---|
| Goal | Prove the live loop | Daily Vanyshr tool | Multi-app lab |
| UI | `--brand` input + primary button + in-progress chip | Token pane + 3 canonical screens | Projects, ingest, real-app apply |
| Persistence | In-memory is enough | **Save** writes `tokens.json` + `theme.css` + `design.md` §2 `:root` | Multi-project files |
| Randomize / contrast / type editors | No | Yes (color randomize only) | Type/spacing randomize, light theme |

**This session, boxed:** Seed colors from `design.md` §2. Vite app. One color input writes `--brand` onto `:root` via `document.documentElement.style.setProperty`. A primary button (`background: var(--brand)`) and an in-progress chip (`color: var(--brand); border-color: color-mix(in srgb, var(--brand) 35%, transparent)`) repaint with no rebuild. No Tailwind utilities compiled from hex. No save-to-repo. No randomize. No `projects/` tree required yet.

---

## What We Learned

The current repo is foundations-only: locked tokens, no adopted components, no Candidates section, type scale already drifting between the artifact and `design.md`.

The iteration loop James wants (edit a core token → every example updates; lock some tokens and randomize the rest) already exists in marketing-palette tools (Realtime Colors lock + spacebar randomize) and shadcn theme editors (TweakCN). Those tools do not:

- export an **agent-facing** `design.md` with usage rules
- render **Vanyshr screens** (removal queue, identity check, activity log)
- enforce Vanyshr constraints (one accent, outline status, terminal type quarantined)

That gap is the product. DesignMD-style extractors go the other direction (site → markdown). This playground goes tokens → live UI → markdown/CSS that agents must follow.

The "apply changes to real pages" instinct is right as an outcome and wrong as a v1 mechanism. The cheap version: Vanyshr-mono **consumes** `theme.css`. Then the real app restyles when tokens change. Parsing React to fake-render production pages is a compiler; do not start there.

---

## Landscape (short)

| Existing | What it covers | What it misses for this |
|---|---|---|
| TweakCN / shadcn theme generators | Live color/type/radius on generic components, Tailwind export | Generic shadcn set, not Vanyshr screens or agent rules |
| Realtime Colors | Lock + randomize palette on a demo marketing page | Not a design system; no components, no `design.md` |
| live-tokens (Svelte) | Edit CSS variables on the running site | Couples editor to that app's stack; no agent export |
| DesignMD / DESIGN.md extractors | Site → markdown for agents | No live playground; extract, don't author |
| This repo's DC artifact | Vanyshr visual language, frozen | Cannot live-update; cannot export CSS; no interaction |

**EUREKA:** Everyone solves "pick pretty colors." Almost no one solves "make the color law for an AI frontend agent, on *this* product's screens." The style guide is a means. The export that agents cannot ignore is the product.

---

## Recommended Approach

**A — Vanyshr playground first**, shaped so the later lab is an expansion rather than a rewrite.

A local Vite + React app in this repo. Tokens live as JSON. The playground writes them onto `:root` as CSS variables (`setProperty`), so previews that use `var(--token)` repaint with no rebuild.

Tailwind is allowed for playground chrome later. **Live token values must never be compiled hex.** If Tailwind is used for themed pieces, `@theme` maps to `var(--brand)` etc. `design.md` §5 is a production mapping with baked hex — it is not the live path.

v1 **Save** (one verb) writes `tokens.json`, `theme.css`, and **only** the `:root` block in `design.md` §2. Usage tables, border ladder, type/geometry prose, and §5 stay hand-written until a later generator. A Vite middleware does the write in v1; this session does not build it. Download-as-file is the fallback if middleware is down.

`projects/vanyshr/` is the v1 folder shape so a second app later is not a rewrite. This session can keep tokens in `app/` until Save exists.

Repo connect, Mobbin, light mode, and "apply to parsed app pages" stay out.

### What it is

Three panes, one loop:

```
┌──────────────┬─────────────────────────────────────────┐
│ Tokens       │ Preview                                 │
│              │  [ Style guide ] [ Queue ] [ Activity ] │
│ Color roles  │                                         │
│  lock · hex  │  Canonical screens using var(--token)   │
│              │                                         │
│ [Randomize]  │  Contrast: text/bg, text/surface,       │
│ [Save]       │           on-contrast/brand             │
└──────────────┴─────────────────────────────────────────┘
```

- **Edit** a token → CSS variable updates → every preview using that variable updates immediately.
- **Lock** any color role. **Randomize** regenerates unlocked colors in OKLCH, keeping semantic hue families.
- **Save** writes `tokens.json`, `theme.css`, and the `:root` block of `design.md` §2.

### Why this over the alternatives

- **Full lab from day one** matches the vision and delays the thing that hurts now (Vanyshr iteration + agent drift) by months.
- **Skip the playground, tokens-in-the-app-only** stops some hex drift but leaves the visualization loop unsolved — which is half the original pain.

### Key design decisions

1. **CSS variables are the live medium.** `tokens.json` is the saved source. `theme.css` and `design.md` §2 `:root` are generated views. Do not hand-edit generated CSS. Do not use `design.md` §5 hex as live values.
2. **Canonical screens, not the production app.** v1 screens are the current artifact, rebuilt on tokens: foundations board, removal queue panel, activity stream.
3. **Harvest, then freeze the DC files.** Keep `Vanyshr Design System.dc.html` and `versions/2026-09-04-v1/` as history. Do not add candidates to the DC file. When the playground is actually the source, update `CLAUDE.md` / `README.md` so they stop naming the DC file as visual truth. That rule change is part of v1 Save, not this session.
4. **Color-first.** Type, radius, and density are visible and editable as tokens in v1, but randomize is color only.
5. **Contrast is a warning, not a theory engine.** Flag these pairs only: `--text` on `--background`, `--text` on `--surface` / `--surface-elevated`, `--on-control-contrast` on `--brand`, `--on-control-contrast` on `--control-contrast`. Do not auto-rewrite the palette.
6. **Save writes the repo (v1, not this session).** Dev-only Vite middleware. No auto-commit.
7. **Vanyshr-mono wiring is a follow-on, in the app repo.** Import `theme.css` and ban raw hex in agent rules after the first successful Save — not during playground scaffolding.
8. **Status chip outlines are derived, not a second hex.** `border-color: color-mix(in srgb, var(--status-color) 35%, transparent)` where `--status-color` is `--brand` / `--success` / `--warning` / `--destructive` / `--text-muted`. Do not add `--brand-outline` unless color-mix proves insufficient.
9. **Playground chrome may use literal hex until v1.** The preview widgets must not.

### Token model

Keep the v1 semantic set already in `design.md`. Do not invent a parallel palette. Colors in JSON are CSS color strings as written in `design.md` (hex or `rgba()`).

This session only needs `colors.brand` (and whatever is required to paint the two widgets). The shape below is the v1 file.

```json
{
  "colors": {
    "background": "#282828",
    "surface": "#404040",
    "surfaceElevated": "#333333",
    "border": "rgba(255, 255, 255, 0.10)",
    "text": "#FFFFFF",
    "textMuted": "#A3A3A3",
    "brand": "#14ABFE",
    "brandHover": "#0B8FD9",
    "brandSubtle": "rgba(20, 171, 254, 0.14)",
    "warning": "#FF5E1F",
    "warningSubtle": "rgba(255, 94, 31, 0.14)",
    "success": "#3DDC97",
    "successSubtle": "rgba(61, 220, 151, 0.14)",
    "destructive": "#E5484D",
    "destructiveSubtle": "rgba(229, 72, 77, 0.14)",
    "controlContrast": "#E0DEDC",
    "onControlContrast": "#1A1A1A",
    "backgroundBrand": "#0A1628"
  },
  "locks": {
    "brand": true,
    "warning": true,
    "success": true,
    "destructive": true,
    "backgroundBrand": true
  }
}
```

Type and geometry stay in `design.md` until v1 adds them to this file. CSS custom properties on `:root` use kebab-case (`--brand`, `--surface-elevated`, `--text-muted`, `--on-control-contrast`).

**Untokened artifact hex — out of the first slice, list for v1:** activity panel `#1E1E1E`; secondary button hover `#4A4A4A`; outline-button hover `rgba(255,255,255,0.32)` (not on the 10/18/24 border ladder); disabled border `0.06`. Canonical screens in v1 either drop those states or promote them to tokens. Do not smuggle them in as literals and call the screen "tokenized."

Randomize rules (color only):

- Locked keys are not touched.
- Neutrals (background / surface / surface-elevated / text / text-muted / border) move as one ramp: shared hue, stepped lightness. Do not independently randomize each gray.
- `--brand` and `--brand-hover` / `--brand-subtle` move together. Hover is a darker/less-light sibling, not a new hue.
- `--warning`, `--success`, `--destructive` may shift lightness/chroma but stay in orange / mint / red families. They are never used as the primary action color.
- `--control-contrast` and `--background-brand` may randomize only if unlocked; default lock `--background-brand` (hero-only, easy to wreck).
- Default locks on first load: `brand`, `warning`, `success`, `destructive`. James can unlock them. This avoids a randomize that accidentally promotes mint to the primary button.

### Preview surfaces (v1)

| Surface | Job |
|---|---|
| Style guide | Color swatches, type scale, status chips, six button treatments — current artifact sections 01–04 |
| Removal queue | Panel + rows + outline chips — current artifact section 05 left |
| Activity stream | Terminal type, semantic line colors — current artifact section 05 right |

All of these use `var(--token)` and the type tokens. No literal hex in playground UI except inside the editor inputs.

### Type scale decision

The artifact and `design.md` disagree (display 40 vs 30, body 15 vs 14, etc.).

**Seed from `design.md`. Frozen.** If the board feels too small, edit the token in the playground after type is in `tokens.json`. Do not keep a third live scale.

### Repo shape

```
design-sandbox/
  app/                          # Vite + React + Tailwind playground
    src/
      tokens/                   # load, apply to :root, randomize
      editor/                   # color rows, lock, randomize, contrast
      preview/                  # style guide + screens
      export/                   # json → theme.css, design.md token block
    vite.config.ts              # dev middleware: POST /save → write files
  projects/
    vanyshr/
      tokens.json               # source of truth
  theme.css                     # generated, git-tracked
  design.md                     # tokens section generated; component specs still hand-written
  Vanyshr Design System.dc.html # frozen harvest / snapshot
  versions/2026-09-04-v1/       # unchanged
  docs/playground-design.md     # this file
```

`projects/` exists so a second app later is `projects/<name>/tokens.json` plus screens, not a rewrite.

### Stack

- This session: Vite + React. Inline `style={{ background: "var(--brand)" }}` (or a style tag) is enough.
- v1: Tailwind CSS v4 optional for chrome; themed components still read `var(--token)`. Randomize/contrast use `culori` or `colorjs.io` in OKLCH.
- No auth, no database. `npm run dev` is the product.

Why React: Vanyshr's production target is React + Tailwind. Canonical screens can later be the visual reference agents are told to match. Do not take a Tailwind `@theme` hex compile in the first session or the live loop will look broken.

---

## Alternatives Considered

**B — Full design lab from day one.** Multiple projects, repo connect, Mobbin ingest, light/dark, apply-to-real-pages. Rejected for v1: it is the 12-month product. Building it first delays the Vanyshr loop that already hurts.

**C — Skip the playground.** Put CSS variables into Vanyshr-mono and ban raw hex in agent rules. Rejected as the *only* move: it helps drift but does not solve "I cannot see a token change without a rebuild." It remains the first follow-on in the app repo once export exists.

**Extend the DC artifact.** Rejected: inline styles and "no values in holes" make live token editing structurally impossible.

---

## Scope

### v1 (this playground)

- One project: Vanyshr
- Load `tokens.json`, paint `:root`, live-edit colors
- Lock per color role + randomize unlocked colors (role-aware, OKLCH)
- Type and radius displayed and editable, not randomized
- Three canonical previews listed above
- Contrast warnings on the critical pairs
- **Save** to repo via Vite middleware: `tokens.json`, `theme.css`, `design.md` §2 `:root` only
- Density is a token (`compact`) shown in the editor, not a randomize axis

### Explicitly later

- Multiple projects in the UI
- Mobbin / screenshot ingest
- Repo connect, iframe, or HTML restyle of production routes
- Light theme / theme pairs
- Randomize type or spacing
- Color-theory "fix my palette" beyond contrast flags
- Adopting components into `design.md` §6 (still a design-sandbox workflow, now fed by playground screens)
- Auto-wiring Vanyshr-mono (manual import of `theme.css` is the v1.1 job)

### Not in scope

- Figma
- A public SaaS
- Replacing the visual editor the DC file lived in
- Native-only components

---

## Success Metrics

James can, in one `npm run dev` session:

1. Change `--brand` and see the primary button, in-progress chip, and "View all" link update without a rebuild.
2. Lock brand + semantics, hit randomize, get a new neutral ramp that still reads as Vanyshr.
3. Hit save and get a `theme.css` + updated `design.md` token block he can drop into an agent context (and, next, into Vanyshr-mono).

If those three work, v1 is done. Everything else is expansion.

---

## Open Questions

- [x] Type seed: `design.md` sizes. If they feel small, edit in the playground later.
- [x] Save does not auto-commit.
- [ ] When to cut the Vanyshr-mono follow-on (import `theme.css` + agent "no raw hex" rule). Recommend: immediately after first successful Save, as a separate change in that repo.

---

## The Assignment

**Next concrete action:** Scaffold a Vite + React app. Seed `--brand: #14ABFE` (from `design.md` §2). One color input calls `document.documentElement.style.setProperty("--brand", value)`. Render:

- Primary button: `background: var(--brand); color: var(--on-control-contrast, #1A1A1A)`
- In-progress chip: `color: var(--brand); border: 1px solid; border-color: color-mix(in srgb, var(--brand) 35%, transparent)`

Change the input; both repaint without a reload.

Do not port the artifact. Do not build randomize, contrast, Save middleware, Tailwind `@theme`, or `projects/`. One token, two consumers, live.

Timebox: one session.

---

## NOT in this session

Implementation. This document is the spec. Implementation starts when James points an agent at the assignment above.
