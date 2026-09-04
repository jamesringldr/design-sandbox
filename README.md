# Vanyshr Design Workflow — Complete Reference

This document describes the complete design workflow for the Vanyshr design sandbox, including all task types, constraints, tokens, and adoption procedures.

## Overview

The Vanyshr design sandbox is a **live visual artifact** (`Vanyshr Design System.dc.html`) that serves as the single source of truth for all visual and interaction patterns. It is a Design Component (DC) that must follow strict formatting rules to remain editable and renderable in the design tool.

Design work flows in one direction: reference → candidate → adoption → production spec. All changes are versioned, and rollback is always possible.

---

## Core Principles

1. **One artifact, one truth.** The DC file is the authoritative visual reference. Specs are derived from it, never the reverse.
2. **Candidates before adoption.** New work lives in a Candidates section. Current versions stay in place for comparison. Adoption is a discrete step.
3. **Constraints enforce consistency.** Format rules (inline styles, no classes, no expressions) keep the file editable while it streams in the design tool.
4. **Tokens over ad hoc.** All colors, spacing, sizing, and radius come from a defined scale. Deviations require a token extension.
5. **Spec is secondary.** If something can't fit the format rules, it goes in `design.md` as a written spec, with a simplified candidate demonstrating the core idea.

---

## Task Types & Workflows

### 1. Component Redesign (Mobbin Reference)

**When to use:** You have a Mobbin link to a component (button, modal, card, input, etc.) that you want to adopt and restyle to Vanyshr's visual language.

**Input:**
- Mobbin URL to a single component.

**Process:**
1. Pull the reference through the Mobbin MCP connector.
2. Read the target component's current markup in the artifact (if it exists).
3. Analyze the Mobbin reference for *structure and interaction patterns* — layout, states, triggers — but not colors, typography, or radius (those come from Vanyshr tokens).
4. Build a new candidate in the artifact's Candidates section, using:
   - Vanyshr colors from the palette.
   - Spacing from the 4px scale.
   - Radius from the defined set (4px, 6px, 10px, pill).
   - The same font stack and sizes as the current system.
5. Do NOT replace the existing component; leave it in place for side-by-side review.
6. Commit: `candidate: [component name] from mobbin ref`.

**Output:**
- New candidate component in the artifact.
- Current version unchanged.
- Ready for design review in the visual tool.

**Example:** "Pull the modal from [Mobbin link]. Restyle using Vanyshr tokens. Keep the layered backdrop, focus ring, and button layout; swap colors to brand accent and neutral palette."

---

### 2. Component Converter (Screenshot → Component)

**When to use:** You have a screenshot of a component from any source (dribbble, a production app, a competitor, etc.) and want to extract its structure and adapt it to Vanyshr.

**Input:**
- Image/screenshot of a single component (any source).

**Process:**
1. Analyze the screenshot for:
   - Structure: layout (grid, flex, inline), nesting, hierarchy.
   - States: default, hover, focus, active, disabled, error, loading (if visible).
   - Spacing: padding, gaps, margins.
   - Proportions: control height, text size relative to padding, icon size.
   - Interaction hints: clickability, focus indicators, state transitions.
2. Extract the *pattern and behavior*, not the visual styling.
3. Build a new component in the artifact's Candidates section:
   - Use Vanyshr tokens for all colors, spacing, and radius.
   - Implement all visible states.
   - Follow the format rules strictly.
4. Commit: `candidate: [component type] from screenshot`.

**Output:**
- New candidate component with all states.
- Immediately usable in layouts.
- Ready for design review.

**Example:** "Convert the card from the screenshot. Keep the icon placement, title/subtitle structure, and button layout. Implement hover (border highlight) and disabled (opacity 50%) states. Use Vanyshr spacing and brand colors."

---

### 3. Page Layout Converter (Screenshot → Multi-Component Layout)

**When to use:** You have a screenshot of a full page or screen and want to break it down into Vanyshr components and rebuild it as a candidate layout.

**Input:**
- Image/screenshot of a complete page or screen (any source).

**Process:**
1. Analyze the page structure:
   - Overall layout (single column, grid, sidebar + main, etc.).
   - Information hierarchy (what's emphasized, what's secondary).
   - Component inventory: identify each distinct piece (header, nav, card, button, input, etc.).
   - Spacing and alignment: margins, gaps, grid rhythm.
   - Responsive hints: does layout shift on mobile?
