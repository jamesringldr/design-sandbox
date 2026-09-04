# Changelog

All whole-system changes to the Vanyshr design system. Newest first.
Snapshots live in `versions/` and are tagged `design-v<n>`.

## sandbox — 2026-09-04

Replaced the Claude Design Component artifact with a local Vite HTML app.

- Live preview is now `npm run dev` (Foundations, Explorations, Candidates).
- `design.md` remains the spec handed to production. Sandbox HTML is not ported.
- Color and type pairings live at `/explorations.html`. 1a stays the adopted direction.
- Candidates are HTML files in `candidates/`; the six workflows are unchanged.
- Foundations visual language is unchanged (Brick neutrals, `--brand` #14ABFE).
- Historical artifact snapshot remains at `versions/2026-09-04-v1/`.

## v1 — 2026-09-04

Initial foundations. No components adopted.

- Locked Brick neutrals with `--brand` #14ABFE as the single interface accent.
- Type: IBM Plex Sans for interface, IBM Plex Mono for data and labels, Space Grotesk
  lowercase restricted to terminal output.
- Status chips defined as outline-only; filled chips reserved for navigation counts.
- Compact density and 4px spacing base; radius ladder 4 / 6 / 10 / full; no shadows.
- Snapshot: `versions/2026-09-04-v1/`
