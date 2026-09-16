import { colorToHex, hexToHsl, hslToHex, opaqueHex, rand } from "./colorMath.js";

export const COLORWAY_TOKENS = [
  { id: "background", label: "Background", group: "neutral", section: "neutral" },
  { id: "surface", label: "Surface", group: "neutral", section: "neutral" },
  { id: "surfaceElevated", label: "Surface Elevated", group: "neutral", section: "neutral" },
  { id: "border", label: "Border", group: "neutral", section: "neutral" },
  { id: "text", label: "Text", group: "neutral", section: "neutral" },
  { id: "textMuted", label: "Text Muted", group: "neutral", section: "neutral" },
  { id: "brand", label: "Brand", group: "brand", section: "branding" },
  { id: "brandHover", label: "Brand Hover", group: "brand", section: "branding" },
  { id: "brandSubtle", label: "Brand Subtle", group: "brand", section: "branding" },
  { id: "warning", label: "Warning", group: "warning", section: "status" },
  { id: "warningSubtle", label: "Warning Subtle", group: "warning", section: "status" },
  { id: "success", label: "Success", group: "success", section: "status" },
  { id: "successSubtle", label: "Success Subtle", group: "success", section: "status" },
  { id: "destructive", label: "Destructive", group: "destructive", section: "status" },
  { id: "destructiveSubtle", label: "Destructive Subtle", group: "destructive", section: "status" },
  { id: "controlContrast", label: "Control Contrast", group: "other", section: "contrast" },
  { id: "onControlContrast", label: "On Contrast", group: "other", section: "contrast" },
  { id: "backgroundBrand", label: "Background Brand", group: "other", section: "branding" },
];

export const COLORWAY_SECTIONS = [
  { id: "branding", label: "Branding" },
  { id: "neutral", label: "Neutral" },
  { id: "status", label: "Status" },
  { id: "contrast", label: "Contrast" },
];

const RESERVED_IDS = new Set([
  ...COLORWAY_TOKENS.map((row) => row.id),
  "brandPrimary",
  "brandSecondary",
]);

/** "Highlight" -> "brandHighlight" (painted as --brand-highlight). */
export function brandTokenId(label) {
  const words = String(label).trim().replace(/^brand\b/i, "").match(/[A-Za-z0-9]+/g);
  if (!words) return "";
  return `brand${words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")}`;
}

export function isReservedTokenId(id) {
  return RESERVED_IDS.has(id);
}

export function newBrandHex(theme, hue) {
  return roleHex("brand", theme, hue, 0.86, 1);
}

const GROUPS = {
  neutral: ["background", "surfaceElevated", "surface", "border", "textMuted", "text"],
  brand: ["brand", "brandHover", "brandSubtle"],
  warning: ["warning", "warningSubtle"],
  success: ["success", "successSubtle"],
  destructive: ["destructive", "destructiveSubtle"],
};

const FAMILY_HUE = {
  warning: [12, 38],
  success: [138, 168],
  destructive: [0, 16],
};

const DARK_L = {
  background: 0.16,
  surfaceElevated: 0.2,
  surface: 0.25,
  textMuted: 0.64,
  text: 0.93,
  controlContrast: 0.87,
  onControlContrast: 0.12,
  backgroundBrand: 0.12,
};

const LIGHT_L = {
  background: 0.96,
  surface: 0.98,
  surfaceElevated: 0.93,
  textMuted: 0.45,
  text: 0.14,
  controlContrast: 0.14,
  onControlContrast: 0.97,
  backgroundBrand: 0.94,
};

export function isTokenLocked(locks, id) {
  if (!locks) return false;
  if (locks[id]) return true;
  if (id === "brand" && locks.brandPrimary) return true;
  if (id === "brandHover" && (locks.brandSecondary || locks.brandHover)) return true;
  return false;
}

function unlockedIn(group, locks) {
  return GROUPS[group].filter((id) => !isTokenLocked(locks, id));
}

function withAlpha(hex, a) {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex({ ...hsl, a });
}

function familyHue(group, fallback) {
  const range = FAMILY_HUE[group];
  if (!range) return fallback;
  return rand(range[0], range[1]);
}

