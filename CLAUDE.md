# Vanyshr design sandbox — working rules

This repo is the **local visual CAD** for Vanyshr. It is not the production app.
Production integration happens by diffing `design.md` into the app repo — never by
copying HTML, CSS, or JS from here into the app.

Run it with `npm install` then `npm run dev`. Edit HTML, save, the browser reloads.

## What lives here

| Path | Role |
|---|---|
| `index.html` | Foundations — adopted tokens, type, chips, controls, applied examples. |
| `explorations.html` | Color and type pairing studies (1a adopted; 1b–1d kept for comparison). |
| `candidates/` | Sketches. One HTML file per idea. Auto-listed on `candidates.html`. |
| `candidates/_template.html` | Duplicate this. Files starting with `_` are ignored. |
| `src/tokens.css` | CSS variables. Must match `design.md`. |
| `src/system.css` | Adopted primitives only. Do not dump sketches here. |
| `src/sandbox.css` | Sandbox chrome (nav, layout). Not part of the design system. |
| `design.md` | Production spec. Tokens now; a component section is appended on **adoption**. |
| `changelog.md` | Human-readable log of every system change. |
| `versions/` | Dated whole-system snapshots for rollback. |

## How to work

This sandbox exists so ideas can be seen and tweaked before anyone writes production
React. Speed is the point.

1. **Adopted UI** uses tokens (`var(--brand)`) and classes in `src/system.css`. Changing
   a token updates every adopted surface at once.
2. **Candidates** are freeform HTML. Inline styles, a local `<style>` block, copied
   markup — whatever is fastest. Prefix sketch classes so they do not collide
   (`c-modal-v2`, not `modal`).
3. **Do not** build this like the production app. No React, no Tailwind, no component
   library to port. The printer is the production repo; this is CAD.
4. **Do not** copy sandbox markup into production. After adoption, write the spec into
   `design.md` and let production implement it in React + Tailwind.

## Workflows

Pick the entry point that matches the input. Output is always a new file in
`candidates/`, never an overwrite of Foundations.

| Workflow | Input | `data-workflow` |
|---|---|---|
| Component redesign | Mobbin URL | `mobbin` |
| Component converter | Screenshot of one component | `screenshot` |
| Page layout converter | Screenshot of a page | `layout` |
| Interaction pattern | Video, GIF, or description | `interaction` |
| Design system extension | New token + rationale | `token` |
| Refinement | One property on an existing piece | `refinement` |

Refinements that are truly one CSS value on an already-adopted primitive may edit
`src/system.css` directly. Anything that changes structure, states, or layout goes
through Candidates.

### Adding a candidate

1. Copy `candidates/_template.html` to `candidates/<name>.html`.
2. Set `data-name`, `data-workflow`, and `data-note`.
3. Sketch the UI. Use Vanyshr tokens for color, spacing, and radius — not the
   reference's visual language.
4. Leave the current version on Foundations in place.
5. Commit: `candidate: [name] from [source]`.

### Adopting a candidate

1. Move the winning visual into Foundations (or a new section there).
2. Promote reusable pieces into `src/system.css` and point them at tokens.
3. Append or replace that component's section in `design.md`.
4. Add a `changelog.md` entry.
5. Snapshot: copy the current foundations + spec into
   `versions/<YYYY-MM-DD>-v<n>/`, then `git tag design-v<n>`.
6. Delete the candidate file.
7. Commit: `adopted: [name]`.

### Rollback

Restore from `versions/<date>-v<n>/` and log the rollback in `changelog.md`.
Snapshots are whole-system only.

## Constraints to respect

- Dark only. There is no light theme, and one is not planned.
- Compact density: controls 32–36px tall, 12–13px labels, 6px radius.
- Status is always an **outline** chip. Filled chips exist only for counts in navigation.
- One accent (`--brand`) carries the interface. Orange, mint, and red are semantic only —
  never decorative.
- Space Grotesk lowercase is confined to terminal and log output. Never interface chrome.
- Web plus responsive mobile. No native-only components.
- Explorations 1b–1d are historical. Do not pull their colors or type into tokens.

## Tokens

Source of truth is `design.md`. `src/tokens.css` must not drift. If a sketch needs a
value that is not a token, that is a `token` workflow — propose it in `design.md`
with rationale, demo it in a candidate, then add it to `src/tokens.css` on adoption.
