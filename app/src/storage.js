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
  };
}

export function loadState() {
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

export function saveState(state) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      projects: state.projects,
      activeId: state.activeId,
    })
  );
}

export function createProject(draft) {
  return normalizeProject({
    id: crypto.randomUUID(),
    name: draft.name.trim(),
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
