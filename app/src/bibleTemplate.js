import {
  defaultBiblePaths,
  generateBibleMd,
  generateComponentsMd,
  generateTokensCss,
} from "./bible.js";

export function playgroundBibleTemplate(project) {
  const paths = defaultBiblePaths(project);
  const tokens = project.colorsByTheme || { light: {}, dark: {} };
  const named = {
    name: project.name || "Untitled",
    componentLibrary: project.componentLibrary || "unset",
    tokenFile: paths.tokensCss,
    brandColors: project.brandColors || [],
  };
  return {
    paths,
    files: {
      [paths.designMd]: generateBibleMd(
        named,
        tokens,
        paths,
        project.ingested || {}
      ),
      [paths.tokensCss]: generateTokensCss(tokens, named.brandColors),
      [paths.componentsMd]: generateComponentsMd(named),
    },
  };
}
