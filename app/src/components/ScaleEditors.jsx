// Layout panel: spacing base + density, and radius/shadow style presets.
// One combined scales object (see scales.js) with undo and save, like the
// Colorway panel. Presets write concrete token values (so anything reading
// --radius-md etc. keeps working unchanged) and remember which preset is
// active so its tile/pill stays highlighted.
import { useRef, useState } from "react";
import {
  applyDensity,
  applyRadiusPreset,
  applyShadowPreset,
  DENSITY_OPTIONS,
  RADIUS_PRESETS,
  RADIUS_PRESET_OPTIONS,
  rebaseSpace,
  SHADOW_PRESETS,
  SHADOW_PRESET_OPTIONS,
  shadowValue,
} from "../scales.js";

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6.5H10.2a3.3 3.3 0 1 1 0 6.6H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.2 4.2 3.6 6.5l2.6 2.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3.4h8l2 2v7.2H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M5.2 3.4v3.2h5.2V3.4" stroke="currentColor" strokeWidth="2" />
      <path d="M5.2 12.6v-3h5.6v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function NumberField({ label, value, min = 0, max = 999, step = 1, unit = "px", onChange }) {
  return (
    <label className="sc-num">
      <input
        className="input input-mono"
        type="number"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (event.target.value !== "" && Number.isFinite(next)) {
            onChange(Math.min(max, Math.max(min, next)));
          }
        }}
      />
      {unit ? <span>{unit}</span> : null}
    </label>
  );
}

function useHistory(scales, onChange) {
  const stack = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  return {
    canUndo,
    commit(next) {
      if (JSON.stringify(next) === JSON.stringify(scales)) return;
      stack.current.push(scales);
      if (stack.current.length > 30) stack.current.shift();
      setCanUndo(true);
      onChange(next);
    },
    undo() {
      const previous = stack.current.pop();
      setCanUndo(stack.current.length > 0);
      if (previous) onChange(previous);
    },
  };
}

function Toolbar({ label, history, dirty, onSave }) {
  return (
    <div className="cw-toolbar">
      <button
        type="button"
        className="viz-icon cw-tool"
        aria-label={`Undo ${label} changes`}
        disabled={!history.canUndo}
        onClick={history.undo}
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        className="viz-icon cw-tool"
        aria-label={`Save ${label}`}
        disabled={!dirty}
        onClick={onSave}
      >
        <SaveIcon />
      </button>
      <span className="cw-status">{dirty ? "Unsaved" : ""}</span>
    </div>
  );
}

const RADIUS_LABELS = { sharp: "Sharp", subtle: "Subtle", rounded: "Rounded", pill: "Pill" };
const SHADOW_LABELS = { none: "None", soft: "Soft", balanced: "Balanced", sharp: "Sharp" };

export function LayoutEditor({ scales, dirty, locks, onChange, onSave }) {
  const history = useHistory(scales, onChange);

  return (
    <div className="cw">
      <Toolbar label="layout" history={history} dirty={dirty} onSave={onSave} />

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Spacing Base</span>
        </div>
        <div className="sc-row">
          <input
            className="sc-range"
            type="range"
            aria-label="Spacing base slider"
            min="2"
            max="8"
            step="0.5"
            value={scales.spaceBase}
            onChange={(event) => history.commit(rebaseSpace(scales, Number(event.target.value), locks))}
          />
          <NumberField
            label="Spacing base"
            value={scales.spaceBase}
            min={1}
            max={16}
            step={0.5}
            onChange={(base) => history.commit(rebaseSpace(scales, base, locks))}
          />
        </div>
        <p className="sc-hint">Unlocked steps follow the base (×1, 2, 3, 4, 6, 8, 12).</p>
      </section>

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Density</span>
        </div>
        <div className="seg" role="group" aria-label="Density">
          {DENSITY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={scales.density === option ? "on" : ""}
              aria-pressed={scales.density === option}
              onClick={() => history.commit(applyDensity(scales, option, locks))}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Radius</span>
        </div>
        <div className="sc-preset-grid">
          {RADIUS_PRESET_OPTIONS.map((preset) => {
            const sample = Math.min(RADIUS_PRESETS[preset]["radius-md"], 18);
            return (
              <button
                key={preset}
                type="button"
                className={`sc-preset-tile${scales.radiusStyle === preset ? " on" : ""}`}
                aria-pressed={scales.radiusStyle === preset}
                onClick={() => history.commit(applyRadiusPreset(scales, preset))}
              >
                <span className="sc-preset-preview" style={{ borderRadius: sample }} />
                {RADIUS_LABELS[preset]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Shadow</span>
        </div>
        <div className="sc-preset-grid">
          {SHADOW_PRESET_OPTIONS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`sc-preset-tile${scales.shadowStyle === preset ? " on" : ""}`}
              aria-pressed={scales.shadowStyle === preset}
              onClick={() => history.commit(applyShadowPreset(scales, preset))}
            >
              <span
                className="sc-preset-preview"
                style={{ boxShadow: shadowValue(SHADOW_PRESETS[preset]["shadow-2"]) }}
              />
              {SHADOW_LABELS[preset]}
            </button>
          ))}
        </div>
      </section>

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Borders</span>
        </div>
        <div className="cw-row">
          <div className="cw-row-top">
            <span className="sc-border" style={{ borderWidth: scales.borderWidth }} />
            <span className="cw-name">--border-width</span>
          </div>
          <div className="cw-row-edit">
            <NumberField
              label="border-width value"
              value={scales.borderWidth}
              max={8}
              step={0.5}
              onChange={(value) => history.commit({ ...scales, borderWidth: value })}
            />
            <span className="sc-use">Outlines, inputs, dividers</span>
          </div>
        </div>
      </section>
    </div>
  );
}
