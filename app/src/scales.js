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

export const DEFAULT_SCALES = {
  spaceBase: 4,
  space: Object.fromEntries(SPACE_TOKENS.map((token) => [token.id, px(token.value)])),
  radius: Object.fromEntries(RADIUS_TOKENS.map((token) => [token.id, px(token.value)])),
  borderWidth: 1,
  shadows: {
    "shadow-1": { y: 1, blur: 2, alpha: 0.3 },
    "shadow-2": { y: 6, blur: 16, alpha: 0.35 },
    "shadow-3": { y: 16, blur: 40, alpha: 0.5 },
  },
};

export function resolveScales(saved) {
  return {
    spaceBase: saved?.spaceBase ?? DEFAULT_SCALES.spaceBase,
    space: { ...DEFAULT_SCALES.space, ...saved?.space },
    radius: { ...DEFAULT_SCALES.radius, ...saved?.radius },
    borderWidth: saved?.borderWidth ?? DEFAULT_SCALES.borderWidth,
    shadows: Object.fromEntries(
      SHADOW_STEPS.map((step) => [
        step.id,
        { ...DEFAULT_SCALES.shadows[step.id], ...saved?.shadows?.[step.id] },
      ])
    ),
  };
}

/** New base unit: every unlocked step becomes base × its multiple. */
export function rebaseSpace(scales, base, locks = {}) {
  const space = { ...scales.space };
  for (const step of SPACE_STEPS) {
    if (!locks[step.id]) space[step.id] = Math.round(base * step.multiple * 100) / 100;
  }
  return { ...scales, spaceBase: base, space };
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
