import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  assertSafeBibleTarget,
  BIBLE_COMPONENT_CANDIDATES,
  BIBLE_DESIGN_CANDIDATES,
  BIBLE_TOKEN_CANDIDATES,
  isTemplateShaped,
  parseDesignSections,
} from "./bible.js";
import { EXISTING_DESIGN_CANDIDATES, mapHarvestedColors } from "./bibleLanguage.js";
import { playgroundBibleTemplate } from "./bibleTemplate.js";
import { extractThemes } from "./tokens.js";

const execFileAsync = promisify(execFile);

export const DESIGN_BRANCH = "dev/design-playground";

const BASE_CANDIDATES = [
  "staging",
  "origin/staging",
  "develop",
  "origin/develop",
  "main",
  "origin/main",
  "master",
  "origin/master",
];

export function samePath(a, b) {
  const left = path.resolve(String(a || ""));
  const right = path.resolve(String(b || ""));
  return left === right;
}

export function isInside(root, candidate) {
  const rootPath = path.resolve(root);
  const full = path.resolve(candidate);
  const prefix = rootPath.endsWith(path.sep) ? rootPath : rootPath + path.sep;
  return full === rootPath || full.startsWith(prefix);
}

export function displayBase(ref) {
  return String(ref || "")
    .replace(/^refs\/remotes\/origin\//, "")
    .replace(/^origin\//, "");
}

export function parseWorktrees(stdout) {
  const blocks = String(stdout || "")
    .trim()
    .split(/\n\n+/);
  const trees = [];
  for (const block of blocks) {
    const rec = { path: "", head: "", branch: null, detached: false };
    for (const line of block.split("\n")) {
      if (line.startsWith("worktree ")) rec.path = line.slice(9);
      else if (line.startsWith("HEAD ")) rec.head = line.slice(5);
      else if (line.startsWith("branch ")) {
        rec.branch = line.slice(7).replace(/^refs\/heads\//, "");
      } else if (line === "detached") rec.detached = true;
    }
    if (rec.path) trees.push(rec);
  }
  return trees;
}

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

async function exists(file) {
  return Boolean(await fs.stat(file).catch(() => null));
}

async function isDirectory(file) {
  const stat = await fs.stat(file).catch(() => null);
  return Boolean(stat?.isDirectory());
}

async function isEmptyDir(dir) {
  const entries = await fs.readdir(dir).catch(() => null);
  return Array.isArray(entries) && entries.length === 0;
}

async function refExists(cwd, ref) {
  try {
    await git(cwd, ["rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
}

export async function inspectRepo(pickedPath) {
  const picked = path.resolve(pickedPath);
  const stat = await fs.stat(picked).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error("That path is not a folder.");
  }
  let toplevel;
  try {
    toplevel = path.resolve(await git(picked, ["rev-parse", "--show-toplevel"]));
  } catch {
    throw new Error(
      "That folder is not a git repo. The playground needs a local git repo so it can open a staging worktree."
    );
  }
  const commonDir = path.resolve(
    await git(picked, ["rev-parse", "--path-format=absolute", "--git-common-dir"])
  );
  const mainCheckout = path.basename(commonDir) === ".git"
    ? path.dirname(commonDir)
    : path.dirname(commonDir);
  const worktrees = parseWorktrees(
    await git(picked, ["worktree", "list", "--porcelain"])
  );
  return { picked, toplevel, commonDir, mainCheckout, worktrees };
}

export async function pickBaseRef(cwd) {
  for (const ref of BASE_CANDIDATES) {
    if (await refExists(cwd, ref)) return ref;
  }
  throw new Error(
    "No staging, develop, or main branch found. Cannot open a design worktree."
  );
}

export function suggestedWorktreePath(mainCheckout) {
  const parent = path.dirname(mainCheckout);
  const name = `${path.basename(mainCheckout).toLowerCase()}-design-playground`;
  return path.join(parent, name);
}

export async function worktreeNeedsInstall(root) {
  const markers = [
    path.join(root, "node_modules"),
    path.join(root, "apps", "app", "node_modules"),
  ];
  for (const marker of markers) {
    if (await exists(marker)) return false;
  }
  return true;
}

function assertAllowed(inspection, forbiddenRoots) {
  for (const root of forbiddenRoots || []) {
    if (isInside(root, inspection.toplevel) || isInside(root, inspection.mainCheckout)) {
      throw new Error(
        "The playground repo cannot host a design worktree of itself. Pick the app repo."
      );
    }
  }
}

async function liveWorktrees(cwd) {
  await git(cwd, ["worktree", "prune"]);
  return parseWorktrees(await git(cwd, ["worktree", "list", "--porcelain"]));
}

async function liveDesignWorktree(inspection) {
  const trees = await liveWorktrees(inspection.mainCheckout);
  const existing = trees.find((tree) => tree.branch === DESIGN_BRANCH);
  if (!existing) return null;
  if (!(await isDirectory(existing.path))) return null;
  return existing;
}

export async function findDesignWorktree(pickedPath, options = {}) {
  const inspection = await inspectRepo(pickedPath);
  assertAllowed(inspection, options.forbiddenRoots);
  const existing = await liveDesignWorktree(inspection);
  if (existing) {
    return {
      exists: true,
      localPath: path.resolve(existing.path),
      sourcePath: inspection.mainCheckout,
      pickedPath: inspection.picked,
      suggestedPath: path.resolve(existing.path),
      branch: DESIGN_BRANCH,
      base: "staging",
      needsInstall: await worktreeNeedsInstall(existing.path),
    };
  }
  return {
    exists: false,
    localPath: "",
    sourcePath: inspection.mainCheckout,
    pickedPath: inspection.picked,
    suggestedPath: suggestedWorktreePath(inspection.mainCheckout),
    branch: DESIGN_BRANCH,
    base: "staging",
    needsInstall: false,
  };
}

export async function isMainWorkingTree(pickedPath) {
  try {
    const inspection = await inspectRepo(pickedPath);
    return samePath(inspection.picked, inspection.mainCheckout);
  } catch {
    return false;
  }
}

export async function ensureDesignWorktree(pickedPath, options = {}) {
  const inspection = await inspectRepo(pickedPath);
  assertAllowed(inspection, options.forbiddenRoots);

  const existing = await liveDesignWorktree(inspection);
  if (existing) {
    return {
      localPath: path.resolve(existing.path),
      sourcePath: inspection.mainCheckout,
      pickedPath: inspection.picked,
      branch: DESIGN_BRANCH,
      base: "staging",
      created: false,
      reused: true,
      needsInstall: await worktreeNeedsInstall(existing.path),
    };
  }

  const dest = suggestedWorktreePath(inspection.mainCheckout);
  if (samePath(dest, inspection.mainCheckout)) {
    throw new Error("Design worktree path collided with the main checkout.");
  }
  if (await exists(dest)) {
    const destIsDir = await isDirectory(dest);
    const empty = destIsDir && (await isEmptyDir(dest));
    const listed = await liveWorktrees(inspection.mainCheckout);
    const alreadyListed = listed.some((tree) => samePath(tree.path, dest));
    if (!empty && !alreadyListed) {
      throw new Error(
        `Design worktree path already exists: ${dest}. Move or rename it, then reconnect.`
      );
    }
  }

  const base = await pickBaseRef(inspection.mainCheckout);
  const branchExists = await refExists(
    inspection.mainCheckout,
    `refs/heads/${DESIGN_BRANCH}`
  );
  if (branchExists) {
    await git(inspection.mainCheckout, ["worktree", "add", dest, DESIGN_BRANCH]);
  } else {
    await git(inspection.mainCheckout, [
      "worktree",
      "add",
      "-b",
      DESIGN_BRANCH,
      dest,
      base,
    ]);
  }

  return {
    localPath: dest,
    sourcePath: inspection.mainCheckout,
    pickedPath: inspection.picked,
    branch: DESIGN_BRANCH,
    base: displayBase(base),
    created: true,
    reused: false,
    needsInstall: await worktreeNeedsInstall(dest),
  };
}

async function firstExisting(root, candidates) {
  for (const rel of candidates) {
    const full = path.join(root, rel);
    if (await exists(full)) return rel.replace(/\\/g, "/");
  }
  return "";
}

export async function findBiblePresence(rootPath) {
  const root = path.resolve(rootPath);
  const designMd = await firstExisting(root, BIBLE_DESIGN_CANDIDATES);
  const componentsMd = await firstExisting(root, BIBLE_COMPONENT_CANDIDATES);
  const tokensCss = await firstExisting(root, BIBLE_TOKEN_CANDIDATES);
  const existing = [];
  for (const rel of EXISTING_DESIGN_CANDIDATES) {
    if (await exists(path.join(root, rel))) existing.push(rel);
  }
  return {
    found: Boolean(designMd),
    hasExistingDesign: existing.length > 0,
    existing,
    designMd,
    componentsMd,
    tokensCss,
  };
}

async function commitStaged(root, message) {
  const status = await git(root, ["status", "--porcelain"]);
  if (!status) return { committed: false };
  const branch = await git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  await git(root, ["commit", "-m", message], {
    env: { ...process.env, GITDADDY_CONFIRM: branch },
  });
  return { committed: true, branch };
}

export async function bootstrapBible(rootPath, options = {}) {
  const root = path.resolve(rootPath);
  const source = options.source || "found";
  const files = {};
  let paths = {
    designMd: options.designMd || "docs/DESIGN.md",
    tokensCss: options.tokensCss || "src/styles/tokens.css",
    componentsMd: options.componentsMd || "docs/COMPONENTS.md",
    claudeMd: "CLAUDE.md",
  };

  if (source === "template" || source === "template-integrate") {
    let harvested = { light: {}, dark: {} };
    let ingested = {};
    let keepDesignMd = false;
    let keepComponentsMd = false;
    if (source === "template-integrate") {
      const harvestFrom =
        options.uploadPath ||
        (options.existing && options.existing[0]
          ? path.join(root, options.existing[0])
          : "");
      const candidates = [
        harvestFrom,
        ...EXISTING_DESIGN_CANDIDATES.map((rel) => path.join(root, rel)),
      ].filter(Boolean);
      for (const file of candidates) {
        const text = await fs.readFile(file, "utf8").catch(() => "");
        if (!text) continue;
        harvested = mapHarvestedColors(extractThemes(text, file));
        if (Object.keys(harvested.dark).length) break;
      }
      const existingMdRel = await firstExisting(root, BIBLE_DESIGN_CANDIDATES);
      if (existingMdRel) {
        const existingMd = await fs.readFile(path.join(root, existingMdRel), "utf8");
        if (isTemplateShaped(existingMd)) {
          keepDesignMd = true;
        } else {
          ingested = parseDesignSections(existingMd);
        }
      }
      keepComponentsMd = Boolean(
        await firstExisting(root, BIBLE_COMPONENT_CANDIDATES)
      );
    }
    const template = playgroundBibleTemplate({
      name: options.name || "Untitled",
      tokenFile: paths.tokensCss,
      colorsByTheme: harvested,
      ingested,
    });
    paths = template.paths;
    Object.assign(files, template.files);
    if (keepDesignMd) delete files[paths.designMd];
    if (keepComponentsMd) delete files[paths.componentsMd];
  } else if (source === "upload") {
    const upload = path.resolve(options.uploadPath || "");
    if (!options.uploadPath) throw new Error("Choose a file to upload.");
    const text = await fs.readFile(upload, "utf8");
    if (isInside(root, upload)) {
      paths = {
        ...paths,
        designMd: path.relative(root, upload).replace(/\\/g, "/"),
      };
    } else {
      files[paths.designMd] = text;
    }
  }

  const written = [];
  for (const [rel, content] of Object.entries(files)) {
    const safe = assertSafeBibleTarget(rel);
    const dest = path.join(root, safe);
    if (!isInside(root, dest)) {
      throw new Error("Refusing to write outside the worktree.");
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, content.endsWith("\n") ? content : `${content}\n`);
    written.push(safe);
  }

  if (written.length) {
    await git(root, ["add", "--", ...written]);
  }
  const commit = await commitStaged(
    root,
    "chore: add design bible from playground"
  );
  const presence = await findBiblePresence(root);
  return {
    ...presence,
    paths,
    wrote: written,
    committed: commit.committed,
    branch: commit.branch || "",
  };
}
