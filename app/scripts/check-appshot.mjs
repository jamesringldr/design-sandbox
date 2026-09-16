#!/usr/bin/env node
// Checks converted AppShot pages against the token rules in docs/appshots.md.
//   node app/scripts/check-appshot.mjs <page.html>...
// Exits 1 if any page has problems.
import fs from "node:fs";

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(|\b(?:white|black|red|blue|green|gray|grey|orange|yellow|purple|pink)\b/;
const COLOR_PROPS = /^(color|background|background-color|background-image|border-color|border(-top|-right|-bottom|-left)?-color|outline-color|fill|stroke|caret-color|text-decoration-color|accent-color)$/;
const SPACE_PROPS = /^(margin|padding)(-top|-right|-bottom|-left|-inline|-block)?$|^(gap|row-gap|column-gap)$/;
const BORDER_SHORTHAND = /^(border|border-top|border-right|border-bottom|border-left|outline)$/;
const BORDER_WIDTH = /^(border(-top|-right|-bottom|-left)?-width|outline-width)$/;

function declarations(css) {
  const out = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of text.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)) {
    out.push({ prop: match[1].toLowerCase(), value: match[2].trim() });
  }
  return out;
}

function withoutVars(value) {
  // Drop var(...) including fallbacks so fallbacks don't count as literals.
  let out = value;
  let previous;
  do {
    previous = out;
    out = out.replace(/var\([^()]*(\([^()]*\))*[^()]*\)/g, "");
  } while (out !== previous);
  return out;
}

function check(file) {
  const html = fs.readFileSync(file, "utf8");
  const problems = [];
  if (/<(script|link|iframe|img)\b/i.test(html)) problems.push("contains <script>, <link>, <iframe>, or <img>");
  if (/\burl\(|https?:\/\//i.test(html)) problems.push("contains an external URL or url()");
  if (!/<style[\s>]/i.test(html)) problems.push("missing <style> block");

  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  const inline = [...html.matchAll(/\sstyle="([^"]*)"/gi)].map((m) => m[1]);
  const decls = [
    ...declarations(styles).map((d) => ({ ...d, where: "style" })),
    ...inline.flatMap((css) => declarations(css).map((d) => ({ ...d, where: "inline" }))),
  ];

  for (const { prop, value, where } of decls) {
    if (prop.startsWith("--")) continue;
    const bare = withoutVars(value);
    const at = `${where}: ${prop}: ${value}`;
    if (COLOR_PROPS.test(prop) || BORDER_SHORTHAND.test(prop) || prop === "box-shadow") {
      if (COLOR_LITERAL.test(bare)) problems.push(`literal color — ${at}`);
    }
    if (SPACE_PROPS.test(prop) && /(?<![\w.-])-?\d*\.?\d+px/.test(bare)) {
      problems.push(`px spacing (use --space-*) — ${at}`);
    }
    if (/^border(-top|-bottom)?(-left|-right)?-radius$/.test(prop) && /\d+px/.test(bare)) {
      problems.push(`px radius (use --radius-*) — ${at}`);
    }
    if ((BORDER_SHORTHAND.test(prop) || BORDER_WIDTH.test(prop)) && /\d*\.?\d+px/.test(bare)) {
      problems.push(`px border width (use --border-width) — ${at}`);
    }
    if (prop === "box-shadow" && bare.trim() && !/^none$/i.test(bare.trim()) && /\d/.test(bare)) {
      problems.push(`literal shadow (use --shadow-*) — ${at}`);
    }
    if (where === "inline" && (COLOR_PROPS.test(prop) || SPACE_PROPS.test(prop) || /radius|border|shadow/.test(prop))) {
      problems.push(`inline style may only set sizes — ${at}`);
    }
  }
  return [...new Set(problems)];
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node app/scripts/check-appshot.mjs <page.html>...");
  process.exit(2);
}
let failed = false;
for (const file of files) {
  const problems = check(file);
  if (problems.length) {
    failed = true;
    console.log(`✗ ${file}`);
    for (const problem of problems) console.log(`  - ${problem}`);
  } else {
    console.log(`✓ ${file}`);
  }
}
process.exit(failed ? 1 : 0);
