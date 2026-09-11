export const STARTER_COLORS = {
  background: "#282828",
  surface: "#404040",
  surfaceElevated: "#333333",
  border: "rgba(255, 255, 255, 0.10)",
  text: "#FFFFFF",
  textMuted: "#A3A3A3",
  brand: "#14ABFE",
  brandPrimary: "#14ABFE",
  brandSecondary: "#0B8FD9",
  brandHover: "#0B8FD9",
  brandSubtle: "rgba(20, 171, 254, 0.14)",
  warning: "#FF5E1F",
  warningSubtle: "rgba(255, 94, 31, 0.14)",
  success: "#3DDC97",
  successSubtle: "rgba(61, 220, 151, 0.14)",
  destructive: "#E5484D",
  destructiveSubtle: "rgba(229, 72, 77, 0.14)",
  controlContrast: "#E0DEDC",
  onControlContrast: "#1A1A1A",
  backgroundBrand: "#0A1628",
};

export const STARTER_LIGHT = {
  background: "#F4F4F5",
  surface: "#FFFFFF",
  surfaceElevated: "#ECECEC",
  border: "rgba(0, 0, 0, 0.10)",
  text: "#1A1A1A",
  textMuted: "#737373",
  brand: "#0B8FD9",
  brandPrimary: "#0B8FD9",
  brandSecondary: "#14ABFE",
  brandHover: "#0A7EC2",
  brandSubtle: "rgba(11, 143, 217, 0.14)",
  warning: "#FF5E1F",
  warningSubtle: "rgba(255, 94, 31, 0.14)",
  success: "#1BA974",
  successSubtle: "rgba(27, 169, 116, 0.14)",
  destructive: "#E5484D",
  destructiveSubtle: "rgba(229, 72, 77, 0.14)",
  controlContrast: "#1A1A1A",
  onControlContrast: "#FFFFFF",
  backgroundBrand: "#E7F5FF",
};

export const STARTER_THEMES = { dark: STARTER_COLORS, light: STARTER_LIGHT };

export const DISPLAY_TOKENS = [
  {
    id: "brandPrimary",
    label: "Brand Primary",
    aliases: [
      "brandPrimary",
      "brand",
      "primary",
      "accent",
      "colorBrand500",
      "colorBrand",
      "colorFgBrandPrimary",
      "colorBgBrandSolid",
      "colorBgBrandPrimary",
      "colorAccentPrimary",
    ],
  },
  {
    id: "brandSecondary",
    label: "Brand Secondary",
    aliases: [
      "brandSecondary",
      "secondary",
      "brandHover",
      "colorBrand600",
      "colorBgBrandSecondary",
      "colorAccentHover",
      "colorFgBrandSecondary",
    ],
  },
  {
    id: "background",
    label: "Background",
    aliases: [
      "background",
      "bg",
      "colorBackground",
      "backgroundDefault",
      "colorBgPrimary",
      "backgroundColorPrimary",
      "colorGray950",
    ],
  },
  {
    id: "backgroundBrand",
    label: "Background Brand",
    aliases: [
      "backgroundBrand",
      "brandBackground",
      "hero",
      "colorNavyHero",
      "colorBrandDark",
      "colorBgBrandSection",
    ],
  },
  {
    id: "surface",
    label: "Surface",
    aliases: [
      "surface",
      "card",
      "colorCard",
      "backgroundSurface",
      "colorBgSecondary",
      "backgroundColorSecondary",
      "colorGray900",
    ],
  },
  {
    id: "surfaceElevated",
    label: "Surface Elevated",
    aliases: [
      "surfaceElevated",
      "popover",
      "elevated",
      "colorPopover",
      "surface2",
      "colorBgTertiary",
      "backgroundColorTertiary",
      "colorGray800",
    ],
  },
];

export const ELEMENT_LOCKS = [
  { id: "colors", label: "Color palette" },
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "radius", label: "Radius" },
];

export const EMPTY_ELEMENT_LOCKS = Object.fromEntries(
  ELEMENT_LOCKS.map((item) => [item.id, false])
);

