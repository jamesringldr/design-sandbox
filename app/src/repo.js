export async function pickLocalFolder() {
  const res = await fetch("/api/select-folder");
  if (res.status === 409) return null;
  if (res.status === 501) {
    throw new Error("Folder picker is macOS only for now.");
  }
  if (!res.ok) throw new Error("Could not open the folder picker.");
  return res.json();
}

export async function pickLocalFile() {
  const res = await fetch("/api/select-file");
  if (res.status === 409) return null;
  if (res.status === 501) {
    throw new Error("File picker is macOS only for now.");
  }
  if (!res.ok) throw new Error("Could not open the file picker.");
  return res.json();
}

export async function syncLocalTokens(folderPath) {
  const res = await fetch("/api/read-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: folderPath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not read tokens from that folder.");
  }
  return data;
}

export async function inspectDesignWorktree(folderPath) {
  const res = await fetch("/api/design-worktree/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: folderPath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not inspect that repo for a design worktree.");
  }
  return data;
}

export async function findBible(localPath) {
  const res = await fetch("/api/bible-find", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ localPath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not look for a design bible.");
  }
  return data;
}

export async function bootstrapBible(payload) {
  const res = await fetch("/api/bible-bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not save the design bible to the worktree.");
  }
  return data;
}

export async function ensureDesignWorktree(folderPath) {
  const res = await fetch("/api/design-worktree", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: folderPath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not open a design worktree for that repo.");
  }
  return data;
}

export async function syncLocalFile(filePath) {
  const res = await fetch("/api/read-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: filePath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not read that token file.");
  }
  return data;
}
