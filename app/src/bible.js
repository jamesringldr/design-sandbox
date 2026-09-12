import { compactTheme, generateThemeCss, toCssVar } from "./themeExport.js";
import { DISPLAY_TOKENS, resolveDisplayColors } from "./tokens.js";

export const BIBLE_SECTIONS = [
  { id: "0", title: "Quick Reference" },
  { id: "1", title: "Principles" },
  { id: "2", title: "Color Tokens" },
  { id: "3", title: "Typography" },
  { id: "4", title: "Spacing" },
  { id: "5", title: "Layout" },
  { id: "6", title: "Elevation, Borders, Radius" },
  { id: "7", title: "Motion" },
  { id: "8", title: "Icons" },
  { id: "9", title: "States" },
  { id: "10", title: "Anti-patterns" },
  { id: "11", title: "Component Reference" },
  { id: "12", title: "Bespoke Effects", optional: true },
];

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

export function generateTokensCss(tokens) {
  return generateThemeCss(tokens);
}

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
    "- No arbitrary px values for spacing — use the spacing scale (DESIGN.md §4).",
    "- No font families not in DESIGN.md §3.",
    "- No `style={{ }}` with color or spacing values — use className and tokens.",
    `- When a component exists in \`${paths.componentsMd}\`, use it. Do not reinvent.`,
    "- When ambiguous, STOP and ask. Do not make a design decision independently.",
    "",
    `Token file: \`${paths.tokensCss}\``,
    `Component catalog: \`${paths.componentsMd}\``,
    "",
  ].join("\n");
}

function tokenNameList(tokens) {
  const compact = compactTheme(tokens?.dark || {});
  const names = Object.keys(compact).map((key) => `\`${toCssVar(key)}\``);
  return names.length ? names.join(", ") : "_none mapped yet_";
}

function usageTable() {
  return [
    "| Token | Where it is used | Where it must not be used |",
    "|---|---|---|",
    "| `--background` | Page and app shell | Cards sitting on the page |",
    "| `--surface-elevated` | Panels, cards, popovers on `--background` | Page background |",
    "| `--surface` | Secondary buttons, inputs on panels, filled rows | Large fill areas |",
    "| `--border` | Every divider and control outline at rest | Emphasis — raise opacity instead |",
    "| `--brand` | Primary action, active tab, progress fill, links | Text over `--surface` at body size |",
    "| `--warning` | Needs-review and identity-check states | Any decorative accent |",
    "| `--success` | Completed removals, healthy status | Primary actions |",
    "| `--destructive` | Destructive actions and failures | Warnings |",
    "| `--control-contrast` | Rare high-emphasis control | More than one instance per screen |",
    "| `--background-brand` | Splash and hero surfaces only | Any in-app panel |",
  ].join("\n");
}

function colorwayTable(tokens) {
  const darkRows = resolveDisplayColors(tokens?.dark || {});
  const lightRows = resolveDisplayColors(tokens?.light || {});
  const lightById = Object.fromEntries(lightRows.map((row) => [row.id, row]));
  return [
    "| Role | Token | Dark | Light |",
    "|---|---|---|---|",
    ...darkRows.map((row) => {
      const light = lightById[row.id];
      const dark = row.value || "—";
      const lite = light?.value || "—";
      return `| ${row.label} | \`${toCssVar(row.id)}\` | ${dark} | ${lite} |`;
    }),
  ].join("\n");
}

