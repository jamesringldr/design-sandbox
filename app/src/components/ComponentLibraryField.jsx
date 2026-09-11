import { useState } from "react";

const PRESETS = ["shadcn", "boardui"];

export default function ComponentLibraryField({ value, onChange, id = "component-library" }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const options = [...new Set([...PRESETS, value].filter(Boolean))];

  function commitNew() {
    const name = draft.trim();
    if (!name) return;
    onChange(name);
    setDraft("");
    setAdding(false);
  }

  if (adding) {
    return (
      <div className="field">
        <label htmlFor={`${id}-new`}>Component library</label>
        <div className="row">
          <input
            id={`${id}-new`}
            className="input"
            autoFocus
            placeholder="Library name"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitNew();
              }
            }}
          />
          <button type="button" className="btn btn-primary" onClick={commitNew}>
            Add
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="field">
      <label htmlFor={id}>Component library</label>
      <select
        id={id}
        className="input"
        value={value || ""}
        onChange={(event) => {
          if (event.target.value === "__new__") setAdding(true);
          else onChange(event.target.value);
        }}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__new__">+ Add new</option>
      </select>
    </div>
  );
}
