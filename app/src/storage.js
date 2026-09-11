import { assignSlugs, slugify } from "./projectFiles.js";
import { STARTER_THEMES } from "./tokens.js";

const KEY = "design-playground.v1";

export function normalizeProject(project) {
  const theme = project.theme === "light" ? "light" : "dark";
  const colorsByTheme = {
    dark: project.colorsByTheme?.dark || project.colors || STARTER_THEMES.dark,
    light: project.colorsByTheme?.light || STARTER_THEMES.light,
  };
  return {
    ...project,
    slug: project.slug || slugify(project.name),
    githubUrl: project.githubUrl || "",
    localPath: project.localPath || "",
    repoKind:
      project.repoKind ||
      (project.localPath && !project.githubUrl ? "device" : "github"),
    tokenFile: project.tokenFile || project.tokenSource || "",
    tokenSource: project.tokenFile || project.tokenSource || null,
    colorsByTheme,
    theme,
    colors: colorsByTheme[theme],
    componentLibrary: project.componentLibrary || "",
    tokenLocks: project.tokenLocks || {},
    elementLocks: project.elementLocks || {},
    artifacts: project.artifacts || [],
    routes: project.routes || [],
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { projects: [], activeId: null };
    const data = JSON.parse(raw);
    return {
      projects: Array.isArray(data.projects)
        ? data.projects.map(normalizeProject)
        : [],
      activeId: data.activeId ?? null,
    };
  } catch {
    return { projects: [], activeId: null };
  }
}

function dropLocal() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export async function loadState() {
  try {
    const res = await fetch("/api/load");
    if (res.ok) {
      const data = await res.json();
      const projects = Array.isArray(data.projects)
        ? data.projects.map(normalizeProject)
        : [];
      if (projects.length > 0) {
        dropLocal();
        return { projects, activeId: data.activeId ?? projects[0].id };
      }
      const local = loadLocal();
      if (local.projects.length > 0) return { ...local, migrated: true };
      return { projects: [], activeId: data.activeId ?? null };
    }
  } catch {
    /* fall through to localStorage */
  }
  return loadLocal();
}

export async function saveState(state) {
  const projects = assignSlugs(state.projects.map(normalizeProject));
  const res = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projects,
      activeId: state.activeId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Save failed.");
  }
  dropLocal();
  return { projects };
}

export function createProject(draft) {
  return normalizeProject({
    id: crypto.randomUUID(),
    name: draft.name.trim(),
    slug: slugify(draft.name),
    repoKind: draft.repoKind || "github",
    githubUrl: (draft.githubUrl || "").trim(),
    localPath: (draft.localPath || "").trim(),
    tokenFile: draft.tokenFile || draft.tokenSource || "",
    tokenSource: draft.tokenFile || draft.tokenSource || null,
    colorsByTheme: draft.colorsByTheme,
    colors: draft.colors,
    theme: draft.theme || "dark",
    tokenLocks: draft.tokenLocks || {},
    elementLocks: draft.elementLocks || {},
    componentLibrary: draft.componentLibrary || "",
    artifacts: [],
    routes: [],
  });
}