export function generateBibleMd(project, tokens, paths) {
  const name = project.name || "Untitled";
  const css = generateTokensCss(tokens).trim();
  const library = project.componentLibrary || "unset";
  const tokenNames = [
    ...DISPLAY_TOKENS.map((token) => `\`${toCssVar(token.id)}\``),
    "`--text`",
    "`--text-muted`",
    "`--border`",
    "`--warning`",
    "`--success`",
    "`--destructive`",
  ].join(", ");

  return [
    `# ${name} design system`,
    "",
    "Agent-facing bible. Color values in §2 are generated from the design playground.",
    "Do not put raw hex in components — use the named tokens in the token file.",
    "",
    `- Token file: \`${paths.tokensCss}\``,
    `- Components: \`${paths.componentsMd}\``,
    `- Library: ${library}`,
    "",
    "## 0. Quick Reference",
    "",
    "**Composition:** sidebar + content, compact data density, flat framing (no glass, no skeuomorph).",
    "",
    "**Hard rules:** No raw hex, rgb(), or rgba() in component files. No arbitrary px for spacing. No font families outside §3. When a component exists in the catalog, use it. When ambiguous, stop and ask.",
    "",
    `**Color tokens:** ${tokenNames}`,
    "",
    `**Mapped values:** ${tokenNameList(tokens)}`,
    "",
    `Token file: \`${paths.tokensCss}\`. Catalog: \`${paths.componentsMd}\`.`,
    "",
    "**Components:** none adopted yet — see §11.",
    "",
    "## 1. Principles",
    "",
    "1. One accent. `--brand` carries every primary action and active state. Orange, mint, and red are semantic signals and never decoration.",
    "2. Status reads as outline. Filled backgrounds are reserved for counts in navigation.",
    "3. Compact by default. Controls 32–36px, labels 12–13px, 4px spacing base.",
    "4. Monospace carries data. Plex Mono for IDs, timestamps, counts, and uppercase labels.",
    "5. Terminal type is quarantined. Space Grotesk lowercase appears only in log and activity output.",
    "",
    "## 2. Color Tokens",
    "",
    "This block must match the token file. Integrate from the playground rather than editing values here by hand.",
    "",
    "```css",
    css,
    "```",
    "",
    "### Colorway",
    "",
    colorwayTable(tokens),
    "",
    "### Usage",
    "",
    usageTable(),
    "",
    "Text on `--brand` and `--control-contrast` is `--on-control-contrast`, never white.",
    "",
    "## 3. Typography",
    "",
    "Named roles, never bare pixel sizes in components. Use `var(--size-body)` (or the matching Tailwind token) — not `16px`.",
    "",
    "Interface: **IBM Plex Sans** (400, 500, 600). Data and labels: **IBM Plex Mono** (400, 500). Terminal only: **Space Grotesk** (400, 500), always lowercase.",
    "",
    "| Role | Family | Size | Weight | Tracking | Line height | Where used |",
    "|---|---|---|---|---|---|---|",
    "| display | Plex Sans | 30px | 600 | -0.03em | 1.05 | Page hero / empty-state title |",
    "| title | Plex Sans | 22px | 600 | -0.02em | 1.15 | Panel titles |",
    "| heading | Plex Sans | 15px | 600 | 0 | 1.3 | Section heads |",
    "| body | Plex Sans | 14px | 400 | 0 | 1.6 | Running copy |",
    "| caption | Plex Sans | 12px | 400 | 0 | 1.4 | Helper text |",
    "| label | Plex Mono | 10px | 400 | 0.14em | 1.2 | Uppercase field labels |",
    "| data | Plex Mono | 13px | 500 | 0 | 1.4 | IDs, counts, timestamps |",
    "| terminal | Space Grotesk | 13px | 400 | 0 | 1.45 | Log / activity lines only |",
    "",
    "`label` is always uppercase and `--text-muted`. `terminal` is always lowercase and colored by its semantic token. Nothing below 10px.",
    "",
    "## 4. Spacing",
    "",
    "Base unit: **4px**. Named scale:",
    "",
    "| Token | Value | Use |",
    "|---|---|---|",
    "| `--space-1` | 4px | Tight icon gaps |",
    "| `--space-2` | 8px | Control padding, inline gaps |",
    "| `--space-3` | 12px | Compact stacks |",
    "| `--space-4` | 16px | Panel padding, section gap |",
    "| `--space-5` | 24px | Group separation |",
    "| `--space-6` | 32px | Page-level blocks |",
    "| `--space-8` | 48px | Major region gaps |",
    "",
    "Control heights: input/select/button `34px`, icon button `32×32`. Do not invent 13px or 18px gaps.",
    "",
    "## 5. Layout",
    "",
    "_Stub. Add container max-widths, named breakpoints, and stacking rules for this product._",
    "",
    "## 6. Elevation, Borders, Radius",
    "",
    "No shadows. Elevation is surface value plus border.",
    "",
    "| Radius token | Value | Use |",
    "|---|---|---|",
    "| `--radius-chip` | 4px | Chips, small fills |",
    "| `--radius-control` | 6px | Inputs, buttons |",
    "| `--radius-panel` | 10px | Panels, cards |",
    "| `--radius-pill` | 999px | Pills, toggles, avatars |",
    "",
    "Border emphasis ladder (dark): rest `rgba(255,255,255,0.10)` · hover `0.18` · emphasis `0.24` · status outline = status hue at 35% (`color-mix`).",
    "",
    "Named technique recipes: none yet. Recurring constructions that are more than a token (gradient-border shells, frosted stacks, glow treatments) get a named step-by-step recipe here — agents copy the recipe, they do not reverse-engineer a screenshot.",
    "",
    "## 7. Motion",
    "",
    "| Token | Value | Use |",
    "|---|---|---|",
    "| `--duration-fast` | 120ms | Hover color, chip state |",
    "| `--duration-normal` | 200ms | Panel open, tab underline |",
    "| `--duration-slow` | 320ms | Page-level reveal |",
    "",
    "Easing: `ease-out` for enter, `ease-in` for leave. Honor `prefers-reduced-motion: reduce` — drop non-essential transitions.",
    "",
    "**Intensity: subtle.** New animation ideas must sit at or under this ceiling.",
    "",
    "**Hover properties allowed:** color, opacity, border-color, background. Not allowed unless stated: `transform` / scale / bounce.",
    "",
    "**Scroll-driven reveals:** none. Do not introduce a second scroll-animation system.",
    "",
    "## 8. Icons",
    "",
    "_Stub. Name the icon package, import pattern, and sizing scale._",
    "",
    "## 9. States",
    "",
    "Hover, focus, active, disabled, loading, and error are token assignments, not per-component inventions.",
    "",
    "- Hover on brand actions: `--brand-hover`",
    "- Focus: 2px `--brand` ring (do not invent a second focus color)",
    "- Disabled: `--text-muted` at 50% and `--border` at 6%",
    "- Status: outline chips only — completed `--success`, in progress `--brand`, needs review `--warning`, failed `--destructive`, queued `--text-muted`",
    "",
    "## 10. Anti-patterns",
    "",
    "Two tiers. §10a is hook-enforced. §10b is agent judgment — not regex-checkable.",
    "",
    "### §10a — Mechanical (hook-enforced)",
    "",
    "NEVER in component files:",
    "",
    "- Raw hex (`#282828`, `#14ABFE`, …)",
    "- `rgb()` / `rgba()` with literal values",
    "- CSS color names (`red`, `blue`, `gray`, …)",
    "- Arbitrary utility values (`text-[#666]`, `p-[13px]`)",
    "- Inline `style` carrying color or spacing values",
    "- Font sizes in px not on the type scale",
    "- New font families not declared in §3",
    "- Raw z-index values (use named levels)",
    "- Hardcoded breakpoint values (use named breakpoint tokens)",
    "",
    "### §10b — Judgment (agent self-checked)",
    "",
    "- Don't introduce a new accent color outside the core palette without a genuine new semantic state to justify it.",
    "- Don't mix shadow/blur/elevation recipes that don't already coexist elsewhere in the product — reuse an existing depth recipe.",
    "- Don't exceed the stated motion intensity (§7) without a deliberate, stated reason.",
    "- Don't invent a new component when an existing one in COMPONENTS.md covers the case with a different prop/variant.",
    "",
    "## 11. Component Reference",
    "",
    "None adopted yet. Catalog lives in `" +
      paths.componentsMd +
      "` — add a row here when a primitive is adopted (name, path, variants, one-line usage).",
    "",
  ].join("\n");
}