2. For each component:
   - Check if it exists in the artifact; if so, read its current markup.
   - If new, create it as a candidate first.
3. Build the full page layout in the artifact's Candidates section:
   - Use existing components wherever possible.
   - Assemble them with Vanyshr spacing and grid rules.
   - Implement the information hierarchy faithfully.
4. Commit: `candidate: [page name] layout with [n] components`.

**Output:**
- New page layout candidate.
- All component dependencies created or identified.
- Ready for design review and responsive testing.

**Example:** "Convert the dashboard from the screenshot. Uses 3 new components (stat card, progress ring, alert banner) and 2 existing (button, input). Layout is 12-column grid on desktop, single column on mobile. Spacing 24px sections, 8px item gaps."

---

### 4. Interaction Pattern (Behavior → Interaction Model)

**When to use:** You have a description, video, or screenshot of an interaction (expand/collapse, slide, filter, sort, modal dismiss, etc.) that you want to implement in code.

**Input:**
- Video clip, animated GIF, screenshot sequence, or text description of an interaction.

**Process:**
1. Analyze the interaction:
   - Trigger: what user action starts it (click, hover, keyboard, etc.)?
   - Transition: what happens visually (animation, state change, element appears/disappears)?
   - End state: what's the final state and how is it maintained?
   - Side effects: does it affect other elements, navigation, scroll, focus?
   - Reversibility: is it dismissible, can the user undo?
2. Translate into code under Vanyshr format rules:
   - State lives in the logic class's `renderVals()` method.
   - Template holes `{{ }}` are data and state references only; no expressions.
   - Event handlers (onClick, onHover) are defined in the logic class and exposed via `renderVals()`.
   - Pseudo-states use `style-hover`, `style-active`, `style-focus` attributes.
3. Build a candidate component or page section demonstrating the interaction:
   - Include all states and transitions.
   - Make the trigger clear (button label, interactive element).
4. Commit: `candidate: [interaction name] pattern`.

**Output:**
- New candidate with working interaction.
- Code ready to copy into other components.
- Ready for interaction review in the live preview.

**Example:** "Implement the expandable card pattern. Trigger: click card header. Transition: height expands over 200ms, arrow rotates. End state: full content visible, card has border accent. Reversible: click again to collapse."

---

### 5. Design System Extension (New Token or Scale)

**When to use:** You need a new color, spacing value, sizing scale, radius, or other token that isn't in the current system.

