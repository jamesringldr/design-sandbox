# Vanyshr Design Sandbox

Local visual CAD for the Vanyshr design system. Tweak what you see, write the spec,
hand the spec to production. **No code from this repo is copied into the app.**
Production is React + Tailwind; this sandbox is HTML so ideas render as fast as
you can save a file.

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Foundations is `/`, explorations at
`/explorations.html`, candidates at `/candidates.html`.

---

## Why HTML, not React

This is not a build environment. It is a place to look at a change before anyone
implements it. HTML + CSS variables + Vite hot reload is the shortest path from
"what if the chip were outline-only?" to seeing it. The production app already
has a stack; duplicating it here would slow sketches down and tempt people to
port markup.

`design.md` is the artifact that moves. Diff it into the production repo after
adoption.

---

## What's on screen

| Page | What it is |
|---|---|
| **Foundations** | Adopted system: color, type, chips, controls, two applied examples (removal queue + activity stream). |
| **Explorations** | Color and type pairings 1a–1d. 1a is adopted. 1b–1d stay for comparison. |
| **Candidates** | Every in-progress sketch. Drop an HTML file in `candidates/` and it appears here. |

v1 has no adopted components yet — only foundations.

---

## Workflows

Six entry points, one output shape: a candidate HTML file. Current Foundations
stay put until something is adopted.

### 1. Component redesign (Mobbin)

**Input:** Mobbin URL for a single component.

Steal structure and interaction (layout, states, triggers). Do not steal colors,
type, or radius — those come from Vanyshr tokens. Build a candidate, leave the
current version in place.

Commit: `candidate: [component] from mobbin ref`.

### 2. Component converter (screenshot)

**Input:** Screenshot of one component from anywhere.

Extract pattern and behavior, implement visible states, restyle with tokens.

Commit: `candidate: [component] from screenshot`.

### 3. Page layout converter (screenshot)

**Input:** Screenshot of a full page or screen.

Inventory the pieces, reuse anything already adopted, create missing pieces as
their own candidates, assemble the page as a layout candidate.

Commit: `candidate: [page] layout with [n] components`.

### 4. Interaction pattern

**Input:** Video, GIF, screenshot sequence, or description.

Prototype trigger, transition, end state, and reversibility in working HTML.
Real event handlers are fine here — this is CAD, not the Claude artifact format.

Commit: `candidate: [interaction] pattern`.

### 5. Design system extension (token)

**Input:** Name, value, where it is used, why an existing token does not fit.

Propose it in `design.md`, demo it in a candidate so it can be seen next to
current tokens. Do not ad-hoc a hex into a sketch and leave it there.

Commit: `add: [token] to design.md` or `candidate: [token] scale demo`.

### 6. Refinement

**Input:** One property on an existing piece ("button padding is tight").

If it is truly one value on an adopted primitive, change `src/system.css`.
If it changes structure or states, make a candidate.

Commit: `refine: [component] [change]`.

---

## File conventions

```
candidates/_template.html     # duplicate this; ignored by the gallery
candidates/modal-v2.html      # shown on /candidates.html
src/tokens.css                # must match design.md
src/system.css                # adopted primitives only
```

Candidate files:

```html
<article
  data-name="Modal v2"
  data-workflow="mobbin"
  data-note="Layered backdrop, Vanyshr tokens"
>
  <style>
    .c-modal-v2 { /* sketch-local styles */ }
  </style>
  <div class="c-modal-v2">…</div>
</article>
```

`data-workflow` is one of: `mobbin`, `screenshot`, `layout`, `interaction`,
`token`, `refinement`. Prefix sketch classes so they do not leak.

Use `var(--brand)` and the rest of `src/tokens.css` instead of raw hex, unless
the whole point of the sketch is a new token.

`.image-slot` is a dashed placeholder for screenshots you have not rebuilt yet.

---

## Adoption

1. Move the winning visual onto Foundations.
2. Promote reusable pieces into `src/system.css`.
3. Append the component spec to `design.md`.
4. Log it in `changelog.md`.
5. Snapshot to `versions/<YYYY-MM-DD>-v<n>/` and tag `design-v<n>`.
6. Delete the candidate file.
7. Commit: `adopted: [name]`.

Rollback restores a whole snapshot from `versions/`. There is no per-component
history.

---

## Tokens (current)

One accent: `#14ABFE`. Orange, mint, and red are semantic only. Dark only.
Status chips are outline. Compact density: 32–36px controls, 4px spacing base,
radius 4 / 6 / 10 / pill. Space Grotesk lowercase is terminal-only.

Full tables live in `design.md`. That file is what production implements.

---

## Constraints

- Dark only — no light theme.
- Status = outline chip. Filled chip = navigation count, never state.
- One brand accent. Semantic hues are not decoration.
- Space Grotesk never appears on buttons, labels, or nav.
- Web + responsive mobile. No native-only components.
- Do not port sandbox HTML into the production app.
