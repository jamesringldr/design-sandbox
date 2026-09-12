import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  assertSafeBibleTarget,
  claudeDesignSection,
  defaultBiblePaths,
  evaluateBible,
  generateBibleMd,
  generateTokensCss,
} from "./src/bible.js";
import {
  assignSlugs,
  generateDesignMd,
  generateThemeCss,
  projectMeta,
} from "./src/projectFiles.js";
import {
  isTokenCandidate,
  shouldSkipDir,
  TOKEN_PATHS,
} from "./src/tokenPaths.js";
import { startDevServer, stopDevServer, devServerStatus } from "./src/devServer.js";
import {
  bootstrapBible,
  ensureDesignWorktree,
  findBiblePresence,
  findDesignWorktree,
  isInside,
  isMainWorkingTree,
  worktreeNeedsInstall,
} from "./src/designWorktree.js";
import { extractThemes, themesEmpty } from "./src/tokens.js";

const execFileAsync = promisify(execFile);
const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = path.resolve(APP_DIR, "..");
const DATA_ROOT = path.resolve(APP_DIR, "../data");
const ROUTES = new Set([
  "/api/select-folder",
  "/api/select-file",
  "/api/read-tokens",
  "/api/design-worktree",
  "/api/design-worktree/inspect",
  "/api/load",
  "/api/save",
  "/api/bible-status",
  "/api/bible-find",
  "/api/bible-bootstrap",
  "/api/bible-integrate",
  "/api/dev-server/start",
  "/api/dev-server/stop",
  "/api/dev-server/status",
]);

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

function assertInside(root, candidate) {
  const rootPath = path.resolve(root);
  const full = path.resolve(candidate);
  const prefix = rootPath.endsWith(path.sep) ? rootPath : rootPath + path.sep;
  if (full !== rootPath && !full.startsWith(prefix)) {
    throw new Error("Path is outside the selected folder.");
  }
  return full;
}

async function walkTokenFiles(root, depth = 0, acc = []) {
  if (depth > 5 || acc.length > 80) return acc;
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (acc.length > 80) break;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDir(entry.name)) await walkTokenFiles(full, depth + 1, acc);
      continue;
    }
    if (entry.isFile() && isTokenCandidate(entry.name)) acc.push(full);
  }
  return acc;
}

async function themesFromFile(file) {
  const text = await fs.readFile(file, "utf8").catch(() => null);
  if (!text) return null;
  const themes = extractThemes(text, file);
  if (themesEmpty(themes)) return null;
  return themes;
}

function relativeTo(root, file) {
  const rel = path.relative(root, file);
  if (!rel || rel.startsWith("..")) return file;
  return rel.split(path.sep).join("/");
}

async function readJson(file) {
  const text = await fs.readFile(file, "utf8").catch(() => null);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeFileAtomic(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, contents, "utf8");
  await fs.rename(tmp, file);
}