function roleHex(id, theme, hue, sat, alpha) {
  const table = theme === "light" ? LIGHT_L : DARK_L;
  if (id === "border") {
    const text = roleHex("text", theme, hue, sat, 1);
    return withAlpha(text, theme === "light" ? 0.1 : 0.1);
  }
  if (id.endsWith("Subtle")) {
    const baseId = id.replace(/Subtle$/, "");
    const base = roleHex(baseId, theme, hue, Math.min(1, sat + 0.15), 1);
    return withAlpha(base, 0.14);
  }
  if (id === "brand") {
    return hslToHex({ h: hue, s: 0.86, l: theme === "light" ? 0.46 : 0.55, a: 1 });
  }
  if (id === "brandHover") {
    return hslToHex({ h: hue, s: 0.88, l: theme === "light" ? 0.38 : 0.45, a: 1 });
  }
  if (id === "brandSubtle") {
    return hslToHex({ h: hue, s: 0.86, l: 0.55, a: 0.14 });
  }
  const l = table[id];
  if (l == null) {
    return hslToHex({ h: hue, s: sat, l: theme === "light" ? 0.4 : 0.55, a: alpha ?? 1 });
  }
  return hslToHex({ h: hue, s: sat, l, a: alpha ?? 1 });
}

export function shuffleAll(colors, locks, theme, customBrandIds = []) {
  const next = { ...colors };
  const hue = rand(0, 360);
  const sat = rand(0.1, 0.22);

  const neutrals = unlockedIn("neutral", locks);
  for (const id of neutrals) {
    next[id] = roleHex(id, theme, hue, sat, id === "border" ? 0.1 : 1);
  }

  const brandUnlocked = unlockedIn("brand", locks);
  if (brandUnlocked.length) {
    const brandHue = rand(0, 360);
    for (const id of brandUnlocked) {
      next[id] = roleHex(id, theme, brandHue, 0.86, id === "brandSubtle" ? 0.14 : 1);
    }
  }

  for (const id of customBrandIds) {
    if (isTokenLocked(locks, id)) continue;
    next[id] = newBrandHex(theme, rand(0, 360));
  }

  for (const group of ["warning", "success", "destructive"]) {
    const ids = unlockedIn(group, locks);
    if (!ids.length) continue;
    const h = familyHue(group, hue);
    for (const id of ids) {
      next[id] = roleHex(id, theme, h, 0.82, id.endsWith("Subtle") ? 0.14 : 1);
    }
  }

  for (const id of ["controlContrast", "onControlContrast", "backgroundBrand"]) {
    if (isTokenLocked(locks, id)) continue;
    next[id] = roleHex(id, theme, hue, sat, 1);
  }

  if (next.brand) next.brandPrimary = next.brand;
  if (next.brandHover) next.brandSecondary = next.brandHover;
  return next;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rolledHex(id, theme, group, from) {
  const hsl = hexToHsl(from) || { h: 200, s: 0.2, l: 0.5, a: 1 };
  const nearWhite = hsl.l > 0.88;
  const nearBlack = hsl.l < 0.12;
  const washed = hsl.s < 0.1;
  const h = FAMILY_HUE[group] ? familyHue(group, hsl.h) : rand(0, 360);
  let s = hsl.s;
  let l = hsl.l;
  let a = hsl.a;

  if (nearWhite || nearBlack || washed) {
    s = rand(0.14, 0.34);
    if (nearWhite) l = rand(0.88, 0.96);
    else if (nearBlack) l = rand(0.1, 0.2);
  } else {
    s = clamp(hsl.s + rand(-0.06, 0.14), 0.12, 0.9);
    l = clamp(hsl.l + rand(-0.08, 0.08), 0.08, 0.96);
  }

  if (id === "border") a = rand(0.1, 0.28);
  if (id === "text" && theme === "dark") l = Math.max(l, 0.88);
  if (id === "text" && theme === "light") l = Math.min(l, 0.2);

  return hslToHex({ h, s, l, a });
}

export function shuffleOne(colors, id, theme) {
  const current = colorToHex(colors[id]) || "#808080";
  const token = COLORWAY_TOKENS.find((row) => row.id === id);
  const group = token?.group || "other";
  let hex = current;
  for (let i = 0; i < 16; i += 1) {
    hex = rolledHex(id, theme, group, current);
    if (hex !== current && opaqueHex(hex) !== opaqueHex(current)) break;
  }
  const next = { ...colors, [id]: hex };
  if (id === "brand") next.brandPrimary = next.brand;
  if (id === "brandHover") next.brandSecondary = next.brandHover;
  return next;
}
