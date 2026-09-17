import { resolveCoreColors } from "../bibleLanguage.js";
import { rgbString } from "../colorMath.js";
import { themeColors } from "../tokens.js";
import LockIcon from "./LockIcon.jsx";

export default function TokenGrid({ project, onThemeChange, onToggleLock }) {
  const theme = project.theme === "light" ? "light" : "dark";
  const colors = themeColors({ ...project, theme });
  const rows = resolveCoreColors(colors);

  return (
    <div className="field">
      <div className="token-head">
        <label>Core Colors</label>
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
      <div className="core-table compact">
        <div className="core-row core-head">
          <span />
          <span>Display Name</span>
          <span>Token Name</span>
          <span>Hex</span>
          <span>RGB</span>
          <span>What it controls</span>
          {onToggleLock ? <span /> : null}
        </div>
        {rows.map((row) => (
          <div className="core-row" key={row.id}>
            <span
              className="swatch"
              style={{ background: row.value || "transparent" }}
            />
            <span className="core-name">{row.label}</span>
            <code className="core-var">{row.css}</code>
            <code>{row.value || "—"}</code>
            <code>{rgbString(row.value) || "—"}</code>
            <span className="core-controls">{row.controls}</span>
            {onToggleLock ? (
              <button
                type="button"
                className={`lock ${project.tokenLocks?.[row.id] ? "on" : ""}`}
                aria-pressed={Boolean(project.tokenLocks?.[row.id])}
                aria-label={`${project.tokenLocks?.[row.id] ? "Unlock" : "Lock"} ${row.label}`}
                onClick={() => onToggleLock(row.id)}
              >
                <LockIcon locked={Boolean(project.tokenLocks?.[row.id])} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
