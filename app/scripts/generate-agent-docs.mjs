#!/usr/bin/env node
// Generates docs/vanyshr/tokens.json (W3C DTCG) and docs/vanyshr/llms.txt from design.md.
// design.md is the source of truth; these are a machine-readable projection of it,
// published via GitHub Pages so coding agents can discover them without cloning the repo.
//   node app/scripts/generate-agent-docs.mjs
// Do not hand-edit the generated files — rerun this script instead.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptDir, "..", "..");
const designMdPath = path.join(repoRoot, "design.md");
const outDir = path.join(repoRoot, "docs", "vanyshr");

const designMd = fs.readFileSync(designMdPath, "utf8");

const version = designMd.match(/^- Version:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
const date = designMd.match(/^- Date:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";

// Pull every ```css fenced block and read --token: value; declarations from it.
// design.md currently only fences color tokens this way (section 2); spacing, radius,
// and motion are still prose, so they are intentionally absent from tokens.json until
// design.md declares them as CSS custom properties too.
const cssBlocks = [...designMd.matchAll(/```css\n([\s\S]*?)```/g)].map((m) => m[1]);
const tokens = {};
for (const block of cssBlocks) {
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
    tokens[m[1]] = m[2].trim();
  }
}

const dtcg = {
  color: Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [name, { $value: value, $type: "color" }])
  ),
};

const llmsTxt = `# Vanyshr design system

> Dark-only, compact design system for Vanyshr. design.md is the source of truth;
> tokens.json below is a generated, machine-readable subset of it for coding agents.

Version ${version} — ${date}.

## Docs

- [Design spec](https://github.com/jamesringldr/design-sandbox/blob/main/design.md): full production-ready spec — color, type, spacing, components.
- [Tokens (DTCG)](./tokens.json): color tokens in W3C Design Tokens Community Group format, generated from design.md.
- [Changelog](https://github.com/jamesringldr/design-sandbox/blob/main/changelog.md): dated history of system changes.

## Notes

- This file and tokens.json are generated from design.md by app/scripts/generate-agent-docs.mjs. Do not hand-edit; rerun the script instead.
- Only tokens design.md declares inside a fenced \`\`\`css block are included. Spacing, radius, and motion are still prose in design.md and are not yet machine-readable here.
- design.md is the spec to diff into the production app; do not copy sandbox artifact HTML into production.
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "tokens.json"), JSON.stringify(dtcg, null, 2) + "\n");
fs.writeFileSync(path.join(outDir, "llms.txt"), llmsTxt);

console.log(`Wrote ${Object.keys(tokens).length} tokens to docs/vanyshr/tokens.json`);
console.log("Wrote docs/vanyshr/llms.txt");
