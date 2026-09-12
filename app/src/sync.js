import { parseGithubUrl, syncGithubFile, syncGithubTokens } from "./github.js";
import { syncLocalFile, syncLocalTokens } from "./repo.js";

function resolveLocalTokenFile(localPath, tokenFile) {
  const file = String(tokenFile || "").trim();
  if (!file) return "";
  if (file.startsWith("/")) return file;
  const root = String(localPath || "").trim();
  if (!root) return file;
  return `${root.replace(/\/+$/, "")}/${file.replace(/^\/+/, "")}`;
}

export async function discoverTokens({ kind, localPath, githubUrl, tokenFile }) {
  if (tokenFile) {
    if (kind === "github" && parseGithubUrl(githubUrl) && !tokenFile.startsWith("/")) {
      return syncGithubFile(githubUrl, tokenFile);
    }
    return syncLocalFile(resolveLocalTokenFile(localPath, tokenFile));
  }
  if (kind === "device") {
    if (!localPath) throw new Error("Choose a local folder first.");
    return syncLocalTokens(localPath);
  }
  if (kind === "github") {
    if (!parseGithubUrl(githubUrl)) throw new Error("Enter a valid GitHub repo URL.");
    return syncGithubTokens(githubUrl);
  }
  throw new Error("Choose Device or GitHub first.");
}
