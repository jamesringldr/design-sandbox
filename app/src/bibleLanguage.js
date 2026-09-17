import { brandPaletteLabel, normalizeBrandPalette } from "./colorShuffle.js";
import { FONT_ROLES, fontStack } from "./fonts.js";

/** Single design-bible language. Used by the template, DESIGN.md, and tokens.css. */

export const BIBLE_SECTIONS = [
  { id: "0", title: "Quick Reference" },
  { id: "1", title: "Principles" },
  { id: "2", title: "Color" },
  { id: "3", title: "Type" },
  { id: "4", title: "Space" },
  { id: "5", title: "Layout" },
  { id: "6", title: "Depth" },
  { id: "7", title: "Motion" },
  { id: "8", title: "Icons" },
  { id: "9", title: "States" },
  { id: "10", title: "Anti-patterns" },
  { id: "11", title: "Components" },
  { id: "12", title: "Effects", optional: true },
];

export function sectionHeading(id, title) {
  return `## ${id} ${title}`;
}

export const COLOR_TOKENS = [
  {
    id: "color-primary",
    label: "Primary",
    group: "core",
    seed: "color-primary",
    controls:
      "Main buttons, active tabs, key visual accents, selected states. Core brand identifier.",
  },
  {
    id: "color-primary-on",
    label: "Primary On",
    group: "core",
    seed: "color-primary-on",
    controls:
      "Text and icons that sit on color-primary. Must hold contrast (usually white or dark navy).",
  },
  {
    id: "color-secondary",
    label: "Secondary",
    group: "core",
    seed: "color-secondary",
    controls:
      "Secondary buttons, badge highlights, active indicators, subtle interactive elements.",
  },
  {
    id: "color-accent",
    label: "Accent",
    group: "core",
    seed: "color-accent",
    controls:
      "Used sparingly for high-interest callouts, feature highlights, or promo elements.",
  },
  {
    id: "color-bg-app",
    label: "Background",
    group: "core",
    seed: "color-bg-app",
    controls:
      "Foundational canvas of the entire screen and viewport.",
  },
  {
    id: "color-bg-surface",
    label: "Surface",
    group: "core",
    seed: "color-bg-surface",
    controls:
      "Cards, modals, sidebars, and dropdowns. Depth against color-bg-app.",
  },
  {
    id: "color-text-primary",
    label: "Text",
    group: "core",
    seed: "color-text-primary",
    controls:
      "Headings, main body text, primary icons. Overall contrast and feel.",
  },
  {
    id: "color-text-secondary",
    label: "Text Secondary",
    group: "core",
    seed: "color-text-secondary",
    controls:
      "Captions, muted text, disabled labels, placeholder text.",
  },
  {
    id: "color-border",
    label: "Border",
    group: "core",
    seed: "color-border",
    controls:
      "Card outlines, input borders, dividers. Soft vs sharp changes how dense the UI feels.",
  },
  {
    id: "color-status-danger",
    label: "Danger",
    group: "core",
    seed: "color-status-danger",
    controls:
      "Error states, destructive buttons, delete alerts. The main functional alarm color.",
  },
];

export const CORE_COLOR_TOKENS = COLOR_TOKENS.filter((token) => token.group === "core");

export const SPACE_TOKENS = [
  { id: "space-1", value: "4px", use: "Tight icon gaps" },
  { id: "space-2", value: "8px", use: "Control padding, inline gaps" },
  { id: "space-3", value: "12px", use: "Compact stacks" },
  { id: "space-4", value: "16px", use: "Panel padding, section gap" },
  { id: "space-5", value: "24px", use: "Group separation" },
  { id: "space-6", value: "32px", use: "Page-level blocks" },
  { id: "space-8", value: "48px", use: "Major region gaps" },
];

export const RADIUS_TOKENS = [
  { id: "radius-sm", value: "4px", use: "Chips, small fills" },
  { id: "radius-md", value: "6px", use: "Inputs, buttons" },
  { id: "radius-lg", value: "10px", use: "Panels, cards" },
  { id: "radius-pill", value: "999px", use: "Pills, toggles, avatars" },
];

