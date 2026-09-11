import {
  resolveDisplayColors,
  themeColors,
} from "../tokens.js";
import LockIcon from "./LockIcon.jsx";

export default function TokenGrid({ project, onThemeChange, onToggleLock }) {
  const theme = project.theme === "light" ? "light" : "dark";
  const colors = themeColors({ ...project, theme });
  const rows = resolveDisplayColors(colors);

  return (
    <div className="field">
      <div className="token-head">
        <label>Color tokens</label>
        <div className="seg" role="group" aria-label="Color mode">
          <button
            type="button"
            className={theme === "light" ? "on" : ""}
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
          >
            Light
          </button>
          <button
            type="button"
            className={theme === "dark" ? "on" : ""}
            aria-pressed={theme === "dark"}
            onClick={() => onThemeChange("dark")}
          >
            Dark
          </button>
        </div>
      </div>
      <div className="token-list">
        {rows.map((row) => (
          <div className="token-row" key={row.id}>
            <span
              className="swatch"
              style={{ background: row.value || "transparent" }}
            />
            <span className="name">{row.label}</span>
            {onToggleLock ? (
              <button
                type="button"
                className={`lock ${project.tokenLocks?.[row.key] ? "on" : ""}`}
                aria-pressed={Boolean(project.tokenLocks?.[row.key])}
                aria-label={`${project.tokenLocks?.[row.key] ? "Unlock" : "Lock"} ${row.label}`}
                onClick={() => onToggleLock(row.key)}
              >
                <LockIcon locked={Boolean(project.tokenLocks?.[row.key])} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
