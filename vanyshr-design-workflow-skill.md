# Vanyshr Design Workflow

You are Claude Code working in the Vanyshr design sandbox. The artifact file is `Vanyshr Design System.dc.html` — a Design Component with strict formatting rules defined in CLAUDE.md.

## Entry Point

**Task:** Convert a design reference (Mobbin, screenshot, interaction description, or token request) into a new component, layout, or spec for the artifact.

**Workflow selection:**
- **Component Redesign**: Mobbin link to a single component
- **Component Converter**: Screenshot of a component from any source
- **Page Layout Converter**: Screenshot of a full page or screen
- **Interaction Pattern**: Behavior sketch, video, or description of an interaction
- **Design System Extension**: New token, color, sizing scale, or spacing rule
- **Refinement**: Small targeted tweak to an existing component

---

## Workflow: Component Redesign (Mobbin Reference)

**Input required:** Mobbin link

1. Pull the reference through the Mobbin MCP.
2. Read the target component's current markup in the artifact (if it exists).
3. Build the new version as a candidate in the artifact's Candidates section, restyled to match design.md tokens — never the Mobbin's colors, type, or radius.
4. Do NOT replace the current version; leave it in place for side-by-side comparison.
5. Commit: `candidate: [component name] from mobbin ref`.

---

## Workflow: Component Converter (Screenshot → Component)

**Input required:** Screenshot or image of a single component

1. Analyze the screenshot for structure, states (default/hover/active/disabled/error), spacing, and interaction hints.
2. Extract the *layout and interaction pattern* — not colors, type, or radius.
3. Build a new component in the artifact's Candidates section, restyled to Vanyshr tokens.
4. Include all visible states.
5. Commit: `candidate: [component type] from screenshot`.

---

## Workflow: Page Layout Converter (Screenshot → Multi-Component Layout)

**Input required:** Screenshot of a full page or screen

1. Analyze the page structure: grid/flex layout, component placement, spacing, information hierarchy, and flow.
2. Identify each component (header, nav, cards, buttons, inputs, etc.) and extract its pattern.
3. Read existing components from the artifact; reuse what's there.
4. Build missing components as new candidates.
5. Build the full page layout in the artifact's Candidates section, using the components together.
6. Commit: `candidate: [page name] layout with [n] components`.

---

## Workflow: Interaction Pattern (Behavior → Interaction Model)

**Input required:** Description, video, or screenshot of an interaction

1. Analyze the interaction flow: trigger, animation/transition, end state, and any side effects.
2. Translate into HTML/JavaScript under Vanyshr format rules (state in `renderVals()`, no expressions in template).
3. Build a candidate component or page section that demonstrates the interaction.
4. Commit: `candidate: [interaction name] pattern`.

---

## Workflow: Design System Extension (New Token or Scale)

**Input required:** Description of the token, with rationale (where it fills a gap, what it complements)

1. Propose the addition to design.md with rationale.
2. If a visual artifact is needed, build a candidate section in the artifact showing the token in context.
3. Commit: `add: [token name] to design.md` or `candidate: [token] scale demo`.

---

## Workflow: Refinement (Small Tweak)

**Input required:** Feedback on an existing component (e.g., "button needs more padding")

1. Read the target component in the artifact.
2. Make the minimal change (no redesign, no scope creep).
3. Commit: `refine: [component] [change]`.

---

## Format Rules (CRITICAL)

Breaking these stops the artifact from rendering.

- **Inline styles only** — no CSS classes, no stylesheets, no Tailwind.
- **Template holes `{{ }}`** for data and state only — never expressions.
- **No `React.createElement`** — all UI as template markup.
- **Pseudo-states** use `style-hover`, `style-active`, `style-focus` attributes.
- **Every element explicitly closed**, every attribute double-quoted.
- **Colors and sizes are literals**, repeated as needed — never in holes.
- **Control dimensions**: 32–36px tall, labels 10–13px, radius 4/6/10/full.
- **Status** is outline-only chips; filled chips are counts only.
- **One accent** (`#14ABFE`); orange, mint, red are semantic signals only.
- **Dark only.** No light theme.
- **Space Grotesk lowercase** restricted to terminal output — never interface chrome.

If you can't express something under these rules, add it to design.md as a spec instead.

---

## Tokens & Constraints

### Color Palette
- **Accent:** `#14ABFE` — primary action, highlights, focus states.
- **Semantic orange:** Status, alerts, warnings (not decorative).
- **Semantic mint:** Success, confirmation (not decorative).
- **Semantic red:** Errors, destructive actions (not decorative).
- **Neutrals:** Grays for surfaces, borders, text — adjust for dark contrast.

### Spacing Scale
- Base unit: 4px increments (4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64…)
- Control padding: 8–12px horizontal, 6–10px vertical.
- Gap between items: 8–12px.
- Section spacing: 24–32px.
- Page margins: 16–24px (mobile), 32–48px (desktop).

### Type
- Interface: System fonts or specified stack (see artifact).
- Terminal/code: Space Grotesk lowercase only.
- Sizes: 10–13px (labels), 14–16px (body), 18px+ (headings).

### Radius
- Small: 4px (inputs, small buttons).
- Medium: 6px (standard components).
- Large: 10px (cards, panels, modals).
- Pill: 999px (badges, rounded buttons).

---

## Adoption Workflow

**While exploring:** Add candidates to the Candidates section, leaving current versions in place.

**On adoption** (when design review is complete):
1. Delete the old component markup.
2. Move the candidate into its place.
3. Append or update that component's section in design.md.
4. Add a `changelog.md` entry.
5. Create a snapshot: copy the artifact to `versions/<ISO date>-v<n>/`, tag `git tag design-v<n>`.

---

## Before Committing

- [ ] All format rules followed.
- [ ] Component/layout matches Vanyshr tokens.
- [ ] All states visible (hover, focus, disabled, error, loading).
- [ ] No overwrite of adopted components (candidates only).
- [ ] Commit message clear and consistent.
- [ ] If adopting: design.md, changelog.md updated; snapshot created.

---

## When Stuck

If a requirement can't fit the format rules, write it to design.md as a spec with ASCII diagrams, then build a simplified candidate that demonstrates the core idea under the constraints.

When done, push to main.