export const MOTION_TOKENS = [
  { id: "duration-instant", value: "50ms", use: "Press feedback, focus ring" },
  { id: "duration-fast", value: "120ms", use: "Color, chip state, hover" },
  { id: "duration-base", value: "200ms", use: "Panel open, tabs, menus" },
  { id: "duration-slow", value: "320ms", use: "Dialogs, sheets" },
  { id: "duration-slower", value: "500ms", use: "Page-level reveal" },
  { id: "ease-standard", value: "cubic-bezier(0.2, 0, 0, 1)", use: "Default for state changes" },
  { id: "ease-emphasized", value: "cubic-bezier(0.34, 1.56, 0.64, 1)", use: "Overshoot for lifts and pops" },
  { id: "ease-decelerate", value: "cubic-bezier(0.05, 0.7, 0.1, 1)", use: "Elements entering" },
  { id: "ease-accelerate", value: "cubic-bezier(0.3, 0, 0.8, 0.15)", use: "Elements leaving" },
  { id: "ease-linear", value: "linear", use: "Progress, spinners" },
];

export const TYPE_ROLES = [
  { id: "display", size: "30px", weight: "600", use: "Hero / empty-state title" },
  { id: "title", size: "22px", weight: "600", use: "Panel titles" },
  { id: "heading", size: "15px", weight: "600", use: "Section heads" },
  { id: "body", size: "14px", weight: "400", use: "Running copy" },
  { id: "caption", size: "12px", weight: "400", use: "Helper text" },
  { id: "label", size: "11px", weight: "500", use: "Field labels" },
  { id: "data", size: "13px", weight: "500", use: "IDs, counts, timestamps" },
];

const HARVEST_ALIASES = {
  "color-primary": [
    "color-primary",
    "colorPrimary",
    "accent",
    "brand",
    "brandPrimary",
    "colorBrand500",
    "colorAccentPrimary",
    "accentPrimary",
    "colorBgBrandSolid",
  ],
  "color-primary-on": [
    "color-primary-on",
    "colorPrimaryOn",
    "accentOn",
    "onAccent",
    "onControlContrast",
    "brandInk",
    "colorBrandInk",
  ],
  "color-secondary": [
    "color-secondary",
    "colorSecondary",
    "brandSecondary",
    "brandHover",
    "colorBrand600",
    "colorAccentHover",
  ],
  "color-accent": [
    "color-accent",
    "colorAccent",
    "tertiary",
    "colorTertiary",
  ],
  "color-bg-app": [
    "color-bg-app",
    "colorBgApp",
    "bg",
    "background",
    "colorBgPrimary",
    "colorBackground",
    "colorGray950",
    "bgPage",
  ],
  "color-bg-surface": [
    "color-bg-surface",
    "colorBgSurface",
    "surface",
    "card",
    "colorBgSecondary",
    "colorCard",
    "bgSurface",
  ],
  "color-text-primary": [
    "color-text-primary",
    "colorTextPrimary",
    "text",
    "colorFgPrimary",
    "colorGray50",
  ],
  "color-text-secondary": [
    "color-text-secondary",
    "colorTextSecondary",
    "textMuted",
    "colorFgSecondary",
    "colorGray300",
  ],
  "color-border": [
    "color-border",
    "colorBorder",
    "border",
    "colorBorderPrimary",
    "borderSubtle",
  ],
  "color-status-danger": [
    "color-status-danger",
    "colorStatusDanger",
    "danger",
    "destructive",
    "error",
    "colorError500",
  ],
};

function lookup(colors, aliases) {
  if (!colors) return "";
  for (const alias of aliases) {
    if (colors[alias]) return String(colors[alias]).trim();
    const wanted = alias.toLowerCase();
    for (const [key, value] of Object.entries(colors)) {
      if (key.toLowerCase() === wanted && value) return String(value).trim();
    }
  }
  return "";
}

