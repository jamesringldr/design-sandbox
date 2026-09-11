import { useEffect, useRef } from "react";
import {
  applyColors,
  isHex,
  resolveDisplayColors,
  themeColors,
} from "../tokens.js";

export default function StyleGuide({ project, onUpdate }) {
  const rootRef = useRef(null);
  const theme = project.theme === "light" ? "light" : "dark";
  const colors = themeColors(project);
  const rows = resolveDisplayColors(colors);
  const brand =
    colors.brand || colors.brandPrimary || colors.primary || "#14ABFE";
  const brandLocked = Boolean(
    project.tokenLocks?.brand ||
      project.tokenLocks?.brandPrimary ||
      project.elementLocks?.colors
  );

  useEffect(() => {
    applyColors(rootRef.current, colors);
  }, [colors]);

  function setTheme(next) {
    onUpdate({
      ...project,
      theme: next,
      colors: project.colorsByTheme?.[next] || colors,
    });
  }

  function setBrand(value) {
    if (brandLocked) return;
    const nextColors = { ...colors, brand: value, brandPrimary: value };
    onUpdate({
      ...project,
      colors: nextColors,
      colorsByTheme: {
        ...(project.colorsByTheme || {}),
        [theme]: nextColors,
      },
    });
  }

  return (
    <div className="page">
      <div>
        <div className="eyebrow">Style guide</div>
        <h2 style={{ margin: "6px 0 0", fontSize: "22px", letterSpacing: "-0.02em" }}>
          {project.name}
        </h2>
        <p className="muted">
          {project.tokenFile
            ? `Tokens from ${project.tokenFile}. Full guide comes next — this is the live preview.`
            : "No token file yet. Add one in Project Settings."}
        </p>
      </div>

      <div ref={rootRef} className="preview-root">
        <div className="token-head">
          <div className="eyebrow" style={{ color: "var(--text-muted, #A3A3A3)" }}>
            Colors
          </div>
          <div className="seg" role="group" aria-label="Color mode">
            <button
              type="button"
              className={theme === "light" ? "on" : ""}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={theme === "dark" ? "on" : ""}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </div>
        <div className="swatch-grid">
          {rows.map((row) => (
            <div className="swatch-card" key={row.id}>
              <div
                className="block"
                style={{ background: row.value || "transparent" }}
              />
              <div className="meta">{row.label}</div>
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{ color: "var(--text-muted, #A3A3A3)" }}>
          Controls
        </div>
        <div className="preview-actions">
          {!brandLocked && isHex(brand) ? (
            <input
              type="color"
              aria-label="Brand color"
              value={brand}
              onChange={(event) => setBrand(event.target.value.toUpperCase())}
              style={{
                width: 36,
                height: 36,
                padding: 0,
                border: "1px solid var(--border, rgba(255,255,255,0.18))",
                borderRadius: 6,
                background: "transparent",
              }}
            />
          ) : null}
          <button type="button" className="preview-btn">
            Request removal
          </button>
          <div className="preview-chip">In progress</div>
        </div>
      </div>
    </div>
  );
}
