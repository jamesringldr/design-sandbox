import {
  BIBLE_SECTIONS,
  COLOR_TOKENS,
  MOTION_TOKENS,
  RADIUS_TOKENS,
  SPACE_TOKENS,
  TYPE_ROLES,
  brandColorCssVar,
  cssVar,
  generateBibleTokensCss,
  sectionHeading,
} from "./bibleLanguage.js";
import { MANIFEST_PATH, parseManifest } from "./bibleManifest.js";
import { brandPaletteLabel, normalizeBrandPalette } from "./colorShuffle.js";
import { FONT_ROLES, fontsCssUrl } from "./fonts.js";
import { resolveScales, SHADOW_STEPS, shadowValue } from "./scales.js";

function capitalize(word) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

// bibleLanguage.js can't import scales.js (scales.js already imports it, for
// SPACE_TOKENS/RADIUS_TOKENS — a cycle). So the CSS block and the §4/§6
// tables take pre-resolved, pre-formatted strings from here instead.
function resolvedScaleStrings(tokenScales) {
  const resolved = resolveScales(tokenScales);
  return {
    ...resolved,
    space: Object.fromEntries(Object.entries(resolved.space).map(([id, px]) => [id, `${px}px`])),
    radius: Object.fromEntries(Object.entries(resolved.radius).map(([id, px]) => [id, `${px}px`])),
    borderWidth: `${resolved.borderWidth}px`,
    shadows: Object.fromEntries(
      Object.entries(resolved.shadows).map(([id, shadow]) => [id, shadowValue(shadow)])
    ),
  };
}

export { BIBLE_SECTIONS } from "./bibleLanguage.js";

const FORBIDDEN_BASENAMES = new Set([
  "theme.css",
  "globals.css",
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
]);

export function defaultBiblePaths(project) {
  const saved = project.bible || {};
  return {
    designMd: saved.designMd || "docs/DESIGN.md",
    tokensCss: saved.tokensCss || defaultTokensCssPath(project.tokenFile),
    componentsMd: saved.componentsMd || "docs/COMPONENTS.md",
    claudeMd: saved.claudeMd || "CLAUDE.md",
  };
}

export function defaultTokensCssPath(tokenFile) {
  if (!tokenFile) return "src/styles/tokens.css";
  const parts = String(tokenFile).split("/");
  const base = parts.pop();
  if (base === "tokens.css") return tokenFile;
  if (parts.length === 0) return "src/styles/tokens.css";
  return `${parts.join("/")}/tokens.css`;
}

export function assertSafeBibleTarget(rel) {
  const clean = String(rel || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean || clean.includes("..")) {
    throw new Error("Invalid bible path.");
  }
  const base = clean.split("/").pop().toLowerCase();
  if (FORBIDDEN_BASENAMES.has(base)) {
    throw new Error(`Refusing to write ${base}.`);
  }
  return clean;
}

export const BIBLE_DESIGN_CANDIDATES = [
  "docs/DESIGN.md",
  "DESIGN.md",
  "docs/design.md",
  "design.md",
];

export const BIBLE_COMPONENT_CANDIDATES = [
  "docs/COMPONENTS.md",
  "COMPONENTS.md",
];

export const BIBLE_TOKEN_CANDIDATES = [
  "src/styles/tokens.css",
  "packages/ui/src/styles/tokens.css",
  "styles/tokens.css",
  "tokens.css",
];

export function generateTokensCss(tokens, brandColors = [], fonts = null, tokenScales = null) {
  return generateBibleTokensCss(tokens, brandColors, fonts, resolvedScaleStrings(tokenScales));
}

function familiesLines(fonts) {
  if (!FONT_ROLES.some((role) => fonts?.[role.id])) {
    return ["Families: **_unset_**. Name the UI font, data font, and any quarantined face here."];
  }
  const url = fontsCssUrl(fonts);
  return [
    "| Family token | Role | Family | Weights |",
    "|---|---|---|---|",
    ...FONT_ROLES.map((role) => {
      const font = fonts[role.id];
      return `| \`--${role.token}\` | ${role.use} | ${font ? font.family : "_unset_"} | ${font ? font.weights.join(", ") : "—"} |`;
    }),
    "",
    `Load from Google Fonts: \`${url}\``,
    "",
    "Components use the family tokens, never family names.",
  ];
}

