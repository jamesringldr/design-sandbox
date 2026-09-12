import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { normalizePreviewOrigin } from "./previewUrl.js";

const execFileAsync = promisify(execFile);

const started = new Map();

async function readJson(file) {
  const text = await fs.readFile(file, "utf8").catch(() => null);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function exists(file) {
  return Boolean(await fs.stat(file).catch(() => null));
}

function originCandidates(origin) {
  const url = normalizePreviewOrigin(origin);
  if (!url) return [];
  const parsed = new URL(url);
  const hosts =
    parsed.hostname === "127.0.0.1"
      ? ["127.0.0.1", "localhost"]
      : parsed.hostname === "localhost"
        ? ["localhost", "127.0.0.1"]
        : [parsed.hostname];
  return hosts.map(
    (host) => `${parsed.protocol}//${host}${parsed.port ? `:${parsed.port}` : ""}`
  );
}

export function portFromOrigin(origin) {
  try {
    const url = new URL(normalizePreviewOrigin(origin) || "http://localhost:5173");
    return url.port || (url.protocol === "https:" ? "443" : "80");
  } catch {
    return "5173";
  }
}

function withPort(result, origin) {
  return { ...result, origin, port: portFromOrigin(origin) };
}

async function pidsOnPort(port) {
  try {
    const { stdout } = await execFileAsync("lsof", [
      `-tiTCP:${port}`,
      "-sTCP:LISTEN",
    ]);
    return stdout
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => Number(id))
      .filter((id) => id > 0);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    /* already gone */
  }
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    /* no group */
  }
}

export async function pingOrigin(origin) {
  for (const url of originCandidates(origin)) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    try {
      const res = await fetch(url, { signal: ctrl.signal, redirect: "manual" });
      if (res.status > 0) return true;
    } catch {
      /* try next host */
    } finally {
      clearTimeout(timer);
    }
  }
  return false;
}

export async function detectDevCommand(root) {
  const appDir = path.join(root, "apps", "app");
  const appPkg = await readJson(path.join(appDir, "package.json"));
  const rootPkg = await readJson(path.join(root, "package.json"));
  const cwd =
    appPkg?.scripts?.dev && (await exists(appDir)) ? appDir : root;
  const pkg = cwd === appDir ? appPkg : rootPkg;
  if (!pkg?.scripts?.dev) {
    throw new Error("No dev script found in package.json.");
  }
  const pnpm =
    (await exists(path.join(root, "pnpm-lock.yaml"))) ||
    String(rootPkg?.packageManager || "").startsWith("pnpm");
  const yarn = await exists(path.join(root, "yarn.lock"));
  const command = pnpm ? "pnpm dev" : yarn ? "yarn dev" : "npm run dev";
  return { cwd, command };
}

export async function startDevServer({ localPath, previewUrl, logDir }) {
  const root = path.resolve(localPath);
  const stat = await fs.stat(root).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error("That path is not a folder.");
  }
  const origin = normalizePreviewOrigin(previewUrl) || "http://localhost:5173";
  if (await pingOrigin(origin)) {
    return withPort({ state: "running", command: null }, origin);
  }
  const existing = started.get(origin);
  if (existing?.pid) {
    return withPort(
      {
        state: "starting",
        command: existing.command,
        pid: existing.pid,
      },
      origin
    );
  }
  const { cwd, command } = await detectDevCommand(root);
  await fs.mkdir(logDir, { recursive: true });
  const logFile = path.join(logDir, `${origin.replace(/[^\w.-]+/g, "_")}.log`);
  const log = await fs.open(logFile, "a");
  const child = spawn("/bin/zsh", ["-lc", command], {
    cwd,
    detached: true,
    stdio: ["ignore", log.fd, log.fd],
    env: process.env,
  });
  child.unref();
  started.set(origin, { pid: child.pid, command, cwd, logFile });
  child.on("exit", () => {
    log.close().catch(() => {});
    const current = started.get(origin);
    if (current?.pid === child.pid) started.delete(origin);
  });
  return withPort(
    {
      state: "starting",
      command,
      cwd,
      pid: child.pid,
      logFile,
    },
    origin
  );
}

export async function stopDevServer(previewUrl) {
  const origin = normalizePreviewOrigin(previewUrl) || "http://localhost:5173";
  const port = portFromOrigin(origin);
  for (const key of originCandidates(origin)) {
    const tracked = started.get(key);
    if (tracked?.pid) killPid(tracked.pid);
    started.delete(key);
  }
  const listeners = await pidsOnPort(port);
  for (const pid of listeners) killPid(pid);
  await new Promise((resolve) => setTimeout(resolve, 400));
  const leftover = await pidsOnPort(port);
  for (const pid of leftover) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* gone */
    }
  }
  return withPort({ state: "stopped" }, origin);
}

export async function devServerStatus(previewUrl) {
  const origin = normalizePreviewOrigin(previewUrl) || "http://localhost:5173";
  if (await pingOrigin(origin)) {
    return withPort({ state: "running" }, origin);
  }
  const current = started.get(origin);
  if (current?.pid) {
    return withPort(
      { state: "starting", command: current.command },
      origin
    );
  }
  return withPort({ state: "stopped" }, origin);
}
