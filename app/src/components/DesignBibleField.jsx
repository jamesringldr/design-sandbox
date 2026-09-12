import { useState } from "react";
import { pickLocalFile } from "../repo.js";

export default function DesignBibleField({
  display,
  source,
  error,
  busy,
  onUpload,
  onTemplate,
}) {
  const [picking, setPicking] = useState(false);

  async function upload() {
    setPicking(true);
    try {
      const result = await pickLocalFile();
      if (!result) return;
      onUpload(result.path);
    } finally {
      setPicking(false);
    }
  }

  const label =
    display ||
    (source === "template"
      ? "Playground template"
      : picking
        ? "Choose a file…"
        : "No design bible found");

  return (
    <div className="field">
      <label>Design Bible</label>
      <div className="path-row">
        <div className="path-display">{busy ? "Looking for a design bible…" : label}</div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={picking || busy}
          onClick={upload}
        >
          {picking ? "Selecting…" : "Upload"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={picking || busy}
          onClick={onTemplate}
        >
          + Template
        </button>
      </div>
      {error ? <p className="status err">{error}</p> : null}
    </div>
  );
}