export { generateBibleTokensCss };

export function generateComponentsMd(project) {
  const name = project?.name || "Project";
  return [
    `# ${name} components`,
    "",
    "Playground template. Catalog adopted primitives here as they land.",
    "",
    "| Name | Import | Variants | When to use | When not to use |",
    "|---|---|---|---|---|",
    "| _none yet_ | — | — | — | — |",
    "",
  ].join("\n");
}

export function claudeDesignSection(paths) {
  return [
    "## Design",
    "",
    `Read \`${paths.designMd}\` BEFORE writing or editing ANY UI code. No exceptions.`,
    "If that file does not exist, STOP — do not proceed with styling.",
    "",
    "Hard rules:",
    `- No raw hex, rgb(), or rgba() in component files — use \`${paths.tokensCss}\` custom props.`,
    "- No arbitrary px values for spacing — use the space scale (DESIGN.md 4).",
    "- No font families not named in DESIGN.md 3.",
    "- No `style={{ }}` with color or spacing values — use className and tokens.",
    `- When a component exists in \`${paths.componentsMd}\`, use it. Do not reinvent.`,
    "- When ambiguous, STOP and ask. Do not make a design decision independently.",
    "",
    `Token file: \`${paths.tokensCss}\``,
    `Component catalog: \`${paths.componentsMd}\``,
    "",
  ].join("\n");
}

function colorNames(brandColors = []) {
  return [
    ...COLOR_TOKENS.map((token) => cssVar(token.id)),
    ...brandColors.map((color) => brandColorCssVar(color.id)),
  ]
    .map((name) => `\`${name}\``)
    .join(", ");
}

function usageTable() {
  return [
    "| Seed token | What it controls |",
    "|---|---|",
    ...COLOR_TOKENS.map(
      (token) => `| \`${cssVar(token.id)}\` | ${token.controls} |`
    ),
  ].join("\n");
}

function brandColorsTable(tokens, brandColors) {
  const dark = tokens?.dark || {};
  const light = tokens?.light || {};
  return [
    "| Token | Name | Dark | Light |",
    "|---|---|---|---|",
    ...brandColors.map(
      (color) =>
        `| \`${brandColorCssVar(color.id)}\` | ${color.label} | ${dark[color.id] || "—"} | ${light[color.id] || "—"} |`
    ),
  ].join("\n");
}

function colorwayTable(tokens) {
  const dark = tokens?.dark || {};
  const light = tokens?.light || {};
  return [
    "| Seed token | Dark | Light |",
    "|---|---|---|",
    ...COLOR_TOKENS.map((token) => {
      const d = dark[token.id] || "—";
      const l = light[token.id] || "—";
      return `| \`${cssVar(token.id)}\` | ${d} | ${l} |`;
    }),
  ].join("\n");
}

