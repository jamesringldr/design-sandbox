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
