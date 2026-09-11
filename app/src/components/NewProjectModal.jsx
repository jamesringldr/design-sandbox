import { useEffect, useRef, useState } from "react";
import { parseGithubUrl } from "../github.js";
import { discoverTokens } from "../sync.js";
import {
  defaultTokenLocks,
  EMPTY_ELEMENT_LOCKS,
  STARTER_THEMES,
} from "../tokens.js";
import ComponentLibraryField from "./ComponentLibraryField.jsx";
import RepoSource from "./RepoSource.jsx";
import TokenFileField from "./TokenFileField.jsx";
import TokenGrid from "./TokenGrid.jsx";

const EMPTY_THEMES = { light: {}, dark: {} };

export default function NewProjectModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [repoKind, setRepoKind] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [tokenFile, setTokenFile] = useState("");
  const [colorsByTheme, setColorsByTheme] = useState(STARTER_THEMES);
  const [theme, setTheme] = useState("dark");
  const [tokenLocks, setTokenLocks] = useState(defaultTokenLocks(STARTER_THEMES.dark));
  const [elementLocks, setElementLocks] = useState({ ...EMPTY_ELEMENT_LOCKS });
  const [componentLibrary, setComponentLibrary] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [busy, setBusy] = useState(false);
  const discoverId = useRef(0);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function runDiscover(opts) {
    const id = ++discoverId.current;
    setBusy(true);
    setTokenError("");
    try {
      const result = await discoverTokens(opts);
      if (id !== discoverId.current) return;
      if (result.empty) {
        setTokenFile("");
        setColorsByTheme(EMPTY_THEMES);
        setTokenError("No color token file found. Add one, or save with empty tokens.");
        return;
      }
      setTokenFile(result.path || "");
      setColorsByTheme(result.themes);
      setTheme("dark");
      setTokenLocks(defaultTokenLocks(result.themes.dark || {}));
    } catch (error) {
      if (id !== discoverId.current) return;
      setTokenError(error.message);
    } finally {
      if (id === discoverId.current) setBusy(false);
    }
  }

  function onRepoChange({ kind, githubUrl: url, localPath: folder }) {
    setRepoKind(kind);
    setGithubUrl(url);
    setLocalPath(folder);
    if (kind === "github") {
      const parsed = parseGithubUrl(url);
      if (parsed && !name.trim()) setName(parsed.repo);
    }
    if (kind === "device" && folder) {
      setTokenFile("");
      runDiscover({ kind, localPath: folder, githubUrl: url, tokenFile: "" });
    }
  }

  function onFolderName(folderName) {
    if (!name.trim()) setName(folderName);
  }

  useEffect(() => {
    if (repoKind !== "github") return;
    if (!parseGithubUrl(githubUrl)) return;
    const timer = setTimeout(() => {
      setTokenFile("");
      runDiscover({
        kind: "github",
        githubUrl,
        localPath,
        tokenFile: "",
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [repoKind, githubUrl]);

  function onTokenFile(filePath) {
    setTokenFile(filePath);
    runDiscover({
      kind: repoKind,
      githubUrl,
      localPath,
      tokenFile: filePath,
    });
  }

  function save() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      repoKind: repoKind || "github",
      githubUrl: githubUrl.trim(),
      localPath: localPath.trim(),
      tokenFile,
      tokenSource: tokenFile || null,
      colorsByTheme,
      colors: colorsByTheme[theme] || colorsByTheme.dark,
      theme,
      tokenLocks,
      elementLocks,
      componentLibrary,
    });
  }

  const draft = {
    theme,
    colorsByTheme,
    colors: colorsByTheme[theme] || {},
    tokenLocks,
  };

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-labelledby="new-project-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="new-project-title">New project</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label htmlFor="project-name">Name</label>
            <input
              id="project-name"
              className="input"
              value={name}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <RepoSource
            kind={repoKind}
            githubUrl={githubUrl}
            localPath={localPath}
            onChange={onRepoChange}
            onFolderName={onFolderName}
          />

          {repoKind ? (
            <>
              <TokenFileField
                value={tokenFile}
                error={tokenError}
                onPicked={onTokenFile}
              />
              {busy ? <p className="muted">Looking for a color token file…</p> : null}
            </>
          ) : (
            <p className="muted">
              Choose Device to pick a local repo, or GitHub to paste a public repo URL.
              A token file is detected automatically.
            </p>
          )}

          <TokenGrid
            project={draft}
            onThemeChange={setTheme}
            onToggleLock={(key) =>
              setTokenLocks((current) => ({ ...current, [key]: !current[key] }))
            }
          />

          <ComponentLibraryField
            value={componentLibrary}
            onChange={setComponentLibrary}
          />
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={!name.trim()}
          >
            Save project
          </button>
        </div>
      </div>
    </div>
  );
}
