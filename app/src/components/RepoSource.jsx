import { useState } from "react";
import {
  ensureDesignWorktree,
  inspectDesignWorktree,
  pickLocalFolder,
} from "../repo.js";
import ConfirmModal from "./ConfirmModal.jsx";

export default function RepoSource({
  kind,
  githubUrl,
  localPath,
  sourcePath,
  worktreeBranch,
  worktreeBase,
  needsInstall: needsInstallProp = false,
  onChange,
  onFolderName,
  inputId = "project-github",
}) {
  const [picking, setPicking] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [needsInstall, setNeedsInstall] = useState(false);
  const [pendingCreate, setPendingCreate] = useState(null);

  function applyWorktree(worktree, folderName) {
    onChange({
      kind: "device",
      githubUrl,
      localPath: worktree.localPath,
      sourcePath: worktree.sourcePath,
      worktreeBranch: worktree.branch,
      worktreeBase: worktree.base,
    });
    if (onFolderName && folderName) onFolderName(folderName);
    setNeedsInstall(Boolean(worktree.needsInstall));
  }

  async function chooseDevice() {
    onChange({
      kind: "device",
      githubUrl,
      localPath,
      sourcePath,
      worktreeBranch,
      worktreeBase,
    });
    setPicking(true);
    setError("");
    setNeedsInstall(false);
    setStatus("");
    setPendingCreate(null);
    try {
      const result = await pickLocalFolder();
      if (!result) return;
      setStatus("Checking for a design worktree…");
      const found = await inspectDesignWorktree(result.path);
      if (found.exists) {
        applyWorktree(found, result.name);
        return;
      }
      setPendingCreate({
        path: result.path,
        name: result.name,
        suggestedPath: found.suggestedPath,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPicking(false);
      setStatus("");
    }
  }

  async function confirmCreate() {
    if (!pendingCreate) return;
    const pending = pendingCreate;
    setPendingCreate(null);
    setPicking(true);
    setError("");
    setStatus("Creating design worktree from staging…");
    try {
      const worktree = await ensureDesignWorktree(pending.path);
      applyWorktree(worktree, pending.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setPicking(false);
      setStatus("");
    }
  }

  function chooseGithub() {
    onChange({
      kind: "github",
      githubUrl,
      localPath,
      sourcePath,
      worktreeBranch,
      worktreeBase,
    });
  }

  return (
    <div className="field">
      <label>Repo</label>
      <div className="seg" role="group" aria-label="Repo source">
        <button
          type="button"
          className={kind === "device" ? "on" : ""}
          aria-pressed={kind === "device"}
          disabled={picking}
          onClick={chooseDevice}
        >
          {picking ? (status ? "Checking…" : "Selecting…") : "Device"}
        </button>
        <button
          type="button"
          className={kind === "github" ? "on" : ""}
          aria-pressed={kind === "github"}
          onClick={chooseGithub}
        >
          GitHub
        </button>
      </div>

      {kind === "github" ? (
        <input
          id={inputId}
          className="input input-mono"
          placeholder="https://github.com/org/repo"
          value={githubUrl}
          onChange={(event) =>
            onChange({
              kind: "github",
              githubUrl: event.target.value,
              localPath,
              sourcePath,
              worktreeBranch,
              worktreeBase,
            })
          }
        />
      ) : (
        <div className="path-row">
          <div className="path-display">
            {status ||
              localPath ||
              (picking ? "Choose a folder…" : "No folder selected")}
          </div>
          {localPath ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={picking}
              onClick={chooseDevice}
            >
              Change
            </button>
          ) : null}
        </div>
      )}
      {kind === "device" && worktreeBranch && localPath ? (
        <p className="path-note">
          Design worktree <code>{worktreeBranch}</code>
          {worktreeBase ? ` from ${worktreeBase}` : ""}.
          {sourcePath && sourcePath !== localPath
            ? ` Source checkout stays at ${sourcePath}.`
            : ""}
        </p>
      ) : kind === "device" && !localPath ? (
        <p className="path-note">
          Picking a folder checks for a design-playground worktree. If none
          exists, you can create one, then upload a bible or add the playground
          template.
        </p>
      ) : null}
      {needsInstall || needsInstallProp ? (
        <p className="path-note">
          This worktree still needs a package install before Live will boot.
        </p>
      ) : null}
      {error ? <p className="status err">{error}</p> : null}
      {pendingCreate ? (
        <ConfirmModal
          title="No Playground Worktree for this repo"
          body="Upload or Add Template"
          bodyClassName="confirm-prompt"
          confirmLabel="Yes"
          cancelLabel="Change Repo"
          danger={false}
          onCancel={() => {
            setPendingCreate(null);
            onChange({
              kind: "device",
              githubUrl,
              localPath: "",
              sourcePath: "",
              worktreeBranch: "",
              worktreeBase: "",
            });
          }}
          onConfirm={confirmCreate}
        />
      ) : null}
    </div>
  );
}
