import { useState } from "react";
import { pickLocalFolder } from "../repo.js";

export default function RepoSource({
  kind,
  githubUrl,
  localPath,
  onChange,
  onFolderName,
  inputId = "project-github",
}) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");

  async function chooseDevice() {
    onChange({ kind: "device", githubUrl, localPath });
    setPicking(true);
    setError("");
    try {
      const result = await pickLocalFolder();
      if (!result) return;
      onChange({ kind: "device", githubUrl, localPath: result.path });
      if (onFolderName && result.name) onFolderName(result.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setPicking(false);
    }
  }

  function chooseGithub() {
    onChange({ kind: "github", githubUrl, localPath });
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
          {picking ? "Selecting…" : "Device"}
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
            onChange({ kind: "github", githubUrl: event.target.value, localPath })
          }
        />
      ) : (
        <div className="path-row">
          <div className="path-display">
            {localPath || (picking ? "Choose a folder…" : "No folder selected")}
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
      {error ? <p className="status err">{error}</p> : null}
    </div>
  );
}
