# Vanyshr Design Workflow

You are working in the Vanyshr **local design sandbox**, not a Claude artifact.
The live preview is a Vite HTML app (`npm run dev`). Specs ship via `design.md`.
Sandbox HTML is never copied into production.

## Entry Point

**Task:** Convert a design reference (Mobbin, screenshot, interaction description, or token request) into a new candidate HTML file.

**Workflow selection:**
- **Component Redesign**: Mobbin link to a single component
- **Component Converter**: Screenshot of a component from any source
- **Page Layout Converter**: Screenshot of a full page or screen
- **Interaction Pattern**: Behavior sketch, video, or description of an interaction
- **Design System Extension**: New token, color, sizing scale, or spacing rule
- **Refinement**: Small targeted tweak to an existing component

Always read `CLAUDE.md` and `design.md` before editing.

---

## Workflow: Component Redesign (Mobbin Reference)

**Input required:** Mobbin link

1. Pull the reference through the Mobbin MCP.
2. Read the current version on Foundations (`index.html` / `src/system.css`) if it exists.
3. Copy `candidates/_template.html` to `candidates/<name>.html`.
4. Set `data-workflow="mobbin"`. Restyle with tokens from `src/tokens.css` — never the Mobbin's colors, type, or radius.
5. Do not replace the current version.
6. Commit: `candidate: [component name] from mobbin ref`.

---

## Workflow: Component Converter (Screenshot → Component)

**Input required:** Screenshot or image of a single component

1. Analyze structure, states, spacing, and interaction hints.
2. Extract layout and behavior — not colors, type, or radius.
3. New file in `candidates/` with `data-workflow="screenshot"`.
4. Include all visible states. Use `.image-slot` for any image you have not rebuilt.
5. Commit: `candidate: [component type] from screenshot`.

---

## Workflow: Page Layout Converter (Screenshot → Multi-Component Layout)

**Input required:** Screenshot of a full page or screen

1. Analyze grid/flex, hierarchy, and component inventory.
2. Reuse adopted primitives from `src/system.css`.
3. Missing pieces get their own candidate files first.
4. Assemble the page as `candidates/<page>.html` with `data-workflow="layout"`.
5. Commit: `candidate: [page name] layout with [n] components`.

---

## Workflow: Interaction Pattern (Behavior → Interaction Model)

**Input required:** Description, video, or screenshot of an interaction

1. Trigger, transition, end state, side effects, reversibility.
2. Implement it in working HTML/JS in the candidate file. Real click handlers are fine.
3. `data-workflow="interaction"`.
4. Commit: `candidate: [interaction name] pattern`.

---

## Workflow: Design System Extension (New Token or Scale)

**Input required:** Description of the token, with rationale

1. Propose the addition in `design.md`.
2. Demo it in a candidate (`data-workflow="token"`) so it can be seen in context.
3. Do not add it to `src/tokens.css` until adopted.
4. Commit: `add: [token name] to design.md` or `candidate: [token] scale demo`.

---

## Workflow: Refinement (Small Tweak)

**Input required:** Feedback on an existing component

1. If it is one property on an adopted primitive, edit `src/system.css` (or `index.html` if it is unique to Foundations).
2. Otherwise make a candidate with `data-workflow="refinement"`.
3. No redesign, no scope creep.
4. Commit: `refine: [component] [change]`.

---

## Format (this sandbox)

The old Design Component rules (inline-only, no classes, `{{ holes }}`, `style-hover`)
do not apply. This is a normal HTML app.

- Adopted UI: CSS variables + `src/system.css` classes.
- Candidates: whatever is fastest. Prefix sketch classes (`c-modal-v2`).
- Tokens from `src/tokens.css` / `design.md`. No ad-hoc hex unless the sketch *is* a token proposal.
- Dark only, compact, outline status chips, one accent, Space Grotesk for terminal only.

---

## Adoption

1. Move the winning visual onto Foundations.
2. Promote reusable pieces into `src/system.css`.
3. Update `design.md` and `changelog.md`.
4. Snapshot `versions/<ISO date>-v<n>/`, tag `design-v<n>`.
5. Delete the candidate file.
6. Commit: `adopted: [name]`.

---

## Before committing

- [ ] Candidate uses Vanyshr tokens (unless it is a token proposal).
- [ ] States visible (hover, focus, disabled, error, loading if they apply).
- [ ] Foundations not overwritten (candidates only).
- [ ] Commit message matches the workflow.
- [ ] If adopting: design.md, changelog.md, snapshot.