**Input:**
- Description of the token (name, value, where it's used, rationale).

**Process:**
1. Analyze the gap:
   - Does an existing token almost fit? Why not use it?
   - Is this a new semantic color (e.g., a secondary accent), a new spacing unit, or a variant of an existing scale?
   - What components or patterns need it?
2. Propose the token in `design.md`:
   - Add it to the appropriate section (colors, spacing, radius, type scale).
   - Include rationale: what it replaces or complements, why the specific value.
   - Note which components will use it.
3. If a visual artifact helps (e.g., showing the new color in context), build a candidate section in the artifact:
   - Use the new token in a few components to show how it integrates.
   - Make it obvious which parts use the new token.
4. Commit: `add: [token name] to design.md` or `candidate: [token] scale demo`.

**Output:**
- Updated `design.md` with the new token and rationale.
- Optional visual demo in the artifact.
- Ready for review before adoption.

**Example:** "Add secondary accent color #00D9A3 (mint). Used for success states, confirmations, positive feedback. Demo: success badge, confirmation button, progress indicator."

---

### 6. Refinement (Small Targeted Tweak)

**When to use:** You have feedback on an existing component — e.g., "button padding is too tight" or "modal border needs to be thinner" — and want to make a minimal change without a redesign.

**Input:**
- Component name and the specific change needed.

**Process:**
1. Read the target component in the artifact.
2. Identify the exact property to change (padding, border-width, font-size, etc.).
3. Make the minimal edit:
   - Change only the property in question.
   - Do NOT redesign the component, adjust layout, or add features.
   - If the change affects multiple uses, apply it consistently across all instances.
4. Commit: `refine: [component] [change]`.

**Output:**
- Updated component with the tweak applied.
- All other components and layouts unchanged.
- Ready for immediate use.

**Example:** "Refine: button padding increased from 8px/12px to 10px/14px for better touch target."

---

## Format Rules (CRITICAL)

These rules are **non-negotiable**. Breaking them stops the artifact from rendering in the design tool.

### Template Structure
- **Inline styles only.** No CSS classes, no stylesheets, no Tailwind utilities.
- **Template holes `{{ }}`** reference data and state only — **never expressions**:
  - ✅ `{{ user.name }}`, `{{ items }}`, `{{ isOpen }}` — data references.
  - ✅ `{{ handler }}` — function references.
  - ❌ `{{ user.name.toUpperCase() }}` — expressions fail silently.
  - ❌ `{{ isOpen ? 'open' : 'closed' }}` — ternaries don't work.
  - All logic belongs in `renderVals()`.
- **No `React.createElement` for UI layout.** It's opaque to the editor; users can't click into it. All UI markup goes in the template.
- **Every element explicitly closed** (no self-closing non-void tags).
- **Every attribute double-quoted** (no single quotes, no unquoted values).

### Styling
- **Pseudo-states** use attributes: `style-hover`, `style-active`, `style-focus`, `style-before`, `style-after`.
- **Colors and sizes are always literals**, never in holes:
  - ✅ `style="color: #14ABFE; padding: 12px"` — immediate paint.
  - ❌ `style="color: {{ accentColor }}"` — delays rendering until the value resolves.
  - Repeated literals are intentional — they keep the file editable while it streams.
- **The only legal `<helmet><style>` content:** `@font-face`, `@keyframes`, body resets, and link defaults (e.g., `a { color: …; }`). Never layout or component styles.

### Layout & Spacing
- **Use `display: flex` or `display: grid` with `gap`** for layout.
- **Avoid inline flow and whitespace-based spacing.** Use `gap` so spacing survives drag-reorder and delete operations.
- **Spacing values** come from the 4px scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, etc.

### Text & Typography
- **Interface type** uses the artifact's current font stack (system fonts or specified stack in `<helmet>`).
- **Space Grotesk lowercase** is **only for terminal output, code blocks, and log data** — never for interface chrome (buttons, labels, nav).
- **Size scale** (minimum values):
  - 10–13px: labels, captions, helper text.
  - 14–16px: body text, form inputs.
  - 18px+: headings, page titles.
  - No text below 10px (breaks contrast and readability on dark).

### Colors
- **One accent color:** `#14ABFE` (brand blue) — primary actions, highlights, focus states.
- **Semantic colors** (never decorative):
  - Orange: status, alerts, warnings.
  - Mint/green: success, confirmation, positive feedback.
  - Red: errors, destructive actions.
- **Neutral palette:** Grays for surfaces, borders, text. Chosen for dark-mode contrast (WCAG AA minimum).
- **Dark only.** No light theme. No toggle.

### Controls & Components
- **Control height:** 32–36px (buttons, inputs, selects).
- **Labels:** 10–13px, uppercase or title case per design.
- **Status chips:** Always outline-only (border, no fill).
- **Filled chips:** Counts only (in navigation, badges, counts — not status).
- **Focus indicator:** Visible on all interactive elements (outline, ring, or underline).
- **Disabled state:** Opacity 50% or a muted color, never removed from tab order.

---

## Tokens & Constraints

### Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Accent (brand) | `#14ABFE` | Primary actions, highlights, focus rings, hover states. |
| Status (orange) | `#FF9500` | Alerts, warnings, in-progress status. |
| Success (mint) | `#00D9A3` | Confirmations, success messages, completions. |
| Error (red) | `#FF5555` | Errors, destructive actions, validation failures. |
| Surface (dark) | `#1A1A1A` | Page background, card backgrounds. |
| Border | `#333333` | Dividers, borders, outlines. |
| Text primary | `#FFFFFF` | Body text, labels. |
| Text secondary | `#CCCCCC` | Hints, captions, secondary info. |
| Text muted | `#999999` | Disabled text, very secondary content. |

**Adjust neutral grays as needed for contrast (WCAG AA minimum).** The exact values above are examples; the artifact's current tokens are the source of truth.

### Spacing Scale (4px base unit)

| Value | Use Case |
|-------|----------|
| 4px | Fine adjustments, internal padding in dense components. |
| 8px | Control internal padding (horizontal), small gaps. |
| 12px | Control internal padding (vertical), medium gaps between items. |
| 16px | Standard padding, gaps between related sections. |
| 20px | Spacing between major sections. |
| 24px | Large section spacing, primary page margin (mobile). |
| 32px | Very large gaps, page margin (desktop). |
| 40px, 48px, 56px, 64px | Very large sections, hero spacing. |

**Apply consistently:** all button padding uses the same values across the system.

### Type Scale

| Size | Weight | Use Case |
|------|--------|----------|
| 10–11px | 400 | Very small labels, captions, helper text. |
| 12–13px | 400 or 600 | Form labels, button text (12–13px typical). |
| 14px | 400 | Body text, descriptions. |
| 16px | 400 | Primary body text, larger inputs. |
| 18–20px | 600 | Section headers, card titles. |
| 24–32px | 600 or 700 | Page titles, hero text. |

**Minimum 10px for any interface text.** Use the existing font stack in the artifact.

### Radius Scale

| Value | Use Case |
|-------|----------|
| 0px | Sharp corners (edges, strict geometry). |
| 4px | Small components (small buttons, tight inputs, subtle rounding). |
| 6px | Standard radius (most buttons, inputs, dropdowns). |
| 10px | Cards, panels, modals, larger components. |
| 999px | Pill buttons, badges, rounded chips. |

**Consistent application:** all buttons use one radius, all cards use another, etc.

---

## Working with Candidates

### Adding a Candidate

1. Find or create the **Candidates section** in the artifact (typically at the end of the template, before `</x-dc>`).
2. Add your new component or layout as a distinct block with a clear heading and `id` for reference:
   ```html
   <!-- CANDIDATE: New Button Style -->
   <div id="candidate-button-v2" style="padding: 32px; background: #1A1A1A; border-radius: 10px;">
     <!-- candidate markup here -->
   </div>
   ```
3. Leave the current version of the component **unchanged** elsewhere in the artifact.
4. Commit with the candidate label in the message.

### Reviewing a Candidate

In the visual tool:
1. Scroll to the Candidates section.
2. Side-by-side compare the candidate with the current version (scroll to the current component elsewhere).
3. Test states (hover, focus, disabled) visually.
4. Comment or request changes.

### Adopting a Candidate

Once the design review is approved:

1. **Delete the old version** from the artifact (find it by component name, remove the entire markup block).
2. **Move the candidate into its place** in the component hierarchy. Remove the candidate wrapper and ID; integrate it as the new current version.
3. **Update `design.md`:**
   - Append or replace the component's entry with the new spec.
   - Include the token usage (colors, spacing, states).
   - Link to any related components or interactions.
4. **Update `changelog.md`:**
   - Add an entry: `## [Component Name] — Adopted [date]` with a brief summary of changes.
5. **Create a snapshot:**
   - Copy the entire artifact to `versions/<YYYY-MM-DD>-v<N>/Vanyshr Design System.dc.html` (e.g., `versions/2025-01-15-v42/`).
   - Tag the commit: `git tag design-v42`.
6. **Commit all changes:**
   - `adopted: [component name]`.
   - Include design.md, changelog.md, and the snapshot in the same commit.

### Rollback

If an adopted component needs to be reverted:

1. Find the version snapshot in `versions/` that has the component you want to restore.
2. Copy that snapshot's artifact to the main artifact file.
3. Restore `design.md` and `changelog.md` to match (they live in the snapshot folder).
4. Add a `changelog.md` entry noting the rollback and reason.
5. Commit: `rollback: [component name] to version [date]-v[N]`.

---

## Design.md Specification

`design.md` is the **production-ready spec** derived from the artifact. It includes:

1. **System Overview** — philosophy, constraints, dark-only nature.
2. **Token Reference** — colors, spacing, type, radius with hex values, pixel values, or units.
3. **Component Specs** — one section per adopted component:
   - Markup structure (simplified, showing the most important pieces).
   - Props/state.
   - All states and their triggers.
   - Usage guidelines.
   - Related components.
4. **Interaction Specs** — documented patterns (expand/collapse, slide, filter, etc.).

**Updated on adoption only.** Each new component appends its spec.

---

## Changelog.md

Human-readable log of every system change. Format:

```
## [Date] — v[N]

### [Component Name] — Adopted / Refined / New
- Brief description of changes.
- Related components or dependencies.
- Rationale (optional).

### [Another Component] — Refined
- Change summary.
```

---

## Workflow Checklist

Before committing any change:

- [ ] All format rules followed (inline styles, no classes, no expressions in holes).
- [ ] Component/layout uses Vanyshr tokens (colors, spacing, radius from defined scales).
- [ ] All states implemented (default, hover, focus, active, disabled, error, loading if applicable).
- [ ] If a new component: lives in Candidates section, does not replace existing version.
- [ ] Commit message is clear and consistent (`candidate: …`, `adopted: …`, `refine: …`, etc.).
- [ ] If adopting: design.md updated, changelog.md updated, snapshot created, new tag pushed.
- [ ] No breaking changes to existing components unless intentionally redesigning.

---

## When Something Doesn't Fit the Format Rules

Some ideas are hard to express in the strict format (complex animations, conditional styling, data-driven layouts, etc.). When you hit this wall:

1. **Write the spec to `design.md`** with ASCII diagrams, pseudo-code, or detailed prose.
2. **Build a simplified candidate in the artifact** that demonstrates the *core idea* under the format constraints (e.g., a static animation frame, a simplified layout, a state snapshot).
3. **Note the limitation** in the spec and the candidate (comment in markup, note in design.md).
4. **Do NOT force it.** A constraint-violating candidate breaks the artifact and blocks the design tool.

---

## Common Patterns

### Adding a New State to an Existing Component

1. Read the current component in the artifact.
2. Find the state handling in the logic class (state variables, event handlers).
3. Add the new state variable and handler.
4. Add the new markup or conditional styling in the template.
5. Commit: `refine: [component] added [state] state`.

### Creating a Variant (e.g., Primary vs. Secondary Button)

1. Check if the difference is styling (colors, size) or structure (different elements).
2. If styling only: use the same component and add a prop (e.g., `variant="secondary"`). Handle it in `renderVals()`.
3. If structural: create a new component (e.g., `SecondaryButton`).
4. Both live as candidates until adopted.

### Reusing a Component in Multiple Layouts

1. The component exists as a current (adopted) version.
2. Use it in the new layout candidate by copying its markup or creating a child component reference.
3. No duplication needed — the artifact has one source of truth per component.

---

## Developer Handoff

When a component is ready for production engineering:

1. Ensure it's adopted (moved from Candidates to current).
2. Update `design.md` with the full spec.
3. Generate a snapshot (version tag).
4. Export the spec and artifact to the dev team.
5. Devs reference the component's spec in design.md and the artifact's markup as the source of truth.

---

## Questions & Troubleshooting

**Q: Can I add CSS classes or stylesheets?**
A: No. Inline styles only. Classes break the artifact's editability in the visual tool.

**Q: Can I use expressions in template holes?**
A: No. `{{ a + b }}` fails silently. Compute in `renderVals()` and expose the result by name.

**Q: Can I change an existing component without making a candidate?**
A: Only for refinements (small tweaks to padding, color, etc.). Major redesigns must go through Candidates.

**Q: How do I handle responsive layout?**
A: Use CSS media queries **in the artifact's `<helmet><style>` block only** (the only legal stylesheet location). Or build separate mobile/desktop candidates and pick one per preview size.

**Q: What if a token doesn't exist for my use case?**
A: Propose it in `design.md` with rationale. Build a candidate demo if helpful. Never ad hoc — all values come from tokens.

**Q: Can I rollback just one component?**
A: Yes, using a version snapshot. Restore the whole artifact from the snapshot, then carefully re-adopt other components if needed.

---

## Summary

The Vanyshr Design Workflow is a **structured, versioned process** for evolving the design system. Every change flows through the same gate: reference → candidate → adoption → production spec → version snapshot → rollback (if needed).

The format rules are strict so the artifact stays editable and live. Tokens and constraints ensure consistency. And the adoption workflow means every change is audited, documented, and reversible.

Start with a clear task type, follow the workflow, and commit early and often. The visual tool is your review space; let it guide you.

---

**For detailed skill implementation and Claude Code integration, see `vanyshr-design-workflow-skill.md`.**
