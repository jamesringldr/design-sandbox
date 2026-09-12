import { useEffect, useState } from "react";
import { defaultBiblePaths } from "../bible.js";
import ConfirmModal from "./ConfirmModal.jsx";

const STATE_LABEL = {
  ok: "Ready",
  filled: "Ready",
  missing: "Missing",
  stub: "Stub",
  partial: "Partial",
  mismatch: "Mismatch",
  skipped: "N/A",
  not_run: "Not run",
};

function bibleBody(project) {
  const paths = defaultBiblePaths(project);
  return {
    localPath: project.localPath,
    tokenFile: project.tokenFile || "",
    name: project.name,
    componentLibrary: project.componentLibrary || "",
    colorsByTheme: project.colorsByTheme,
    bible: paths,
  };
}

export default function BiblePanel({ project, onUpdate }) {
  const paths = defaultBiblePaths(project);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [designOpen, setDesignOpen] = useState(true);
  const canScan = Boolean(project.localPath);

  function patchPaths(partial) {
    onUpdate({
      ...project,
      bible: { ...paths, ...partial },
    });
  }

  useEffect(() => {
    if (!canScan) {
      setStatus(null);
      setError("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/bible-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bibleBody(project)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Scan failed.");
        setStatus(data);
        setError("");
      } catch (err) {
        setError(err.message);
        setStatus(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    canScan,
    project.localPath,
    project.tokenFile,
    paths.designMd,
    paths.tokensCss,
    paths.componentsMd,
    paths.claudeMd,
    project.colorsByTheme,
  ]);

  async function integrate() {
    setBusy(true);
    setConfirming(false);
    try {
      const res = await fetch("/api/bible-integrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bibleBody(project)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Integrate failed.");
      setStatus(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div>
        <div className="eyebrow">Design bible</div>
        <h2 style={{ margin: "6px 0 0", fontSize: "22px", letterSpacing: "-0.02em" }}>
          {project.name}
        </h2>
        <p className="muted">
          Playbook files in the connected repo. §0–§11 are required; §12 Bespoke
          Effects is optional. Integrate writes DESIGN.md and tokens.css — it will
          not touch theme.css.
        </p>
      </div>

      <div className="panel">

      {!canScan ? (
        <p className="muted">
          Attach a local folder to scan and integrate. GitHub-only projects cannot
          receive files yet.
        </p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="bible-design">DESIGN.md path</label>
            <input
              id="bible-design"
              className="input input-mono"
              value={paths.designMd}
              onChange={(event) => patchPaths({ designMd: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="bible-tokens">tokens.css path</label>
            <input
              id="bible-tokens"
              className="input input-mono"
              value={paths.tokensCss}
              onChange={(event) => patchPaths({ tokensCss: event.target.value })}
            />
          </div>
        </>
      )}

      {error ? <p className="save-status error">{error}</p> : null}

      {status ? (
        <>
          <p className="muted">
            {status.done}/{status.total} ready
          </p>
          <div className="bible-list">
            {status.items.map((item) =>
              item.id === "designMd" && status.sections?.length ? (
                <details
                  key={item.id}
                  className="bible-expand"
                  open={designOpen}
                  onToggle={(event) => setDesignOpen(event.currentTarget.open)}
                >
                  <summary className="bible-row">
                    <div>
                      <div className="bible-name">{item.label}</div>
                      <div className="muted">{item.detail}</div>
                    </div>
                    <span className={`bible-state ${item.state}`}>
                      {STATE_LABEL[item.state] || item.state}
                    </span>
                  </summary>
                  <div className="bible-section-list">
                    {status.sections.map((section) => (
                      <div className="bible-row bible-row-section" key={section.id}>
                        <div>
                          <div className="bible-name">
                            §{section.id} {section.title}
                            {section.optional ? (
                              <span className="bible-optional">optional</span>
                            ) : null}
                          </div>
                          {section.note ? (
                            <div className="muted">{section.note}</div>
                          ) : null}
                        </div>
                        <span className={`bible-state ${section.state}`}>
                          {STATE_LABEL[section.state] || section.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <div className="bible-row" key={item.id}>
                  <div>
                    <div className="bible-name">{item.label}</div>
                    <div className="muted">{item.detail}</div>
                  </div>
                  <span className={`bible-state ${item.state}`}>
                    {STATE_LABEL[item.state] || item.state}
                  </span>
                </div>
              )
            )}
          </div>
        </>
      ) : null}

        <div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canScan || busy}
            onClick={() => setConfirming(true)}
          >
            {busy ? "Writing…" : "Integrate into project"}
          </button>
        </div>
      </div>

      {confirming ? (
        <ConfirmModal
          title="Integrate design bible"
          body={`Write ${paths.designMd} and ${paths.tokensCss} into ${project.name}. Existing copies of those two files will be replaced. theme.css is not touched. CLAUDE.md gets a Design section only if it is missing.`}
          confirmLabel="Write files"
          onCancel={() => setConfirming(false)}
          onConfirm={integrate}
        />
      ) : null}
    </div>
  );
}
