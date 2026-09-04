# Vanyshr design sandbox — working rules

This repo is the **design sandbox** for Vanyshr. It is not the production app.
Production integration happens by diffing `design.md` into the app repo — never by
copying files from here into the app.

## What lives here

| Path | Role |
|---|---|
| `Vanyshr Design System.dc.html` | The live visual artifact. Single source of visual truth. |
| `support.js` | Runtime for the artifact. **Never edit or delete.** |
| `image-slot.js` | Drop-in image placeholder used by the artifact. |
| `design.md` | Production-ready spec. Tokens now; a component section is appended each time a component is **adopted**. |
| `changelog.md` | Human-readable log of every system change. |
| `versions/` | Dated whole-system snapshots for rollback. |

## The artifact file format — read this before editing it

`Vanyshr Design System.dc.html` is a **Design Component**. It has a strict shape and
breaking it stops the file from rendering in the design tool the artifact lives in.

Hard rules:

1. The file is one document: an `<x-dc>` element holding the template, plus a
   `<script data-dc-script>` holding `class Component extends DCLogic { ... }`.
   Do not restructure this into modules, do not add a bundler, do not convert it to JSX.
2. **Inline styles only.** No CSS classes, no stylesheets, no Tailwind classes, no
   `styled-components`. Every style is a `style="..."` attribute with literal values.
   The only legal CSS in `<helmet><style>` is `@font-face`, `@keyframes`, and body resets.
3. Template holes are `{{ dottedPath }}` **only** — no expressions, no function calls,
   no ternaries. Compute in the logic class's `renderVals()` and expose the result by name.
4. Repetition uses `<sc-for list="{{ items }}" as="item" hint-placeholder-count="3">`.
   Conditionals use `<sc-if value="{{ flag }}">`. Always set the `hint-*` attributes.
5. Do not put style or theme values in holes. Colors and sizes are written as literals in
   the markup, repeated as needed. This is intentional — it keeps the file editable in the
   visual editor and rendering while it streams.
6. Pseudo-states are `style-hover`, `style-active`, `style-focus` attributes.
7. Close every element explicitly. Double-quote every attribute.
8. Never write UI as `React.createElement` — it becomes invisible to the visual editor.

If a change cannot be expressed under these rules, put it in `design.md` as a written
spec instead of forcing it into the artifact.

## Workflow

**Redesigning a component from a Mobbin reference**

1. Pull the reference through the Mobbin MCP.
2. Read the target component's current markup in the artifact.
3. Translate the reference's *structure and interaction* — not its colors, type, or radii —
   into the tokens in `design.md`. The reference supplies layout and behavior; Vanyshr
   supplies the visual language.
4. Add the new version to the artifact's **Candidates** section, leaving the current
   version in place. Do not overwrite the adopted component.
5. Commit. The design review happens in the visual tool, not here.

**On adoption**

Adopted replaces the previous version outright:

1. Delete the old component markup from the artifact; move the candidate into its place.
2. Append or update that component's section in `design.md`.
3. Add a `changelog.md` entry.
4. Snapshot: copy the artifact to `versions/<ISO date>-v<n>/`, then tag `git tag design-v<n>`.

**Rollback**

Restore from `versions/<date>-v<n>/` and log the rollback in `changelog.md`. Snapshots are
whole-system only — there is no per-component history.

## Constraints to respect

- Dark only. There is no light theme, and one is not planned.
- Compact density: controls 32–36px tall, 12–13px labels, 6px radius.
- Status is always an **outline** chip. Filled chips exist only for counts in navigation.
- One accent (`--brand`) carries the interface. Orange, mint, and red are semantic only —
  never decorative.
- Space Grotesk lowercase is confined to terminal and log output. Never interface chrome.
- Web plus responsive mobile. No native-only components.
