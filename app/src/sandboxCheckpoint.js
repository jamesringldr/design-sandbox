// "Checkpoint & publish" for the Design bible page: commits the current bible
// snapshot (data/projects/<slug>/design.md) and its regenerated docs/<slug>/
// agent docs into the design-sandbox repo and pushes them, so the tracked git
// history and the GitHub Pages URL both reflect this moment. See
// app/scripts/generate-agent-docs.mjs for the manual CLI equivalent of the
// doc-generation half of this (that script does not commit or push).
//
// data/projects is a symlink to wherever its real folder lives (see git log /
// the session this was built in — git refuses to `add` through a symlinked
// directory), so this resolves the real path first and commits in *that*
// path's own git worktree, on whatever branch is currently checked out there.
// Mirrors designWorktree.js's commitStaged: staging + a ConfirmModal in the UI
// is the human confirmation, then GITDADDY_CONFIRM is set to that same branch.
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { generateDocs, repoSlugFromGit } from "./agentDocs.js";

const execFileAsync = promisify(execFile);

async function git(cwd, args, extra = {}) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
      timeout: 120000,
      maxBuffer: 20 * 1024 * 1024,
      env: extra.env || process.env,
    });
    return stdout.trim();
  } catch (error) {
    const detail = String(error.stderr || error.message || "git failed").trim();
    throw new Error(detail.split("\n").slice(-3).join(" ").trim() || "git failed");
  }
}

async function resolveSandboxRepo(repoRoot) {
  const projectsDir = path.join(repoRoot, "data", "projects");
  const real = await fs.realpath(projectsDir);
  const toplevel = path.resolve(await git(real, ["rev-parse", "--show-toplevel"]));
  const branch = await git(toplevel, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  return { toplevel, branch, realProjectsDir: real };
}

async function loadBible(realProjectsDir, slug) {
  const designMdPath = path.join(realProjectsDir, slug, "design.md");
  const designMd = await fs.readFile(designMdPath, "utf8").catch(() => null);
  if (designMd == null) throw new Error(`No design.md found for "${slug}" at ${designMdPath}.`);
  const projectJsonPath = path.join(realProjectsDir, slug, "project.json");
  const projectJson = await fs
    .readFile(projectJsonPath, "utf8")
    .then((text) => JSON.parse(text))
    .catch(() => null);
  return { designMd, designMdPath, name: projectJson?.name || slug };
}

/** Dry run for the confirm dialog: what branch, and would anything actually change. */
export async function checkpointStatus({ slug, repoRoot }) {
  const { toplevel, branch, realProjectsDir } = await resolveSandboxRepo(repoRoot);
  const { designMd, name } = await loadBible(realProjectsDir, slug);
  const repoSlug = await repoSlugFromGit(toplevel);
  const { tokensJson, llmsTxt, tokenCount } = generateDocs({ designMd, name, slug, repoSlug });

  const tokensPath = path.join(toplevel, "docs", slug, "tokens.json");
  const llmsPath = path.join(toplevel, "docs", slug, "llms.txt");
  const [currentTokens, currentLlms] = await Promise.all([
    fs.readFile(tokensPath, "utf8").catch(() => null),
    fs.readFile(llmsPath, "utf8").catch(() => null),
  ]);
  const designMdChanged = await git(toplevel, ["status", "--porcelain", "--", path.relative(toplevel, path.join(realProjectsDir, slug, "design.md"))]);

  return {
    branch,
    slug,
    name,
    tokenCount,
    changed: Boolean(designMdChanged) || currentTokens !== tokensJson || currentLlms !== llmsTxt,
  };
}

/** The real thing: write docs/<slug>/*, stage design.md + docs/<slug>/, commit, push. */
export async function checkpointSandbox({ slug, repoRoot, confirmBranch }) {
  const { toplevel, branch, realProjectsDir } = await resolveSandboxRepo(repoRoot);
  if (confirmBranch && confirmBranch !== branch) {
    throw new Error(
      `Confirmed branch "${confirmBranch}" no longer matches the checked-out branch "${branch}" — re-confirm before committing.`
    );
  }

  const { designMd, designMdPath, name } = await loadBible(realProjectsDir, slug);
  const repoSlug = await repoSlugFromGit(toplevel);
  const { tokensJson, llmsTxt, tokenCount } = generateDocs({ designMd, name, slug, repoSlug });

  const docsDir = path.join(toplevel, "docs", slug);
  await fs.mkdir(docsDir, { recursive: true });
  await fs.writeFile(path.join(docsDir, "tokens.json"), tokensJson);
  await fs.writeFile(path.join(docsDir, "llms.txt"), llmsTxt);

  await git(toplevel, [
    "add",
    "--",
    path.relative(toplevel, designMdPath),
    path.relative(toplevel, docsDir),
  ]);

  const staged = await git(toplevel, ["diff", "--cached", "--name-only"]);
  if (!staged) {
    return { committed: false, pushed: false, branch, tokenCount, message: "Nothing changed since the last checkpoint." };
  }

  await git(toplevel, ["commit", "-m", `checkpoint: ${name} design bible — ${tokenCount} tokens`], {
    env: { ...process.env, GITDADDY_CONFIRM: branch },
  });
  const sha = await git(toplevel, ["rev-parse", "--short", "HEAD"]);

  let pushed = false;
  let pushError = null;
  try {
    await git(toplevel, ["push", "origin", branch]);
    pushed = true;
  } catch (error) {
    pushError = error.message;
  }

  return {
    committed: true,
    pushed,
    pushError,
    branch,
    sha,
    tokenCount,
    files: staged.split("\n").filter(Boolean),
  };
}
