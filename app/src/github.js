import { isTokenCandidate, TOKEN_PATHS } from "./tokenPaths.js";
import { extractThemes, themesEmpty } from "./tokens.js";

export function parseGithubUrl(input) {
  if (!input) return null;
  const match = input.trim().match(/github\.com[:/]([^/]+)\/([^/#?\s]+)/i);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, "");
  if (!owner || !repo) return null;
  return { owner, repo };
}

function decodeFile(data) {
  if (!data || data.encoding !== "base64" || !data.content) return null;
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), (char) =>
    char.charCodeAt(0)
  );
  return new TextDecoder().decode(bytes);
}

async function githubJson(apiPath) {
  const res = await fetch(`/github-api${apiPath}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return { ok: false, status: 404, data: null };
  if (!res.ok) {
    const err = new Error(
      res.status === 403
        ? "GitHub rate limit or the repo is private."
        : `GitHub request failed (${res.status}).`
    );
    err.status = res.status;
    throw err;
  }
  return { ok: true, status: res.status, data: await res.json() };
}

function emptyResult(repo, extra = {}) {
  return {
    empty: true,
    path: null,
    themes: { light: {}, dark: {} },
    colors: {},
    repo,
    ...extra,
  };
}

async function themesFromGithubPath(owner, repo, filePath) {
  const result = await githubJson(
    `/repos/${owner}/${repo}/contents/${encodeURI(filePath)}`
  );
  if (!result.ok || !result.data || Array.isArray(result.data)) return null;
  const text = decodeFile(result.data);
  if (!text) return null;
  const themes = extractThemes(text, filePath);
  if (themesEmpty(themes)) return null;
  return {
    empty: false,
    path: filePath,
    themes,
    colors: themes.dark,
    repo,
  };
}

export async function syncGithubFile(url, filePath) {
  const parsed = parseGithubUrl(url);
  if (!parsed) throw new Error("Enter a valid GitHub repo URL.");
  const found = await themesFromGithubPath(parsed.owner, parsed.repo, filePath);
  if (!found) return emptyResult(parsed.repo, { path: filePath });
  return found;
}

export async function syncGithubTokens(url) {
  const parsed = parseGithubUrl(url);
  if (!parsed) throw new Error("Enter a valid GitHub repo URL.");

  const repo = await githubJson(`/repos/${parsed.owner}/${parsed.repo}`);
  if (!repo.ok) {
    throw new Error("Repo not found or private. You can still add a token file.");
  }

  for (const filePath of TOKEN_PATHS) {
    try {
      const found = await themesFromGithubPath(
        parsed.owner,
        parsed.repo,
        filePath
      );
      if (found) return found;
    } catch (error) {
      if (error.status === 403) throw error;
    }
  }

  const branch = repo.data.default_branch || "main";
  const tree = await githubJson(
    `/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  );
  if (tree.ok && Array.isArray(tree.data?.tree)) {
    const candidates = tree.data.tree
      .filter((item) => item.type === "blob" && typeof item.path === "string")
      .map((item) => item.path)
      .filter((filePath) => isTokenCandidate(filePath.split("/").pop() || filePath))
      .slice(0, 40);
    for (const filePath of candidates) {
      const found = await themesFromGithubPath(
        parsed.owner,
        parsed.repo,
        filePath
      );
      if (found) return found;
    }
  }

  return emptyResult(parsed.repo);
}