const COLOR_VALUE =
  /^(#|rgba?\(|hsla?\(|oklch\(|oklab\(|hwb\(|lab\(|lch\(|color-mix\(|color\()/i;

export function toCssVar(key) {
  const name = key.replace(/^--/, "");
  const kebab = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
  return `--${kebab}`;
}

export function applyColors(element, colors) {
  if (!element || !colors) return;
  const resolved = canonicalColors(colors);
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string" && value.trim()) {
      element.style.setProperty(toCssVar(key), value.trim());
    }
  }
}

export function isHex(value) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
}

function looksLikeColor(value) {
  const trimmed = String(value).trim();
  return COLOR_VALUE.test(trimmed) || isHex(trimmed);
}

function looksLikeColorOrRef(value) {
  const trimmed = String(value).trim();
  return looksLikeColor(trimmed) || /^var\(/i.test(trimmed);
}

export function parseCssColors(text) {
  const colors = {};
  if (!text) return colors;
  const re = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = re.exec(text))) {
    const value = match[2].trim();
    if (looksLikeColorOrRef(value)) colors[cssKeyToCamel(match[1])] = value;
  }
  return resolveVarRefs(colors);
}

function cssKeyToCamel(name) {
  return name.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function resolveVarRefs(colors) {
  const byKebab = {};
  for (const [key, value] of Object.entries(colors)) {
    byKebab[toCssVar(key)] = value;
  }

  function resolve(value, seen = new Set()) {
    const ref = String(value).match(
      /^var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,\s*([^)]+))?\)\s*$/
    );
    if (!ref) return value;
    if (seen.has(ref[1])) return value;
    seen.add(ref[1]);
    const next =
      byKebab[ref[1]] || colors[cssKeyToCamel(ref[1].replace(/^--/, ""))];
    if (!next) return ref[2] ? ref[2].trim() : value;
    return resolve(next, seen);
  }

  const out = {};
  for (const [key, value] of Object.entries(colors)) {
    out[key] = resolve(value);
  }
  return out;
}

function flattenTokens(value, path, out) {
  if (value == null) return;
  if (typeof value === "string") {
    if (looksLikeColor(value) && path) out[path] = value;
    return;
  }
  if (typeof value !== "object") return;
  if (value.$value != null) {
    flattenTokens(value.$value, path, out);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith("$")) continue;
    const next = path
      ? path + key.charAt(0).toUpperCase() + key.slice(1)
      : key;
    flattenTokens(child, cssKeyToCamel(String(next).replace(/[/-]/g, "-")), out);
  }
}

function themeBag(data) {
  if (!data || typeof data !== "object") return null;
  if (data.light && data.dark) return data;
  if (data.colors?.light && data.colors?.dark) return data.colors;
  if (data.themes?.light && data.themes?.dark) return data.themes;
  return null;
}

export function parseJsonThemes(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { light: {}, dark: {} };
  }
  const bag = themeBag(data);
  if (bag) {
    const light = {};
    const dark = {};
    flattenTokens(bag.light, "", light);
    flattenTokens(bag.dark, "", dark);
    return { light, dark };
  }
  const colors = {};
  const root = data.colors && typeof data.colors === "object" ? data.colors : data;
  flattenTokens(root, "", colors);
  return { light: { ...colors }, dark: { ...colors } };
}

function selectorTheme(selector) {
  const sel = selector.toLowerCase();
  if (
    /\.dark\b|dark-theme|data-theme\s*=\s*['"]dark['"]|prefers-color-scheme:\s*dark/.test(
      sel
    )
  ) {
    return "dark";
  }
  if (
    /\.light\b|light-theme|data-theme\s*=\s*['"]light['"]|prefers-color-scheme:\s*light/.test(
      sel
    )
  ) {
    return "light";
  }
  if (/:root|^html\b|^:host\b|@theme/.test(sel)) return "base";
  return null;
}

function walkRules(text, callback) {
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open === -1) break;
    const selector = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth += 1;
      else if (text[j] === "}") depth -= 1;
      j += 1;
    }
    callback(selector, text.slice(open + 1, j - 1));
    i = j;
  }
}

export function parseCssThemes(text) {
  const light = {};
  const dark = {};
  const base = parseCssColors(text);
  if (!text) return { light, dark };
  walkRules(text, (selector, body) => {
    const kind = selectorTheme(selector);
    if (!kind || kind === "base") return;
    const vars = parseCssColors(body);
    if (kind === "dark") Object.assign(dark, vars);
    else Object.assign(light, vars);
  });
  const hasDark = Object.keys(dark).length > 0;
  const hasLight = Object.keys(light).length > 0;
  if (hasDark && hasLight) {
    return { light: { ...base, ...light }, dark: { ...base, ...dark } };
  }
  if (hasDark) return { light: { ...base }, dark: { ...base, ...dark } };
  if (hasLight) return { light: { ...base, ...light }, dark: { ...base } };
  return { light: { ...base }, dark: { ...base } };
}

