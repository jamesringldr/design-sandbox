const raw = import.meta.glob("../candidates/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

function fileName(path) {
  return path.split("/").pop() ?? path;
}

export function listCandidates() {
  return Object.entries(raw)
    .filter(([path]) => !fileName(path).startsWith("_"))
    .map(([path, html]) => ({
      path,
      file: fileName(path),
      html,
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

export function candidateCount() {
  return listCandidates().length;
}
