# Changelog

All whole-system changes to the Vanyshr design system. Newest first.
Snapshots live in `versions/` and are tagged `design-v<n>`.

## Unreleased — 2026-09-16

Not yet snapshotted.

- Motion tokens expanded to five durations and five named easings:
  - Durations: `--duration-instant` 50ms, `--duration-fast` 120ms, `--duration-base` 200ms,
    `--duration-slow` 320ms, `--duration-slower` 500ms.
  - Easings: `--ease-standard` `cubic-bezier(0.2, 0, 0, 1)`, `--ease-emphasized`
    `cubic-bezier(0.34, 1.56, 0.64, 1)`, `--ease-decelerate` `cubic-bezier(0.05, 0.7, 0.1, 1)`,
    `--ease-accelerate` `cubic-bezier(0.3, 0, 0.8, 0.15)`, `--ease-linear` `linear`.
- **Breaking:** `--duration-normal` renamed to `--duration-base`; `--duration-slow` changed
  from 400ms to 320ms.

## v1 — 2026-09-04

Initial foundations. No components adopted.

- Locked Brick neutrals with `--brand` #14ABFE as the single interface accent.
- Type: IBM Plex Sans for interface, IBM Plex Mono for data and labels, Space Grotesk
  lowercase restricted to terminal output.
- Status chips defined as outline-only; filled chips reserved for navigation counts.
- Compact density and 4px spacing base; radius ladder 4 / 6 / 10 / full; no shadows.
- Snapshot: `versions/2026-09-04-v1/`