export function generateBibleMd(project, tokens, paths, ingested = {}) {
  const name = project.name || "Untitled";
  const brandColors = normalizeBrandPalette(project.brandColors).map((color, index) => ({
    ...color,
    label: brandPaletteLabel(index),
  }));
  const scales = resolvedScaleStrings(project.tokenScales);
  const css = generateTokensCss(tokens, brandColors, project.fonts, project.tokenScales).trim();
  const skeleton = [
    `# ${name} design system`,
    "",
    "Agent-facing bible. Fill this in the playground. Values live in the token file;",
    "rules live here. If a value disagrees, the token file wins. If a rule disagrees, this file wins.",
    "",
    `- Token file: \`${paths.tokensCss}\``,
    `- Components: \`${paths.componentsMd}\``,
    "",
    sectionHeading("0", "Quick Reference"),
    "",
    "**Composition:** _unset — layout type, content width, framing (flat / glass / other)._",
    "",
    "**Hard rules:** No raw hex, rgb(), or rgba() in component files. No arbitrary px for spacing. No font families outside 3 Type. When a component exists in the catalog, use it. When ambiguous, stop and ask.",
    "",
    `**Color:** ${colorNames(brandColors)}`,
    "",
    `Token file: \`${paths.tokensCss}\`. Catalog: \`${paths.componentsMd}\`.`,
    "",
    "**Components:** none adopted yet — see 11 Components.",
    "",
    sectionHeading("1", "Principles"),
    "",
    "1. Named tokens only. Components never invent a color, space, or type size.",
    "2. If a component exists in COMPONENTS.md, use it. Do not rebuild it.",
    "3. When this file does not cover a case, stop and ask. Do not freelance.",
    "",
    sectionHeading("2", "Color"),
    "",
    "This block must match the token file. Edit values in the playground, not by hand here.",
    "",
    "```css",
    css,
    "```",
    "",
    "### Core Colors",
    "",
    colorwayTable(tokens),
    "",
    "### Brand Palette",
    "",
    "Named by position — \"Primary 1\" is whichever swatch is first, and so on. `--color-primary` and `--color-secondary` are picked from these, not freehand.",
    "",
    brandColorsTable(tokens, brandColors),
    "",
    "### Usage",
    "",
    usageTable(),
    "",
    "Text on `--color-primary` uses `--color-primary-on`.",
    "",
    sectionHeading("3", "Type"),
    "",
    "Named roles, never bare pixel sizes in components. Use `var(--size-body)`, not `16px`.",
    "",
    ...familiesLines(project.fonts),
    "",
    "| Role | Size token | Size | Weight | Where used |",
    "|---|---|---|---|---|",
    ...TYPE_ROLES.map(
      (role) =>
        `| ${role.id} | \`--size-${role.id}\` | ${role.size} | ${role.weight} | ${role.use} |`
    ),
    "",
    sectionHeading("4", "Space"),
    "",
    `Base unit: **${scales.spaceBase}px** · density **${capitalize(scales.density)}**. Do not invent off-scale gaps.`,
    "",
    "| Token | Value | Use |",
    "|---|---|---|",
    ...SPACE_TOKENS.map(
      (token) => `| \`${cssVar(token.id)}\` | ${scales.space[token.id]} | ${token.use} |`
    ),
    "",
    sectionHeading("5", "Layout"),
    "",
    "_Stub. Add container max-widths, named breakpoints, and stacking rules for this product._",
    "",
    sectionHeading("6", "Depth"),
    "",
    `Radius style **${capitalize(scales.radiusStyle)}**, shadow style **${capitalize(scales.shadowStyle)}**, border width **${scales.borderWidth}**.`,
    "",
    "| Token | Value | Use |",
    "|---|---|---|",
    ...RADIUS_TOKENS.map(
      (token) => `| \`${cssVar(token.id)}\` | ${scales.radius[token.id]} | ${token.use} |`
    ),
    "",
    "| Token | Value | Use |",
    "|---|---|---|",
    ...SHADOW_STEPS.map(
      (step) => `| \`--${step.id}\` | ${scales.shadows[step.id]} | ${step.use} |`
    ),
    "",
    sectionHeading("7", "Motion"),
    "",
    "| Token | Value | Use |",
    "|---|---|---|",
    ...MOTION_TOKENS.map(
      (token) => `| \`${cssVar(token.id)}\` | ${token.value} | ${token.use} |`
    ),
    "",
    "Honor `prefers-reduced-motion: reduce`.",
    "",
    "**Intensity:** _unset._",
    "",
    "**Hover properties allowed:** _unset._",
    "",
    sectionHeading("8", "Icons"),
    "",
    project.iconLibrary
      ? `Icon library: \`${project.iconLibrary}\`. Name the import pattern and sizing scale.`
      : "_Stub. Name the icon package, import pattern, and sizing scale._",
    "",
    sectionHeading("9", "States"),
    "",
    "Hover, focus, active, disabled, loading, and error are token assignments, not per-component inventions.",
    "",
    "- Hover on primary actions: `--color-secondary` or a dedicated hover once named",
    "- Focus: 2px `--color-primary` ring",
    "- Disabled: `--color-text-secondary`",
    "- Danger: `--color-status-danger`",
    "",
    sectionHeading("10", "Anti-patterns"),
    "",
    "Two tiers. 10a is hook-enforced. 10b is agent judgment — not regex-checkable.",
    "",
    "### 10a Mechanical (hook-enforced)",
    "",
    "NEVER in component files:",
    "",
    "- Raw hex",
    "- `rgb()` / `rgba()` with literal values",
    "- CSS color names",
    "- Arbitrary utility values (`text-[#666]`, `p-[13px]`)",
    "- Inline `style` carrying color or spacing values",
    "- Font sizes in px not on the type scale",
    "- New font families not named in 3 Type",
    "",
    "### 10b Judgment (agent self-checked)",
    "",
    "- Do not add a second accent without a new semantic state.",
    "- Do not invent a component when COMPONENTS.md already covers the case.",
    "- Do not exceed the motion intensity in 7 Motion without a stated reason.",
    "",
    sectionHeading("11", "Components"),
    "",
    `Library: ${project.componentLibrary ? `\`${project.componentLibrary}\`` : "**_unset_**"}.`,
    "",
    `None adopted yet. Catalog: \`${paths.componentsMd}\`. Add a row when a primitive is adopted.`,
    "",
  ].join("\n");
  return mergeIngestedIntoTemplate(skeleton, ingested);
}

