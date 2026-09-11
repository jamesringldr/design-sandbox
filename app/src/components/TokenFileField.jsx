import { useState } from "react";
import { pickLocalFile } from "../repo.js";

export default function TokenFileField({ value, error, onPicked, pickingLabel }) {
  const [picking, setPicking] = useState(false);
  const hasFile = Boolean(value);

  async function choose() {
    setPicking(true);
    try {
      const result = await pickLocalFile();
      if (!result) return;
      onPicked(result.path);
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="field">
      <label>Color token file</label>
      <div className="path-row">
        <div className="path-display">
          {value || (picking ? "Choose a file…" : "No token file found")}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={picking}
          onClick={choose}
        >
          {picking ? pickingLabel || "Selecting…" : hasFile ? "Change" : "Add"}
        </button>
      </div>
      {error ? <p className="status err">{error}</p> : null}
    </div>
  );
}