async function writeJson(file, value) {
  await writeFileAtomic(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function retargetMainCheckout(meta, slug) {
  if (!meta?.localPath) return meta;
  const onMain = await isMainWorkingTree(meta.localPath);
  if (!onMain) return meta;
  const worktree = await findDesignWorktree(meta.localPath, {
    forbiddenRoots: [PLAYGROUND_ROOT],
  });
  if (!worktree.exists) return meta;
  const next = {
    ...meta,
    slug,
    localPath: worktree.localPath,
    sourcePath: worktree.sourcePath,
    worktreeBranch: worktree.branch,
    worktreeBase: worktree.base,
    needsInstall: worktree.needsInstall,
  };
  await writeJson(
    path.join(DATA_ROOT, "projects", slug, "project.json"),
    projectMeta(next, slug)
  );
  return next;
}

async function loadPlayground() {
  const index = await readJson(path.join(DATA_ROOT, "playground.json"));
  if (!index) return { projects: [], activeId: null };
  const projects = [];
  for (const row of index.projects || []) {
    const slug = row.slug;
    if (!slug || typeof slug !== "string") continue;
    const dir = path.join(DATA_ROOT, "projects", slug);
    const meta = await readJson(path.join(dir, "project.json"));
    const tokens = await readJson(path.join(dir, "tokens.json"));
    if (!meta) continue;
    let resolved = meta;
    try {
      resolved = await retargetMainCheckout(meta, slug);
    } catch {
      resolved = meta;
    }
    const needsInstall = resolved.localPath
      ? await worktreeNeedsInstall(resolved.localPath)
      : false;
    projects.push({
      ...resolved,
      slug,
      colorsByTheme: tokens || { light: {}, dark: {} },
      needsInstall,
    });
  }
  return { projects, activeId: index.activeId ?? null };
}

async function savePlayground(state) {
  const projects = assignSlugs(Array.isArray(state.projects) ? state.projects : []);
  const taken = new Set();
  const roster = [];

  for (const project of projects) {
    const slug = project.slug;
    taken.add(slug);
    roster.push({ id: project.id, slug, name: project.name || "Untitled" });
    const dir = path.join(DATA_ROOT, "projects", slug);
    await fs.mkdir(dir, { recursive: true });
    const tokens = project.colorsByTheme || {
      light: project.colors || {},
      dark: project.colors || {},
    };
    await writeJson(path.join(dir, "project.json"), projectMeta(project, slug));
    await writeJson(path.join(dir, "tokens.json"), {
      light: tokens.light || {},
      dark: tokens.dark || {},
    });
    await writeFileAtomic(path.join(dir, "theme.css"), generateThemeCss(tokens));
    await writeFileAtomic(
      path.join(dir, "design.md"),
      generateDesignMd(project, tokens)
    );
  }

  await writeJson(path.join(DATA_ROOT, "playground.json"), {
    version: 1,
    activeId: state.activeId ?? null,
    projects: roster,
  });

  const projectsDir = path.join(DATA_ROOT, "projects");
  const dirs = await fs.readdir(projectsDir, { withFileTypes: true }).catch(() => []);
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    if (taken.has(entry.name)) continue;
    await fs.rm(path.join(projectsDir, entry.name), { recursive: true, force: true });
  }

  return { ok: true, projects: roster };
}

const HOOK_FILE = path.join(
  os.homedir(),
  ".claude/hooks/design-token-guard.py"
);

async function readRel(root, rel) {
  try {
    const full = assertInside(root, path.join(root, rel));
    return await fs.readFile(full, "utf8");
  } catch {
    return null;
  }
}

function resolvedBiblePaths(body) {
  const paths = defaultBiblePaths({
    tokenFile: body.tokenFile || "",
    bible: body.bible || {},
  });
  return {
    designMd: assertSafeBibleTarget(paths.designMd),
    tokensCss: assertSafeBibleTarget(paths.tokensCss),
    componentsMd: assertSafeBibleTarget(paths.componentsMd),
    claudeMd: assertSafeBibleTarget(paths.claudeMd),
  };
}

async function scanBible(root, body, paths) {
  const tokens = body.colorsByTheme || { light: {}, dark: {} };
  const files = {
    designMd: await readRel(root, paths.designMd),
    tokensCss: await readRel(root, paths.tokensCss),
    componentsMd: await readRel(root, paths.componentsMd),
    claudeMd: await readRel(root, paths.claudeMd),
  };
  const hookExists = await fs
    .stat(HOOK_FILE)
    .then((stat) => stat.isFile())
    .catch(() => false);
  return {
    paths,
    localPath: root,
    ...evaluateBible({
      files,
      generatedCss: generateTokensCss(tokens),
      hookExists,
    }),
  };
}

async function chooseMac(script) {
  const { stdout } = await execFileAsync("osascript", ["-e", script]);
  return stdout.trim();
}

export default function localRepoPlugin() {
  return {
    name: "local-repo",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!ROUTES.has(url)) {
          next();
          return;
        }

        try {
          if (req.method === "GET" && url === "/api/select-folder") {
            if (process.platform !== "darwin") {
              send(res, 501, { error: "Folder picker is macOS only for now." });
              return;
            }
            try {
              const folder = await chooseMac(
                'POSIX path of (choose folder with prompt "Select a local repository")'
              );
              const name = folder.replace(/\/+$/, "").split("/").pop();
              send(res, 200, { path: folder, name });
            } catch {
              send(res, 409, { cancelled: true });
            }
            return;
          }

          if (req.method === "GET" && url === "/api/select-file") {
            if (process.platform !== "darwin") {
              send(res, 501, { error: "File picker is macOS only for now." });
              return;
            }
            try {
              const file = await chooseMac(
                'POSIX path of (choose file with prompt "Select a color token file")'
              );
              const name = file.replace(/\/+$/, "").split("/").pop();
              send(res, 200, { path: file, name });
            } catch {
              send(res, 409, { cancelled: true });
            }
            return;
          }

          if (req.method === "POST" && url === "/api/design-worktree/inspect") {
            const body = await readJsonBody(req);
            if (!body.path || typeof body.path !== "string") {
              send(res, 400, { error: "Missing folder path." });
              return;
            }
            const found = await findDesignWorktree(body.path, {
              forbiddenRoots: [PLAYGROUND_ROOT],
            });
            send(res, 200, found);
            return;
          }

          if (req.method === "POST" && url === "/api/design-worktree") {
            const body = await readJsonBody(req);
            if (!body.path || typeof body.path !== "string") {
              send(res, 400, { error: "Missing folder path." });
              return;
            }
            const worktree = await ensureDesignWorktree(body.path, {
              forbiddenRoots: [PLAYGROUND_ROOT],
            });
            send(res, 200, worktree);
            return;
          }

          if (req.method === "GET" && url === "/api/load") {
            const data = await loadPlayground();
            send(res, 200, data);
            return;
          }

          if (req.method === "POST" && url === "/api/save") {
            const body = await readJsonBody(req);
            if (!Array.isArray(body.projects)) {
              send(res, 400, { error: "projects must be an array." });
              return;
            }
            const result = await savePlayground(body);
            send(res, 200, result);
            return;
          }

          if (req.method === "POST" && url === "/api/dev-server/status") {
            const body = await readJsonBody(req);
            send(res, 200, await devServerStatus(body.previewUrl));
            return;
          }

          if (req.method === "POST" && url === "/api/dev-server/stop") {
            const body = await readJsonBody(req);
            send(res, 200, await stopDevServer(body.previewUrl));
            return;
          }

          if (req.method === "POST" && url === "/api/dev-server/start") {
            const body = await readJsonBody(req);
            if (!body.localPath || typeof body.localPath !== "string") {
              send(res, 400, {
                error: "Attach a local folder to start the dev server.",
              });
              return;
            }
            const result = await startDevServer({
              localPath: body.localPath,
              previewUrl: body.previewUrl,
              logDir: path.join(DATA_ROOT, "dev-logs"),
            });
            send(res, 200, result);
            return;
          }

          if (req.method === "POST" && url === "/api/bible-find") {
            const body = await readJsonBody(req);
            if (!body.localPath || typeof body.localPath !== "string") {
              send(res, 400, { error: "A local folder is required." });
              return;
            }
            const root = path.resolve(body.localPath);
            if (isInside(PLAYGROUND_ROOT, root)) {
              send(res, 400, { error: "That folder is the playground itself." });
              return;
            }
            const stat = await fs.stat(root).catch(() => null);
            if (!stat?.isDirectory()) {
              send(res, 400, { error: "That path is not a folder." });
              return;
            }
            send(res, 200, await findBiblePresence(root));
            return;
          }

          if (req.method === "POST" && url === "/api/bible-bootstrap") {
            const body = await readJsonBody(req);
            if (!body.localPath || typeof body.localPath !== "string") {
              send(res, 400, { error: "A local folder is required." });
              return;
            }
            const root = path.resolve(body.localPath);
            if (isInside(PLAYGROUND_ROOT, root)) {
              send(res, 400, { error: "That folder is the playground itself." });
              return;
            }
            const result = await bootstrapBible(root, {
              source: body.source,
              name: body.name,
              uploadPath: body.uploadPath,
              designMd: body.designMd,
              tokensCss: body.tokensCss,
              componentsMd: body.componentsMd,
              existing: body.existing,
            });
            send(res, 200, result);
            return;
          }

          if (req.method === "POST" && url === "/api/bible-status") {
            const body = await readJsonBody(req);
            if (!body.localPath || typeof body.localPath !== "string") {
              send(res, 400, {
                error: "A local folder is required to scan the bible.",
              });
              return;
            }
            const root = path.resolve(body.localPath);
            const stat = await fs.stat(root).catch(() => null);
            if (!stat?.isDirectory()) {
              send(res, 400, { error: "That path is not a folder." });
              return;
            }
            const paths = resolvedBiblePaths(body);
            send(res, 200, await scanBible(root, body, paths));
            return;
          }

          if (req.method === "POST" && url === "/api/bible-integrate") {
            const body = await readJsonBody(req);
            if (!body.localPath || typeof body.localPath !== "string") {
              send(res, 400, {
                error: "A local folder is required to integrate.",
              });
              return;
            }
            const root = path.resolve(body.localPath);
            const stat = await fs.stat(root).catch(() => null);
            if (!stat?.isDirectory()) {
              send(res, 400, { error: "That path is not a folder." });
              return;
            }
            const paths = resolvedBiblePaths(body);
            const tokens = body.colorsByTheme || { light: {}, dark: {} };
            const cssPath = assertInside(root, path.join(root, paths.tokensCss));
            const mdPath = assertInside(root, path.join(root, paths.designMd));
            const claudePath = assertInside(
              root,
              path.join(root, paths.claudeMd)
            );
            await writeFileAtomic(cssPath, generateTokensCss(tokens));
            await writeFileAtomic(
              mdPath,
              generateBibleMd(
                {
                  name: body.name,
                  componentLibrary: body.componentLibrary,
                  tokenFile: body.tokenFile,
                },
                tokens,
                paths
              )
            );
            const existingClaude = await fs
              .readFile(claudePath, "utf8")
              .catch(() => "");
            if (!/^## Design\b/m.test(existingClaude)) {
              const next = `${existingClaude.trimEnd()}\n\n${claudeDesignSection(paths)}`;
              await writeFileAtomic(
                claudePath,
                next.endsWith("\n") ? next : `${next}\n`
              );
            }
            send(res, 200, {
              wrote: {
                tokensCss: paths.tokensCss,
                designMd: paths.designMd,
                claudeMd: /^## Design\b/m.test(existingClaude)
                  ? null
                  : paths.claudeMd,
              },
              ...(await scanBible(root, body, paths)),
            });
            return;
          }

          if (req.method === "POST" && url === "/api/read-tokens") {
            const body = await readJsonBody(req);
            if (body.file && typeof body.file === "string") {
              const file = path.resolve(body.file);
              const themes = await themesFromFile(file);
              if (!themes) {
                send(res, 200, {
                  empty: true,
                  path: file,
                  themes: { light: {}, dark: {} },
                  colors: {},
                });
                return;
              }
              send(res, 200, {
                empty: false,
                path: file,
                themes,
                colors: themes.dark,
              });
              return;
            }

            const root = body.path;
            if (!root || typeof root !== "string") {
              send(res, 400, { error: "Missing folder path." });
              return;
            }
            const rootResolved = path.resolve(root);
            const stat = await fs.stat(rootResolved).catch(() => null);
            if (!stat?.isDirectory()) {
              send(res, 400, { error: "That path is not a folder." });
              return;
            }

            const priority = TOKEN_PATHS.map((rel) =>
              path.join(rootResolved, rel)
            );
            const walked = await walkTokenFiles(rootResolved);
            const seen = new Set();
            const files = [];
            for (const file of [...priority, ...walked]) {
              const key = path.resolve(file);
              if (seen.has(key)) continue;
              seen.add(key);
              files.push(key);
            }

            for (const file of files) {
              try {
                assertInside(rootResolved, file);
              } catch {
                continue;
              }
              const themes = await themesFromFile(file);
              if (!themes) continue;
              send(res, 200, {
                empty: false,
                path: relativeTo(rootResolved, file),
                themes,
                colors: themes.dark,
              });
              return;
            }

            send(res, 200, {
              empty: true,
              path: null,
              themes: { light: {}, dark: {} },
              colors: {},
            });
            return;
          }

          next();
        } catch (error) {
          send(res, 500, { error: error.message || "Server error." });
        }
      });
    },
  };
}