export function mapHarvestedColors(themes) {
  const darkIn = themes?.dark || themes?.colors || {};
  const lightIn = themes?.light || {};
  const dark = {};
  const light = {};
  for (const token of COLOR_TOKENS) {
    const aliases = HARVEST_ALIASES[token.id] || [token.id];
    const d = lookup(darkIn, aliases);
    const l = lookup(lightIn, aliases);
    if (d) dark[token.id] = d;
    if (l) light[token.id] = l;
  }
  return { dark, light };
}

export function cssVar(id) {
  return `--${id}`;
}

/** brandHighlight -> --color-brand-highlight */
export function brandColorCssVar(id) {
  return cssVar(`color-${id.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`);
}

export function resolveBrandColors(colors, brandColors = []) {
  return normalizeBrandPalette(brandColors).map((color, index) => ({
    ...color,
    label: brandPaletteLabel(index),
    css: brandColorCssVar(color.id),
    value: lookup(colors, [color.id]),
  }));
}

export function resolveCoreColors(colors) {
  return CORE_COLOR_TOKENS.map((token) => {
    const aliases = HARVEST_ALIASES[token.id] || [token.id];
    const value = lookup(colors, aliases) || lookup(colors, [token.id, token.seed]);
    return {
      ...token,
      css: cssVar(token.id),
      value,
    };
  });
}

export function generateBibleTokensCss(tokens, brandColors = [], fonts = null) {
  const dark = tokens?.dark || {};
  const light = tokens?.light || {};
  const colorValue = (bag, token) =>
    lookup(bag, HARVEST_ALIASES[token.id] || [token.id]) || bag[token.id] || "";
  const colorLines = (bag) =>
    COLOR_TOKENS.map((token) => {
      const value = colorValue(bag, token);
      return value ? `  ${cssVar(token.id)}: ${value};` : `  ${cssVar(token.id)}: ;`;
    });
  const typeLines = TYPE_ROLES.map(
    (role) => `  --size-${role.id}: ${role.size};`
  );
  const brandLines = (bag) =>
    resolveBrandColors(bag, brandColors)
      .filter((row) => row.value)
      .map((row) => `  ${row.css}: ${row.value};`);
  const darkBrand = brandLines(dark);
  const lightColors = COLOR_TOKENS.filter((token) => colorValue(light, token));
  const lightBrand = brandLines(light);
  const lightBlock =
    lightColors.length === 0 && lightBrand.length === 0
      ? ""
      : [
          "",
          ".light {",
          ...lightColors.map(
            (token) => `  ${cssVar(token.id)}: ${colorValue(light, token)};`
          ),
          ...lightBrand,
          "}",
          "",
        ].join("\n");

  return [
    "/* Design bible tokens. Values are filled in the playground. Do not edit by hand. */",
    "",
    ":root {",
    "  /* Color */",
    ...colorLines(dark),
    ...(darkBrand.length ? ["  /* Branding */", ...darkBrand] : []),
    "  /* Space */",
    ...SPACE_TOKENS.map((token) => `  ${cssVar(token.id)}: ${token.value};`),
    "  /* Depth */",
    ...RADIUS_TOKENS.map((token) => `  ${cssVar(token.id)}: ${token.value};`),
    "  /* Motion */",
    ...MOTION_TOKENS.map((token) => `  ${cssVar(token.id)}: ${token.value};`),
    "  /* Type sizes */",
    ...typeLines,
    "  /* Type families */",
    ...FONT_ROLES.map(
      (role) => `  --${role.token}: ${fonts?.[role.id] ? fontStack(fonts[role.id]) : ""};`
    ),
    "}",
    lightBlock,
  ].join("\n");
}

export const EXISTING_DESIGN_CANDIDATES = [
  "docs/DESIGN.md",
  "DESIGN.md",
  "docs/design.md",
  "design.md",
  "docs/COMPONENTS.md",
  "src/styles/tokens.css",
  "packages/ui/src/styles/tokens.css",
  "tokens.css",
  "packages/ui/src/styles/theme.css",
  "src/styles/theme.css",
  "theme.css",
  "src/index.css",
  "app/globals.css",
  "src/app/globals.css",
  "styles/globals.css",
];
