import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
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
import { extractThemes, themesEmpty } from "./src/tokens.js";

const execFileAsync = promisify(execFile);
const DATA_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data"
);
const ROUTES = new Set([
  "/api/select-folder",
  "/api/select-file",
  "/api/read-tokens",
  "/api/load",
  "/api/save",
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
    projects.push({
      ...meta,
      slug,
      colorsByTheme: tokens || { light: {}, dark: {} },
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
