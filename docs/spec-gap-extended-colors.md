# Bible spec gap: no slot for extra semantic colors

**Found:** 2026-09-16, while adding an input-border color to the Vanyshr bible.

## Problem

The bible allows exactly two kinds of color token:

- the 10 Core Colors (`COLOR_TOKENS` in `app/src/bibleLanguage.js`)
- Branding colors, `--color-brand-<name>` (from `project.json` `brandColors`)

A product that needs a functional color outside the core ten (here: a stronger
border so form fields meet WCAG 1.4.11's 3:1 non-text contrast) has nowhere to
put it:

- Hand-adding `--color-border-strong` to `tokens.css`: `generateBibleTokensCss`
  never emits it, so the next playground Integrate deletes it, and the audit
  reports it under `tokenCoverage.extra`.
- Adding it as a brand color survives, but mislabels a functional token as
  branding (`--color-brand-input-border`), which the bible reserves for brand art.

## Proposal

Add an **Extended Colors** group that works like Branding but is semantic:

1. `project.json`: `extendedColors: [{ id, label, extends }]`, where `extends`
   names the core token it refines (e.g. `color-border`).
2. Name format: `--color-<core>-<variant>`, e.g. `--color-border-strong`,
   `--color-status-warning`. Values in `tokens.json` dark/light like other colors.
3. `generateBibleTokensCss`: emit a `/* Extended */` block after `/* Branding */`
   in `:root` and `.light`.
4. `generateBibleMd`: an `### Extended Colors` table
   (`| Token | Extends | Dark | Light | Use |`) and the names in Quick Reference's
   `**Color:**` line.
5. `evaluateBible` / audit: treat declared extended colors as known, not `extra`.
6. `docs/bible-language.md`: document the group and naming rule.
7. Playground Colorway UI: add/remove extended colors like brand colors.

## Acceptance

- A hand-added extended color survives Integrate and `sync-playground.mjs --write`.
- Audit reports it under a new `extended` list, not `extra`.
- The design-bible skill's checklist and sync script learn the group.

## First consumer (pending in Vanyshr)

- `--color-border-strong: #808080` (extends `color-border`). Input fields only.
  Contrast 3.2:1 on `--color-bg-surface` #333333, 4.2:1 on `--color-bg-app` #1E1E1E.
- Input recipe: recessed. Fill `--color-bg-app`, 1px `--color-border-strong`,
  2px `--color-primary` focus ring.
