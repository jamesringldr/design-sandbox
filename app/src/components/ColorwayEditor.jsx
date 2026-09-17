import { useEffect, useRef, useState } from "react";
import { colorToHex, normalizeHex, opaqueHex } from "../colorMath.js";
import {
  brandPaletteLabel,
  COLORWAY_SECTIONS,
  COLORWAY_TOKENS,
  isTokenLocked,
  shuffleAll,
  shuffleOne,
} from "../colorShuffle.js";
import { toCssVar } from "../tokens.js";
import LockIcon from "./LockIcon.jsx";

function UndoIcon({ size = 14, stroke = 1.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6.5H10.2a3.3 3.3 0 1 1 0 6.6H8"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M6.2 4.2 3.6 6.5l2.6 2.3"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShuffleIcon({ size = 14, stroke = 1.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5h2.4l7.2 7h1.4M2.5 11.5h2.4l1.6-1.6"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12.2 3.4 1.8 1.1-1.8 1.1M12.2 10.4l1.8 1.1-1.8 1.1"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon({ size = 14, stroke = 1.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.4 3.4h7.2L12.6 5.4v7.2H3.4V3.4Z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path d="M5.2 3.4v3.2h5.2V3.4" stroke="currentColor" strokeWidth={stroke} />
      <path d="M5.2 12.6v-3h5.6v3" stroke="currentColor" strokeWidth={stroke} />
    </svg>
  );
}

const TOOL_ICON = { size: 18, stroke: 2 };

function sameColors(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function ColorwayEditor({
  theme,
  colors,
  saved,
  locks,
  onChange,
  onToggleLock,
  onSave,
  saving,
  saveError,
  brandColors = [],
}) {
  const historyRef = useRef({ dark: [], light: [] });
  const prevRef = useRef({ dark: {}, light: {} });
  const [typed, setTyped] = useState({});
  const [canUndo, setCanUndo] = useState(false);
  const dirty = !sameColors(colors, saved);
  const rows = [
    ...COLORWAY_TOKENS,
    ...brandColors.map((color, index) => ({
      ...color,
      label: brandPaletteLabel(index),
      section: "branding",
      palette: true,
    })),
  ];

  useEffect(() => {
    setTyped({});
    setCanUndo((historyRef.current[theme] || []).length > 0);
  }, [theme]);

  function commit(next) {
    const changed = [];
    for (const row of rows) {
      if ((next[row.id] || "") !== (colors[row.id] || "")) changed.push(row.id);
    }
    if (!changed.length) return;
    const stack = historyRef.current[theme] || [];
    stack.push({ ...colors });
    if (stack.length > 30) stack.shift();
    historyRef.current[theme] = stack;
    const prev = { ...(prevRef.current[theme] || {}) };
    for (const key of changed) prev[key] = colors[key];
    prevRef.current[theme] = prev;
    setCanUndo(true);
    onChange(next);
  }

  function undoAll() {
    const stack = historyRef.current[theme] || [];
    const previous = stack.pop();
    if (!previous) return;
    setCanUndo(stack.length > 0);
    setTyped({});
    onChange(previous);
  }

  function undoOne(id) {
    const previous = prevRef.current[theme]?.[id];
    if (!previous || previous === colors[id]) return;
    const next = { ...colors, [id]: previous };
    if (id === "brand") next.brandPrimary = previous;
    if (id === "brandHover") next.brandSecondary = previous;
    const prev = { ...(prevRef.current[theme] || {}) };
    delete prev[id];
    prevRef.current[theme] = prev;
    setTyped((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
    onChange(next);
  }

  function setHex(id, raw) {
    setTyped((current) => ({ ...current, [id]: raw }));
    const hex = normalizeHex(raw);
    if (!hex || hex === colors[id]) return;
    const next = { ...colors, [id]: hex };
    if (id === "brand") next.brandPrimary = hex;
    if (id === "brandHover") next.brandSecondary = hex;
    commit(next);
  }

  function renderPaletteRow(row) {
    const value = colorToHex(colors[row.id]) || colors[row.id] || "";
    const locked = isTokenLocked(locks, row.id);
    return (
      <div className="cw-row" key={row.id}>
        <div className="cw-row-top">
          <span className="cw-swatch cw-swatch-static" title={value}>
            <span style={{ background: value || "transparent" }} />
          </span>
          <span className="cw-name" title={toCssVar(row.id)}>
            {row.label}
          </span>
          <button
            type="button"
            className={`lock${locked ? " on" : ""}`}
            aria-pressed={locked}
            aria-label={`${locked ? "Unlock" : "Lock"} ${row.label}`}
            onClick={() => onToggleLock(row.id)}
          >
            <LockIcon locked={locked} />
          </button>
        </div>
        <div
          className="cw-row-edit cw-palette-pick"
          role="group"
          aria-label={`Pick ${row.label} from the Brand Palette`}
        >
          {brandColors.map((swatch, index) => {
            const swatchLabel = brandPaletteLabel(index);
            const swatchHex = colorToHex(colors[swatch.id]) || colors[swatch.id] || "";
            const selected = Boolean(swatchHex) && swatchHex === value;
            return (
              <button
                key={swatch.id}
                type="button"
                className={`cw-palette-swatch${selected ? " on" : ""}`}
                style={{ background: swatchHex || "transparent" }}
                disabled={!swatchHex}
                title={swatchLabel}
                aria-label={`Set ${row.label} to ${swatchLabel}`}
                onClick={() => setHex(row.id, swatchHex)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  function renderRow(row) {
    if (row.pickFromPalette) return renderPaletteRow(row);
    const value = colorToHex(colors[row.id]) || colors[row.id] || "";
    const locked = isTokenLocked(locks, row.id);
    const field = typed[row.id] ?? value;
    const previous = prevRef.current[theme]?.[row.id];
    return (
      <div className="cw-row" key={row.id}>
        <div className="cw-row-top">
          <label className="cw-swatch" title={value}>
            <input
              type="color"
              aria-label={`${row.label} swatch`}
              value={opaqueHex(value)}
              onChange={(event) => setHex(row.id, event.target.value)}
            />
            <span style={{ background: value || "transparent" }} />
          </label>
          <span className="cw-name" title={toCssVar(row.id)}>
            {row.label}
          </span>
          <button
            type="button"
            className={`lock${locked ? " on" : ""}`}
            aria-pressed={locked}
            aria-label={`${locked ? "Unlock" : "Lock"} ${row.label}`}
            onClick={() => onToggleLock(row.id)}
          >
            <LockIcon locked={locked} />
          </button>
        </div>
        <div className="cw-row-edit">
          <input
            className="input input-mono cw-hex"
            aria-label={`${row.label} hex`}
            spellCheck={false}
            autoComplete="off"
            value={field}
            onChange={(event) => setHex(row.id, event.target.value)}
            onBlur={() =>
              setTyped((current) => {
                if (!(row.id in current)) return current;
                const copy = { ...current };
                delete copy[row.id];
                return copy;
              })
            }
          />
          <button
            type="button"
            className="viz-icon"
            aria-label={`Shuffle ${row.label}`}
            onClick={() => commit(shuffleOne(colors, row.id, theme))}
          >
            <ShuffleIcon />
          </button>
          <button
            type="button"
            className="viz-icon"
            aria-label={`Undo ${row.label}`}
            disabled={!previous || previous === value}
            onClick={() => undoOne(row.id)}
          >
            <UndoIcon />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cw">
      <div className="cw-toolbar">
        <button
          type="button"
          className="viz-icon cw-tool"
          aria-label="Undo color changes"
          disabled={!canUndo}
          onClick={undoAll}
        >
          <UndoIcon {...TOOL_ICON} />
        </button>
        <button
          type="button"
          className="viz-icon cw-tool"
          aria-label="Shuffle unlocked colors"
          onClick={() =>
            commit(
              shuffleAll(colors, locks, theme, brandColors.map((color) => color.id))
            )
          }
        >
          <ShuffleIcon {...TOOL_ICON} />
        </button>
        <button
          type="button"
          className="viz-icon cw-tool"
          aria-label="Save colors to the design bible"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          <SaveIcon {...TOOL_ICON} />
        </button>
        <span className={`cw-status${saveError ? " error" : ""}`}>
          {saving ? "Saving…" : saveError ? saveError : dirty ? "Unsaved" : ""}
        </span>
      </div>

      {COLORWAY_SECTIONS.map((section) => {
        const sectionRows = rows.filter((row) => row.section === section.id);
        return (
          <section className="cw-group" key={section.id}>
            <div className="cw-group-head">
              <span className="eyebrow">{section.label}</span>
            </div>
            <div className="cw-list">{sectionRows.map(renderRow)}</div>
          </section>
        );
      })}
    </div>
  );
}
