#!/usr/bin/env node
// Generates docs/<slug>/tokens.json (W3C DTCG) and docs/<slug>/llms.txt for one or more
// projects, from that project's agent-facing bible at data/projects/<slug>/design.md.
// The bible is the source of truth (see its own header); these are a machine-readable
// projection of it, published via GitHub Pages so coding agents can discover a project's
// tokens without cloning the repo.
//
// This is the manual, run-from-anywhere equivalent of the Design bible page's
// "Checkpoint & publish" button (see app/src/sandboxCheckpoint.js) — that button also
// commits and pushes the result; this script only writes the files.
//
//   node app/scripts/generate-agent-docs.mjs [slug...]   # defaults to every project found
//
// Do not hand-edit the generated files — rerun this script instead.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateDocs, repoSlugFromGit } from "../src/agentDocs.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(scriptDir, "..", "..");
const projectsDir = path.join(repoRoot, "data", "projects");
const docsDir = path.join(repoRoot, "docs");

async function generateProject(slug, repoSlug) {
  const designMdPath = path.join(projectsDir, slug, "design.md");
  if (!fs.existsSync(designMdPath)) {
    console.error(`skip ${slug}: no data/projects/${slug}/design.md`);
    return;
  }
  const projectJsonPath = path.join(projectsDir, slug, "project.json");
  const name = fs.existsSync(projectJsonPath)
    ? JSON.parse(fs.readFileSync(projectJsonPath, "utf8")).name || slug
    : slug;

  const designMd = fs.readFileSync(designMdPath, "utf8");
  const { tokensJson, llmsTxt, tokenCount } = generateDocs({ designMd, name, slug, repoSlug });

  const outDir = path.join(docsDir, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "tokens.json"), tokensJson);
  fs.writeFileSync(path.join(outDir, "llms.txt"), llmsTxt);
  console.log(`${slug}: wrote ${tokenCount} tokens to docs/${slug}/`);
}

const requested = process.argv.slice(2);
const slugs = requested.length
  ? requested
  : fs.readdirSync(projectsDir).filter((s) => fs.existsSync(path.join(projectsDir, s, "design.md")));

if (!slugs.length) {
  console.error("No projects found under data/projects/.");
  process.exit(1);
}

const repoSlug = await repoSlugFromGit(repoRoot);
for (const slug of slugs) await generateProject(slug, repoSlug);
