import { useEffect, useRef, useState } from "react";
import { parseGithubUrl } from "../github.js";
import { bootstrapBible, findBible } from "../repo.js";
import { defaultTokenLocks, EMPTY_ELEMENT_LOCKS } from "../tokens.js";
import DesignBibleField from "./DesignBibleField.jsx";
import RepoSource from "./RepoSource.jsx";

const EMPTY_THEMES = { light: {}, dark: {} };

export default function NewProjectModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [repoKind, setRepoKind] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [worktreeBranch, setWorktreeBranch] = useState("");
  const [worktreeBase, setWorktreeBase] = useState("");
  const [bibleSource, setBibleSource] = useState("");
  const [bibleDisplay, setBibleDisplay] = useState("");
  const [biblePaths, setBiblePaths] = useState(null);
  const [uploadPath, setUploadPath] = useState("");
  const [tokenFile, setTokenFile] = useState("");
  const [bibleError, setBibleError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [elementLocks] = useState({ ...EMPTY_ELEMENT_LOCKS });
  const pollId = useRef(0);

  const worktreeReady = Boolean(
    repoKind === "device" && localPath && worktreeBranch
  );
  const bibleReady = ["found", "upload", "template"].includes(bibleSource);
  const canSave = Boolean(name.trim() && worktreeReady && bibleReady && !saving);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pollBible(folder) {
    const id = ++pollId.current;
    setBusy(true);
    setBibleError("");
    try {
      const found = await findBible(folder);
      if (id !== pollId.current) return;
      if (found.found) {
        setBibleSource("found");
        setBibleDisplay(found.designMd);
        setBiblePaths(found);
        setTokenFile(found.tokensCss || found.designMd);
        return;
      }
      setBibleSource("");
      setBibleDisplay("");
      setBiblePaths(found);
      setTokenFile("");
    } catch (error) {
      if (id !== pollId.current) return;
      setBibleError(error.message);
      setBibleSource("");
      setBibleDisplay("");
    } finally {
      if (id === pollId.current) setBusy(false);
    }
  }

  function onRepoChange({
    kind,
    githubUrl: url,
    localPath: folder,
    sourcePath: source,
    worktreeBranch: branch,
    worktreeBase: base,
  }) {
    setRepoKind(kind);
    setGithubUrl(url);
    setLocalPath(folder);
    setSourcePath(source || "");
    setWorktreeBranch(branch || "");
    setWorktreeBase(base || "");
    if (kind === "github") {
      const parsed = parseGithubUrl(url);
      if (parsed && !name.trim()) setName(parsed.repo);
    }
    if (kind === "device" && folder && branch) {
      pollBible(folder);
      return;
    }
    setBibleSource("");
    setBibleDisplay("");
    setBiblePaths(null);
    setUploadPath("");
    setTokenFile("");
    setBibleError("");
  }

  function onFolderName(folderName) {
    if (!name.trim()) setName(folderName);
  }

  function onUpload(filePath) {
    setBibleSource("upload");
    setUploadPath(filePath);
    setBibleDisplay(filePath);
    setBibleError("");
  }

  function onTemplate() {
    setBibleSource("template");
    setUploadPath("");
    setBibleDisplay("Playground template");
    setBibleError("");
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setBibleError("");
    try {
      const result = await bootstrapBible({
        localPath,
        name: name.trim(),
        source: bibleSource,
        uploadPath,
        designMd: biblePaths?.designMd,
        tokensCss: biblePaths?.tokensCss,
        componentsMd: biblePaths?.componentsMd,
      });
      onSave({
        name: name.trim(),
        repoKind: "device",
        githubUrl: githubUrl.trim(),
        localPath: localPath.trim(),
        sourcePath: sourcePath.trim(),
        worktreeBranch,
        worktreeBase,
        tokenFile: result.tokensCss || result.designMd || tokenFile,
        tokenSource: result.tokensCss || result.designMd || tokenFile || null,
        colorsByTheme: EMPTY_THEMES,
        colors: {},
        theme: "dark",
        tokenLocks: defaultTokenLocks({}),
        elementLocks,
        bible: {
          designMd: result.designMd || result.paths?.designMd || "docs/DESIGN.md",
          tokensCss:
            result.tokensCss || result.paths?.tokensCss || "src/styles/tokens.css",
          componentsMd:
            result.componentsMd ||
            result.paths?.componentsMd ||
            "docs/COMPONENTS.md",
          claudeMd: result.paths?.claudeMd || "CLAUDE.md",
        },
      });
    } catch (error) {
      setBibleError(error.message);
      setSaving(false);
    }
  }

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
            sourcePath={sourcePath}
            worktreeBranch={worktreeBranch}
            worktreeBase={worktreeBase}
            onChange={onRepoChange}
            onFolderName={onFolderName}
          />

          {worktreeReady ? (
            <DesignBibleField
              display={bibleDisplay}
              source={bibleSource}
              error={bibleError}
              busy={busy}
              onUpload={onUpload}
              onTemplate={onTemplate}
            />
          ) : (
            <p className="muted">
              Choose Device to pick a local repo. If it has no playground
              worktree, you can create one, then upload a bible or add the
              playground template.
            </p>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={!canSave}
          >
            {saving ? "Saving…" : "Save project"}
          </button>
        </div>
      </div>
    </div>
  );
}