export function parseDesignSections(text) {
  const found = {};
  if (!text) return found;
  const re = /^##\s+§?(\d+)(?:\s*[.\u2014\u2013:—-]+\s*|\s+)(.+)$/gm;
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i += 1) {
    const id = matches[i][1];
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    found[id] = text.slice(start, end).trim();
  }
  return found;
}

export function isTemplateShaped(text) {
  if (!text) return false;
  const required = BIBLE_SECTIONS.filter((section) => !section.optional);
  return required.every((section) =>
    new RegExp(
      `^##\\s+${section.id}\\s+${section.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
      "im"
    ).test(text)
  );
}

function cleanIngestedBody(body) {
  return String(body || "")
    .replace(/§(\d+)/g, "$1")
    .replace(/§/g, "")
    .trim();
}

function ingestedUsable(body) {
  const text = cleanIngestedBody(body);
  if (text.length < 80) return false;
  if (/^_Stub\./m.test(text)) return false;
  return true;
}

function mergeIngestedIntoTemplate(skeleton, ingested) {
  if (!ingested || !Object.keys(ingested).length) return skeleton;
  const start = skeleton.search(/^##\s+0\s+/m);
  if (start < 0) return skeleton;
  const parsed = parseDesignSections(skeleton);
  const parts = [skeleton.slice(0, start).trimEnd(), ""];
  for (const section of BIBLE_SECTIONS) {
    const incoming = ingested[section.id];
    const fallback = parsed[section.id];
    if (section.optional && !ingestedUsable(incoming)) continue;
    parts.push(sectionHeading(section.id, section.title), "");
    if (section.id === "2") {
      parts.push((fallback || "").trim(), "");
      continue;
    }
    parts.push(
      ingestedUsable(incoming) ? cleanIngestedBody(incoming) : (fallback || "").trim(),
      ""
    );
  }
  return `${parts.join("\n").trim()}\n`;
}

function sectionState(section, body) {
  if (body == null) return section.optional ? "skipped" : "missing";
  if (/^_Stub\./m.test(body) || /^_Not applicable/m.test(body)) {
    return section.optional ? "skipped" : "stub";
  }
  if (!body || body.length < 40) return "stub";
  if (section.id === "10") {
    const mechanical = /10a|Mechanical/i.test(body);
    const judgment = /10b|Judgment/i.test(body);
    if (!mechanical || !judgment) return "stub";
  }
  if (section.id === "0" && !/\*\*Composition/i.test(body)) return "stub";
  if (section.id === "7") {
    const intensity = /intensity/i.test(body);
    const hover = /hover propert/i.test(body);
    if (!intensity || !hover) return "stub";
  }
  return "filled";
}

function cssMatches(disk, generated) {
  if (!disk) return false;
  const norm = (value) =>
    String(value)
      .replace(/\r\n/g, "\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();
  return norm(disk) === norm(generated);
}

export function evaluateBible({ files, generatedCss, hookExists }) {
  const parsed = parseDesignSections(files.designMd);
  const sectionRows = BIBLE_SECTIONS.map((section) => {
    const body = files.designMd ? parsed[section.id] : null;
    const state = files.designMd
      ? sectionState(section, body)
      : section.optional
        ? "skipped"
        : "missing";
    const note =
      section.id === "10" && body
        ? [
            /10a|Mechanical/i.test(body) ? "10a mechanical" : "10a missing",
            /10b|Judgment/i.test(body) ? "10b judgment" : "10b missing",
          ].join(" · ")
        : section.optional
          ? "Optional — skip unless the product has canvas/shader/bespoke effects"
          : "";
    return {
      id: section.id,
      title: section.title,
      optional: Boolean(section.optional),
      state,
      note,
    };
  });
  const requiredRows = sectionRows.filter((row) => !row.optional);
  const filled = requiredRows.filter((row) => row.state === "filled").length;
  const stubbed = requiredRows.filter((row) => row.state === "stub").length;
  let designState = "missing";
  if (files.designMd) {
    if (filled === requiredRows.length) designState = "ok";
    else designState = stubbed || filled ? "partial" : "stub";
  }

  let tokensState = "missing";
  if (files.tokensCss) {
    tokensState = cssMatches(files.tokensCss, generatedCss) ? "ok" : "mismatch";
  }

  const claudeState = files.claudeMd
    ? /^## Design\b/m.test(files.claudeMd)
      ? "ok"
      : "missing"
    : "missing";

  const manifest = parseManifest(files.manifestMd);
  const lastEntry = manifest?.entries[0];

  const items = [
    {
      id: "manifest",
      label: "DESIGN-BIBLE.md",
      state: manifest ? "ok" : "missing",
      detail: manifest
        ? `${manifest.status === "solidified" ? "Solidified" : "Draft"} · ${
            lastEntry ? `last change ${lastEntry.date} — ${lastEntry.title}` : "no log entries"
          }`
        : `Not in the project yet. Integrate writes ${MANIFEST_PATH}.`,
    },
    {
      id: "designMd",
      label: "DESIGN.md",
      state: designState,
      detail: files.designMd
        ? `${filled}/${requiredRows.length} required sections filled (0–11). 12 optional.`
        : "Not in the project yet",
    },
    {
      id: "componentsMd",
      label: "COMPONENTS.md",
      state: files.componentsMd ? "ok" : "missing",
      detail: files.componentsMd ? "Present" : "Not in the project yet",
    },
    {
      id: "tokensCss",
      label: "tokens.css",
      state: tokensState,
      detail:
        tokensState === "ok"
          ? "Matches playground export"
          : tokensState === "mismatch"
            ? "Exists but does not match generated tokens"
            : "Not in the project yet",
    },
    {
      id: "claudeDesign",
      label: "CLAUDE.md Design",
      state: claudeState,
      detail:
        claudeState === "ok"
          ? "Design section present"
          : files.claudeMd
            ? "File exists, Design section missing"
            : "File missing",
    },
    {
      id: "hook",
      label: "Token guard hook",
      state: hookExists ? "ok" : "missing",
      detail: hookExists
        ? "~/.claude/hooks/design-token-guard.py"
        : "Machine hook not installed",
    },
    {
      id: "audit",
      label: "Compliance audit",
      state: "not_run",
      detail: "Not run from this tool yet",
    },
    {
      id: "wireframe",
      label: "Wireframe test",
      state: "not_run",
      detail: "Manual acceptance — not recorded yet",
    },
  ];

  const countable = items.filter((item) => item.state !== "not_run");
  const done = countable.filter((item) => item.state === "ok").length;

  return {
    items,
    manifest: manifest
      ? { status: manifest.status, entries: manifest.entries }
      : null,
    sections: sectionRows,
    done,
    total: countable.length,
  };
}
