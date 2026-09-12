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
  };
  return {
    paths,
    files: {
      [paths.designMd]: generateBibleMd(named, tokens, paths),
      [paths.tokensCss]: generateTokensCss(tokens),
      [paths.componentsMd]: generateComponentsMd(named),
    },
  };
}
