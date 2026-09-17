import { useEffect, useState } from "react";
import { colorToHex, normalizeHex, opaqueHex, rand, rgbString } from "../colorMath.js";
import {
  brandPaletteLabel,
  newBrandHex,
  normalizeBrandPalette,
  renumberBrandPalette,
} from "../colorShuffle.js";

// Full Brand Palette management for Project Settings: add, remove, and edit
// swatch hex values. Names are purely positional ("Primary 1", "Primary 2", …
// — see renumberBrandPalette), so add/remove never needs a name from the
// user; deleting an earlier swatch just shifts the rest up, name included.
// Saving here only writes to the project's own session state (same as every
// other field on this page) — it does not touch the design bible. That only
// happens from the Design Bible tab's own commit.
export default function BrandPaletteField({ project, onUpdate }) {
  const theme = project.theme === "light" ? "light" : "dark";
  const brandColors = normalizeBrandPalette(project.brandColors);
  const saved = project.colorsByTheme?.[theme] || {};
  const [draft, setDraft] = useState(saved);
  // Raw in-progress text per swatch, shown in the input while typing so a
  // partial value (e.g. "#14a") never gets silently expanded mid-keystroke
  // by normalizeHex's 3-digit shorthand rule — only a *complete* hex commits
  // into `draft`. Cleared on blur, same pattern as ColorwayEditor's `typed`.
  const [typed, setTyped] = useState({});

  useEffect(() => {
    setDraft(project.colorsByTheme?.[theme] || {});
    setTyped({});
  }, [project.id, theme]);

  const dirty = brandColors.some(
    (color) => (draft[color.id] || "") !== (saved[color.id] || "")
  );

  function setHex(id, raw) {
    setTyped((current) => ({ ...current, [id]: raw }));
    const hex = normalizeHex(raw);
    if (hex) setDraft((current) => ({ ...current, [id]: hex }));
  }

  function clearTyped(id) {
    setTyped((current) => {
      if (!(id in current)) return current;
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
  }

  function save() {
    const next = { ...saved };
    for (const color of brandColors) {
      const hex = normalizeHex(draft[color.id]);
      if (hex) next[color.id] = hex;
    }
    onUpdate({
      ...project,
      colorsByTheme: { ...project.colorsByTheme, [theme]: next },
      colors: next,
    });
  }

  function addColor() {
    const hue = rand(0, 360);
    const withNewSlot = [...brandColors, { id: "__new__", label: "" }];
    const { brandColors: renumbered, colorsByTheme } = renumberBrandPalette(
      withNewSlot,
      project.colorsByTheme
    );
    const added = renumbered[renumbered.length - 1];
    onUpdate({
      ...project,
      brandColors: renumbered,
      colorsByTheme: {
        dark: { ...colorsByTheme.dark, [added.id]: newBrandHex("dark", hue) },
        light: { ...colorsByTheme.light, [added.id]: newBrandHex("light", hue) },
      },
    });
  }

  function removeColor(id) {
    const { brandColors: renumbered, colorsByTheme } = renumberBrandPalette(
      brandColors.filter((color) => color.id !== id),
      project.colorsByTheme
    );
    onUpdate({ ...project, brandColors: renumbered, colorsByTheme });
  }

  return (
    <div className="field">
      <label>Brand Palette</label>
      <p className="muted">
        Add, remove, and set the hex for each swatch — names are just
        position ("Primary 1" is always whichever swatch is first). Save here
        writes to the project session — it does not touch the design bible
        until you commit from the Design Bible tab.
      </p>
      <div className="brand-palette-row">
        {brandColors.map((color, index) => {
          const label = brandPaletteLabel(index);
          const value = colorToHex(draft[color.id]) || draft[color.id] || "";
          const field = typed[color.id] ?? value;
          return (
            <div className="brand-palette-item" key={color.id}>
              <label className="brand-palette-swatch-input" title={label}>
                <input
                  type="color"
                  aria-label={`${label} swatch`}
                  value={opaqueHex(value)}
                  onChange={(event) => setHex(color.id, event.target.value)}
                />
                <span
                  className="brand-palette-swatch"
                  style={{ background: value || "transparent" }}
                />
              </label>
              <span className="core-controls">{label}</span>
              <code>{value || "—"}</code>
              <code>{rgbString(value) || "—"}</code>
              <div className="row">
                <input
                  className="input input-mono cw-hex"
                  aria-label={`${label} hex`}
                  spellCheck={false}
                  autoComplete="off"
                  value={field}
                  onChange={(event) => setHex(color.id, event.target.value)}
                  onBlur={() => clearTyped(color.id)}
                />
                <button
                  type="button"
                  className="viz-icon"
                  aria-label={`Remove ${label}`}
                  title={`Remove ${label}`}
                  onClick={() => removeColor(color.id)}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="row">
        <button type="button" className="btn btn-secondary" onClick={addColor}>
          Add color
        </button>
      </div>
      <div className="row">
        <button type="button" className="btn btn-primary" disabled={!dirty} onClick={save}>
          Save
        </button>
        <span className="muted">{dirty ? "Unsaved" : "Saved"}</span>
      </div>
    </div>
  );
}
