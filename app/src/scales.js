// Spacing, radius, border, and elevation tokens. Theme-independent; painted as
// CSS variables next to the color tokens so previews restyle live.
import { RADIUS_TOKENS, SPACE_TOKENS } from "./bibleLanguage.js";

const px = (value) => Number.parseFloat(value);

// Each space step is a multiple of the base unit (4px base -> 4, 8, 12, 16, 24, 32, 48).
export const SPACE_STEPS = SPACE_TOKENS.map((token) => ({
  id: token.id,
  multiple: px(token.value) / 4,
  use: token.use,
}));

export const RADIUS_STEPS = RADIUS_TOKENS.map((token) => ({ id: token.id, use: token.use }));

export const SHADOW_STEPS = [
  { id: "shadow-1", use: "Raised controls, cards at rest" },
  { id: "shadow-2", use: "Popovers, menus, hovered cards" },
  { id: "shadow-3", use: "Dialogs, sheets" },
];

// Density is a multiplier on top of the base unit (base × density × step
// multiple), so "compact" alone reproduces the old base-only behavior.
export const DENSITY_PRESETS = { compact: 1, cozy: 1.25, roomy: 1.5 };
export const DENSITY_OPTIONS = ["compact", "cozy", "roomy"];

// Radius style presets set sm/md/lg together; radius-pill stays 999 (pills,
// toggles, avatars are always fully round regardless of the chosen style).
export const RADIUS_PRESETS = {
  sharp: { "radius-sm": 0, "radius-md": 0, "radius-lg": 0 },
  subtle: { "radius-sm": 4, "radius-md": 6, "radius-lg": 10 },
  rounded: { "radius-sm": 8, "radius-md": 12, "radius-lg": 18 },
  pill: { "radius-sm": 999, "radius-md": 999, "radius-lg": 999 },
};
export const RADIUS_PRESET_OPTIONS = ["sharp", "subtle", "rounded", "pill"];

// Shadow style presets set shadow-1/2/3 together.
export const SHADOW_PRESETS = {
  none: {
    "shadow-1": { y: 0, blur: 0, alpha: 0 },
    "shadow-2": { y: 0, blur: 0, alpha: 0 },
    "shadow-3": { y: 0, blur: 0, alpha: 0 },
  },
  soft: {
    "shadow-1": { y: 1, blur: 3, alpha: 0.18 },
    "shadow-2": { y: 4, blur: 12, alpha: 0.2 },
    "shadow-3": { y: 10, blur: 28, alpha: 0.28 },
  },
  balanced: {
    "shadow-1": { y: 1, blur: 2, alpha: 0.3 },
    "shadow-2": { y: 6, blur: 16, alpha: 0.35 },
    "shadow-3": { y: 16, blur: 40, alpha: 0.5 },
  },
  sharp: {
    "shadow-1": { y: 2, blur: 2, alpha: 0.4 },
    "shadow-2": { y: 4, blur: 6, alpha: 0.45 },
    "shadow-3": { y: 8, blur: 12, alpha: 0.55 },
  },
};
export const SHADOW_PRESET_OPTIONS = ["none", "soft", "balanced", "sharp"];

export const DEFAULT_SCALES = {
  spaceBase: 4,
  density: "compact",
  space: Object.fromEntries(SPACE_TOKENS.map((token) => [token.id, px(token.value)])),
  radiusStyle: "subtle",
  radius: Object.fromEntries(RADIUS_TOKENS.map((token) => [token.id, px(token.value)])),
  borderWidth: 1,
  shadowStyle: "balanced",
  shadows: SHADOW_PRESETS.balanced,
};

export function resolveScales(saved) {
  return {
    spaceBase: saved?.spaceBase ?? DEFAULT_SCALES.spaceBase,
    density: saved?.density ?? DEFAULT_SCALES.density,
    space: { ...DEFAULT_SCALES.space, ...saved?.space },
    radiusStyle: saved?.radiusStyle ?? DEFAULT_SCALES.radiusStyle,
    radius: { ...DEFAULT_SCALES.radius, ...saved?.radius },
    borderWidth: saved?.borderWidth ?? DEFAULT_SCALES.borderWidth,
    shadowStyle: saved?.shadowStyle ?? DEFAULT_SCALES.shadowStyle,
    shadows: Object.fromEntries(
      SHADOW_STEPS.map((step) => [
        step.id,
        { ...DEFAULT_SCALES.shadows[step.id], ...saved?.shadows?.[step.id] },
      ])
    ),
  };
}

function recomputeSpace(scales, base, density, locks = {}) {
  const factor = DENSITY_PRESETS[density] ?? 1;
  const space = { ...scales.space };
  for (const step of SPACE_STEPS) {
    if (!locks[step.id]) space[step.id] = Math.round(base * factor * step.multiple * 100) / 100;
  }
  return space;
}

/** New base unit: every unlocked step becomes base × density × its multiple. */
export function rebaseSpace(scales, base, locks = {}) {
  return { ...scales, spaceBase: base, space: recomputeSpace(scales, base, scales.density, locks) };
}

/** New density: every unlocked step recomputes from the current base. */
export function applyDensity(scales, density, locks = {}) {
  return { ...scales, density, space: recomputeSpace(scales, scales.spaceBase, density, locks) };
}

export function applyRadiusPreset(scales, preset) {
  return {
    ...scales,
    radiusStyle: preset,
    radius: { ...scales.radius, ...RADIUS_PRESETS[preset] },
  };
}

export function applyShadowPreset(scales, preset) {
  return { ...scales, shadowStyle: preset, shadows: SHADOW_PRESETS[preset] };
}

export function shadowValue({ y, blur, alpha }) {
  return `0 ${y}px ${blur}px rgba(0, 0, 0, ${alpha})`;
}

export function scaleVars(scales) {
  const resolved = resolveScales(scales);
  return {
    ...Object.fromEntries(
      Object.entries(resolved.space).map(([id, value]) => [`--${id}`, `${value}px`])
    ),
    ...Object.fromEntries(
      Object.entries(resolved.radius).map(([id, value]) => [`--${id}`, `${value}px`])
    ),
    "--border-width": `${resolved.borderWidth}px`,
    ...Object.fromEntries(
      Object.entries(resolved.shadows).map(([id, shadow]) => [`--${id}`, shadowValue(shadow)])
    ),
  };
}

export function applyScales(element, scales) {
  if (!element) return;
  for (const [name, value] of Object.entries(scaleVars(scales))) {
    element.style.setProperty(name, value);
  }
}