export function parseDesignSections(text) {
  const found = {};
  if (!text) return found;
  const re = /^##\s+(\d+)\.\s+(.+)$/gm;
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i += 1) {
    const id = matches[i][1];
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    found[id] = text.slice(start, end).trim();
  }
  return found;
}

function sectionState(section, body) {
  if (body == null) return section.optional ? "skipped" : "missing";
  if (/^_Stub\./m.test(body) || /^_Not applicable/m.test(body)) {
    return section.optional ? "skipped" : "stub";
  }
  if (!body || body.length < 40) return "stub";
  if (section.id === "10") {
    const mechanical = /§10a|Mechanical \(hook/i.test(body);
    const judgment = /§10b|Judgment \(agent/i.test(body);
    if (!mechanical || !judgment) return "stub";
  }
  if (section.id === "0" && !/\*\*Composition:\*\*/i.test(body)) return "stub";
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
            /§10a|Mechanical \(hook/i.test(body) ? "10a mechanical" : "10a missing",
            /§10b|Judgment \(agent/i.test(body) ? "10b judgment" : "10b missing",
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

  const items = [
    {
      id: "designMd",
      label: "DESIGN.md",
      state: designState,
      detail: files.designMd
        ? `${filled}/${requiredRows.length} required sections filled (§0–§11). §12 optional.`
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
    sections: sectionRows,
    done,
    total: countable.length,
  };
}
