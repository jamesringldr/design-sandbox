export const TOKEN_PATHS = [
  "tokens.json",
  "tokens.css",
  "theme.css",
  "theme.json",
  "design.md",
  "colors.css",
  "colors.json",
  "variables.css",
  "src/tokens.css",
  "src/tokens.json",
  "src/theme.css",
  "src/index.css",
  "src/app.css",
  "src/app/globals.css",
  "app/globals.css",
  "app/globals.scss",
  "styles/globals.css",
  "src/styles/globals.css",
  "src/styles/theme.css",
  "src/styles/tokens.css",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
  ".turbo",
  "out",
  "storybook-static",
  ".cache",
]);

export function shouldSkipDir(name) {
  return SKIP_DIRS.has(name) || name.startsWith(".");
}

export function isTokenCandidate(name) {
  const n = String(name).toLowerCase();
  if (!/\.(css|scss|json|md)$/.test(n)) return false;
  return (
    /token|theme|color|palette|variable|global|design/.test(n) ||
    n === "index.css" ||
    n === "app.css" ||
    n === "styles.css" ||
    n === "style.css"
  );
}
