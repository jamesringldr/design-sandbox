export const MANIFEST_PATH = "docs/DESIGN-BIBLE.md";
export const MANIFEST_VERSION = 1;
export const MANIFEST_STATUSES = ["draft", "solidified"];

const LOG_HEADING = "# Design bible log";

const PATH_KEYS = [
  ["design", "designMd"],
  ["tokens", "tokensCss"],
  ["components", "componentsMd"],
  ["claude", "claudeMd"],
];

export function today() {
  return new Date().toLocaleDateString("en-CA");
}

export function parseManifest(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(String(text || "").replace(/\r\n/g, "\n"));
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const at = line.indexOf(":");
    if (at < 0) continue;
    fields[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  const paths = {};
  for (const [key, id] of PATH_KEYS) {
    if (fields[key]) paths[id] = fields[key];
  }
  if (!paths.designMd) return null;
  const body = text.replace(/\r\n/g, "\n").slice(match[0].length);
  const entries = [...body.matchAll(/^##\s+(\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/gm)].map(
    (entry) => ({ date: entry[1], title: entry[2].trim() })
  );
  return {
    version: Number(fields.bible) || MANIFEST_VERSION,
    status: MANIFEST_STATUSES.includes(fields.status) ? fields.status : "draft",
    project: fields.project || "",
    paths,
    entries,
    body,
  };
}

function frontmatter({ status, project, paths }) {
  return [
    "---",
    `bible: ${MANIFEST_VERSION}`,
    `status: ${status}`,
    `project: ${project}`,
    ...PATH_KEYS.filter(([, id]) => paths[id]).map(([key, id]) => `${key}: ${paths[id]}`),
    "---",
  ].join("\n");
}

function entryBlock({ date, title, lines }) {
  return [`## ${date} — ${title}`, "", ...(lines || []).map((line) => `- ${line}`)]
    .join("\n")
    .trimEnd();
}

// Writes or updates the manifest. Newest log entry goes first.
export function writeManifest(existingText, { status, project, paths, entry }) {
  const current = parseManifest(existingText);
  const next = {
    status: status || current?.status || "draft",
    project: project || current?.project || "Untitled",
    paths: { ...(current?.paths || {}), ...paths },
  };
  let body = current?.body?.trim() || [
    LOG_HEADING,
    "",
    "Written by the design playground. The header tells the playground this bible",
    "exists and where its files live. Entries below record design changes, newest first.",
  ].join("\n");
  if (entry) {
    const block = entryBlock({ date: entry.date || today(), ...entry });
    const firstEntry = body.search(/^##\s+\d{4}-\d{2}-\d{2}\s+—/m);
    body = firstEntry < 0
      ? `${body}\n\n${block}`
      : `${body.slice(0, firstEntry).trimEnd()}\n\n${block}\n\n${body.slice(firstEntry)}`;
  }
  return `${frontmatter(next)}\n\n${body.trim()}\n`;
}

function cssVars(css) {
  const vars = new Map();
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, selector, decls] of blocks) {
    const scope = selector.trim();
    for (const decl of decls.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const key = scope === ":root" ? decl[1] : `${decl[1]} (${scope})`;
      vars.set(key, decl[2].trim() || "unset");
    }
  }
  return vars;
}

// One log line per token that changed between two tokens.css versions.
export function tokenChanges(beforeCss, afterCss) {
  const before = cssVars(beforeCss);
  const after = cssVars(afterCss);
  const lines = [];
  let added = 0;
  for (const [name, value] of after) {
    if (!before.has(name)) added += 1;
    else if (before.get(name) !== value) {
      lines.push(`\`${name}\`: ${before.get(name)} → ${value}`);
    }
  }
  for (const name of before.keys()) {
    if (!after.has(name)) lines.push(`Removed \`${name}\``);
  }
  if (added) lines.push(`Added ${added} token${added === 1 ? "" : "s"}`);
  return lines;
}
