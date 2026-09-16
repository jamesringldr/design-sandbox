import { generateBibleMd, defaultBiblePaths } from "./bible.js";
import { compactTheme, generateThemeCss } from "./themeExport.js";

export { compactTheme, generateThemeCss };

export function slugify(name) {
  const slug = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "project";
}

export function uniqueSlug(project, taken) {
  const existing = String(project.slug || "");
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(existing) && !taken.has(existing)) {
    return existing;
  }
  const base = slugify(project.name);
  if (!taken.has(base)) return base;
  const short = String(project.id || "")
    .replace(/-/g, "")
    .slice(0, 8);
  const withId = short ? `${base}-${short}` : base;
  if (!taken.has(withId)) return withId;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function assignSlugs(projects) {
  const taken = new Set();
  return projects.map((project) => {
    const slug = uniqueSlug(project, taken);
    taken.add(slug);
    return project.slug === slug ? project : { ...project, slug };
  });
}

export function generateDesignMd(project, tokens) {
  return generateBibleMd(project, tokens, defaultBiblePaths(project));
}

export function projectMeta(project, slug) {
  return {
    id: project.id,
    slug,
    name: project.name || "Untitled",
    repoKind: project.repoKind || "github",
    githubUrl: project.githubUrl || "",
    localPath: project.localPath || "",
    sourcePath: project.sourcePath || "",
    worktreeBranch: project.worktreeBranch || "",
    worktreeBase: project.worktreeBase || "",
    tokenFile: project.tokenFile || "",
    tokenSource: project.tokenFile || project.tokenSource || null,
    theme: project.theme === "light" ? "light" : "dark",
    componentLibrary: project.componentLibrary || "",
    tokenLocks: project.tokenLocks || {},
    brandColors: project.brandColors || [],
    tokenScales: project.tokenScales || null,
    elementLocks: project.elementLocks || {},
    artifacts: project.artifacts || [],
    routes: project.routes || [],
    previewUrl: project.previewUrl || "",
    bible: defaultBiblePaths(project),
  };
}