export function parseDesignMdThemes(text) {
  const fence = text.match(/```css\s*([\s\S]*?)```/i);
  return parseCssThemes(fence ? fence[1] : text);
}

export function extractThemes(text, path = "") {
  const lower = path.toLowerCase();
  if (lower.endsWith(".json") || text.trim().startsWith("{")) {
    const fromJson = parseJsonThemes(text);
    if (countColors(fromJson)) return fromJson;
  }
  if (lower.endsWith(".md")) return parseDesignMdThemes(text);
  return parseCssThemes(text);
}

export function extractColors(text, path = "") {
  const themes = extractThemes(text, path);
  return Object.keys(themes.dark).length ? themes.dark : themes.light;
}

function countColors(themes) {
  return (
    Object.keys(themes.light || {}).length + Object.keys(themes.dark || {}).length
  );
}

export function themesEmpty(themes) {
  return !themes || countColors(themes) === 0;
}

export function defaultTokenLocks(colors) {
  const locks = {};
  for (const token of DISPLAY_TOKENS) {
    const resolved = token.aliases.find((alias) => colors?.[alias]);
    locks[resolved || token.id] = false;
  }
  return locks;
}

function lookupColor(colors, alias) {
  if (!colors || !alias) return "";
  if (colors[alias]) return colors[alias];
  const wanted = alias.toLowerCase();
  for (const [key, value] of Object.entries(colors)) {
    if (key.toLowerCase() === wanted && value) return value;
  }
  return "";
}

export function resolveDisplayColors(colors) {
  return DISPLAY_TOKENS.map((token) => {
    let key = token.id;
    let value = "";
    for (const alias of token.aliases) {
      const found = lookupColor(colors, alias);
      if (found && looksLikeColor(found)) {
        key = alias;
        value = found;
        break;
      }
    }
    return { id: token.id, label: token.label, key, value };
  });
}

const GUIDE_ALIASES = [
  { id: "text", aliases: ["text", "colorTextPrimary", "colorFgPrimary", "colorGray50"] },
  { id: "textMuted", aliases: ["textMuted", "colorTextSecondary", "colorFgSecondary", "colorGray300", "colorGray400"] },
  { id: "border", aliases: ["border", "colorBorderPrimary", "colorBorderSecondary"] },
  { id: "warning", aliases: ["warning", "colorWarning500", "colorFgWarningPrimary"] },
  { id: "success", aliases: ["success", "colorSuccess500", "colorFgSuccessPrimary"] },
  { id: "destructive", aliases: ["destructive", "colorError500", "colorFgErrorPrimary"] },
  { id: "onControlContrast", aliases: ["onControlContrast", "colorBrandInk", "colorBlack"] },
];

function pickAlias(colors, aliases) {
  for (const alias of aliases) {
    const found = lookupColor(colors, alias);
    if (found && looksLikeColor(found)) return found;
  }
  return "";
}

export function canonicalColors(colors) {
  const out = { ...(colors || {}) };
  for (const row of resolveDisplayColors(out)) {
    if (!row.value) continue;
    out[row.id] = row.value;
    if (row.id === "brandPrimary") out.brand = out.brand || row.value;
    if (row.id === "brandSecondary") out.brandHover = out.brandHover || row.value;
    if (row.id === "surfaceElevated") out.surfaceElevated = out.surfaceElevated || row.value;
    if (row.id === "backgroundBrand") out.backgroundBrand = out.backgroundBrand || row.value;
  }
  for (const guide of GUIDE_ALIASES) {
    if (!out[guide.id]) {
      const value = pickAlias(out, guide.aliases);
      if (value) out[guide.id] = value;
    }
  }
  return out;
}

export function themeColors(project) {
  const mode = project.theme === "light" ? "light" : "dark";
  return (
    project.colorsByTheme?.[mode] ||
    project.colors ||
    STARTER_THEMES[mode]
  );
}
