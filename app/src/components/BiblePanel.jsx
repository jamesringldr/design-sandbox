import { useEffect, useState } from "react";
import { defaultBiblePaths } from "../bible.js";
import ConfirmModal from "./ConfirmModal.jsx";

const STATE_LABEL = {
  ok: "Ready",
  filled: "Ready",
  missing: "Un-Committed",
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
    iconLibrary: project.iconLibrary || "",
    colorsByTheme: project.colorsByTheme,
    brandColors: project.brandColors || [],
    fonts: project.fonts || null,
    tokenScales: project.tokenScales || null,
    bible: paths,
  };
}

export default function BiblePanel({ project, onUpdate }) {
  const paths = defaultBiblePaths(project);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [marking, setMarking] = useState("");
  const [designOpen, setDesignOpen] = useState(true);
  const [checkpointPreview, setCheckpointPreview] = useState(null);
  const [checkpointBusy, setCheckpointBusy] = useState(false);
  const [checkpointResult, setCheckpointResult] = useState(null);
  const [checkpointError, setCheckpointError] = useState("");
  const canScan = Boolean(project.localPath);
  const canCheckpoint = Boolean(project.slug);

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
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function mark(nextStatus) {
    setBusy(true);
    setMarking("");
    try {
      const res = await fetch("/api/bible-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bibleBody(project), status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the bible status.");
      setStatus(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openCheckpoint() {
    setCheckpointError("");
    setCheckpointResult(null);
    setCheckpointBusy(true);
    try {
      const res = await fetch("/api/bible-checkpoint-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: project.slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not check the design bible.");
      setCheckpointPreview(data);
    } catch (err) {
      setCheckpointError(err.message);
    } finally {
      setCheckpointBusy(false);
    }
  }

  async function runCheckpoint() {
    setCheckpointBusy(true);
    setCheckpointPreview(null);
    try {
      if (canScan) {
        const ok = await integrate();
        if (!ok) {
          setCheckpointError("Could not write into the project repo — checkpoint stopped before touching design-sandbox.");
          return;
        }
      }
      const res = await fetch("/api/bible-checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: project.slug, confirmBranch: checkpointPreview.branch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkpoint failed.");
      setCheckpointResult(data);
      setCheckpointError("");
    } catch (err) {
      setCheckpointError(err.message);
    } finally {
      setCheckpointBusy(false);
    }
  }

  const solidified = status?.manifest?.status === "solidified";
  const coreReady = ["manifest", "designMd", "tokensCss", "componentsMd"].every(
    (id) => status?.items.find((item) => item.id === id)?.state === "ok"
  );

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div className="eyebrow">Design bible</div>
          <h2 style={{ margin: "6px 0 0", fontSize: "22px", letterSpacing: "-0.02em" }}>
            {project.name}
          </h2>
          <p className="muted">
            Playbook files in the connected repo. 0–11 are required; 12 Effects is
            optional. Integrate writes DESIGN.md and tokens.css and logs the change
            in DESIGN-BIBLE.md — it will not touch theme.css.
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canCheckpoint || checkpointBusy}
            onClick={openCheckpoint}
            title={canCheckpoint ? "" : "This project has no slug yet — save it once in the Visualizer first."}
          >
            {checkpointBusy ? "Working…" : "Checkpoint & publish"}
          </button>
          {checkpointResult ? (
            <p className="muted" style={{ marginTop: "8px", maxWidth: "260px" }}>
              {checkpointResult.committed
                ? `Committed ${checkpointResult.sha} on ${checkpointResult.branch}${
                    checkpointResult.pushed ? ", pushed." : ` — push failed: ${checkpointResult.pushError}`
                  }`
                : checkpointResult.message}
            </p>
          ) : null}
          {checkpointError ? (
            <p className="save-status error" style={{ marginTop: "8px", maxWidth: "260px" }}>
              {checkpointError}
            </p>
          ) : null}
        </div>
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
                            {section.id} {section.title}
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
          </button>{" "}
          {status?.manifest ? (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy || (!solidified && !coreReady)}
              onClick={() => setMarking(solidified ? "draft" : "solidified")}
            >
              {solidified ? "Reopen as draft" : "Mark solidified"}
            </button>
          ) : null}
          {status?.manifest && !solidified && !coreReady ? (
            <p className="muted">
              Mark solidified unlocks when DESIGN.md, tokens.css, and COMPONENTS.md
              are all Ready.
            </p>
          ) : null}
        </div>
      </div>

      {confirming ? (
        <ConfirmModal
          title="Integrate design bible"
          body={`Write ${paths.designMd} and ${paths.tokensCss} into ${project.name}. Existing copies of those two files will be replaced. theme.css is not touched. CLAUDE.md gets a Design section only if it is missing. The change is logged in DESIGN-BIBLE.md.`}
          confirmLabel="Write files"
          onCancel={() => setConfirming(false)}
          onConfirm={integrate}
        />
      ) : null}

      {marking ? (
        <ConfirmModal
          title={marking === "solidified" ? "Mark bible solidified" : "Reopen bible as draft"}
          body={
            marking === "solidified"
              ? `Set DESIGN-BIBLE.md to solidified and log it. This records that the bible is settled; Integrate can still change it.`
              : `Set DESIGN-BIBLE.md back to draft so the bible can change again.`
          }
          confirmLabel={marking === "solidified" ? "Solidify" : "Reopen"}
          danger={false}
          onCancel={() => setMarking("")}
          onConfirm={() => mark(marking)}
        />
      ) : null}

      {checkpointPreview ? (
        <ConfirmModal
          title="Checkpoint & publish design bible"
          body={
            `${canScan ? `1. Write DESIGN.md and tokens.css into ${project.name}, same as Integrate into project. ` : ""}` +
            `${canScan ? "2. " : ""}Commit data/projects/${project.slug}/design.md and the regenerated docs/${project.slug}/ agent docs to design-sandbox on branch "${checkpointPreview.branch}", then push. ` +
            (checkpointPreview.changed
              ? `${checkpointPreview.tokenCount} tokens.`
              : "Nothing has changed since the last checkpoint, so the sandbox commit will be skipped.")
          }
          confirmLabel="Checkpoint & publish"
          danger={false}
          onCancel={() => setCheckpointPreview(null)}
          onConfirm={runCheckpoint}
        />
      ) : null}
    </div>
  );
}
