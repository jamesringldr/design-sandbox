// Font roles backed by Google Fonts. A role is unset (null) or
// { family, category, weights: [400, 600], available: [100 … 900] }.

export const FONT_ROLES = [
  { id: "ui", label: "UI", token: "font-ui", use: "Body copy, controls, labels", defaultWeights: [400, 500, 600] },
  { id: "display", label: "Display", token: "font-display", use: "Headings, hero text, big numbers", defaultWeights: [600, 700] },
  { id: "mono", label: "Mono", token: "font-mono", use: "Data, IDs, timestamps, code", defaultWeights: [400, 500] },
];

export const FONT_CATEGORIES = ["Sans Serif", "Serif", "Display", "Handwriting", "Monospace"];

const GENERIC = {
  "Sans Serif": "system-ui, sans-serif",
  Serif: "Georgia, serif",
  Display: "system-ui, sans-serif",
  Handwriting: "cursive",
  Monospace: "ui-monospace, monospace",
};

// What the previews use while a role is unset (the playground's own faces).
const PREVIEW_DEFAULTS = {
  ui: '"IBM Plex Sans", Helvetica, sans-serif',
  display: "var(--font-ui)",
  mono: '"IBM Plex Mono", ui-monospace, monospace',
};

export function resolveFonts(saved) {
  return Object.fromEntries(FONT_ROLES.map((role) => [role.id, saved?.[role.id] || null]));
}

export function fontStack(font) {
  return `"${font.family}", ${GENERIC[font.category] || "sans-serif"}`;
}

/** Default weights for a role, limited to what the family has. */
export function pickWeights(available, role) {
  const hit = role.defaultWeights.filter((weight) => available.includes(weight));
  if (hit.length) return hit;
  const nearest = [...available].sort((a, b) => Math.abs(a - 400) - Math.abs(b - 400))[0];
  return nearest ? [nearest] : [];
}

/** One css2 URL for every chosen family (weights merged per family). */
export function fontsCssUrl(fonts, extra = "") {
  const families = new Map();
  for (const font of Object.values(fonts || {})) {
    if (!font?.family) continue;
    const weights = families.get(font.family) || new Set();
    for (const weight of font.weights || []) weights.add(weight);
    families.set(font.family, weights);
  }
  if (!families.size) return "";
  const params = [...families].map(([family, weights]) => {
    const name = family.trim().replace(/ /g, "+");
    const list = [...weights].sort((a, b) => a - b);
    return `family=${name}${list.length ? `:wght@${list.join(";")}` : ""}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join("&")}${extra}&display=swap`;
}

export function fontVars(fonts) {
  const resolved = resolveFonts(fonts);
  return Object.fromEntries(
    FONT_ROLES.map((role) => [
      `--${role.token}`,
      resolved[role.id] ? fontStack(resolved[role.id]) : PREVIEW_DEFAULTS[role.id],
    ])
  );
}

export function applyFonts(element, fonts) {
  if (!element) return;
  for (const [name, value] of Object.entries(fontVars(fonts))) {
    element.style.setProperty(name, value);
  }
}

/** Keeps one <link rel="stylesheet"> in <head> pointed at href (by id). */
export function syncFontLink(id, href) {
  if (typeof document === "undefined") return;
  let link = document.head.querySelector(`link[data-font-link="${id}"]`);
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.fontLink = id;
    document.head.append(link);
  }
  if (link.href !== href) link.href = href;
}
