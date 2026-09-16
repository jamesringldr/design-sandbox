// Spacing and Elevation/Borders/Radius panels. Both edit one scales object
// (see scales.js) with undo and save, like the Colorway panel.
import { useRef, useState } from "react";
import LockIcon from "./LockIcon.jsx";
import {
  RADIUS_STEPS,
  rebaseSpace,
  SHADOW_STEPS,
  SPACE_STEPS,
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

export function SpacingEditor({ scales, dirty, locks, onChange, onToggleLock, onSave }) {
  const history = useHistory(scales, onChange);
  return (
    <div className="cw">
      <Toolbar label="spacing" history={history} dirty={dirty} onSave={onSave} />
      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Base unit</span>
        </div>
        <div className="sc-row">
          <input
            className="sc-range"
            type="range"
            aria-label="Base unit slider"
            min="2"
            max="8"
            step="0.5"
            value={scales.spaceBase}
            onChange={(event) => history.commit(rebaseSpace(scales, Number(event.target.value), locks))}
          />
          <NumberField
            label="Base unit"
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
          <span className="eyebrow">Scale</span>
        </div>
        <div className="cw-list">
          {SPACE_STEPS.map((step) => {
            const locked = Boolean(locks[step.id]);
            return (
              <div className="cw-row" key={step.id}>
                <div className="cw-row-top">
                  <span className="sc-bar" style={{ width: Math.min(scales.space[step.id], 64) }} />
                  <span className="cw-name" title={step.use}>--{step.id}</span>
                  <button
                    type="button"
                    className={`lock${locked ? " on" : ""}`}
                    aria-pressed={locked}
                    aria-label={`${locked ? "Unlock" : "Lock"} ${step.id}`}
                    onClick={() => onToggleLock(step.id)}
                  >
                    <LockIcon locked={locked} />
                  </button>
                </div>
                <div className="cw-row-edit">
                  <NumberField
                    label={`${step.id} value`}
                    value={scales.space[step.id]}
                    max={256}
                    step={0.5}
                    onChange={(value) =>
                      history.commit({ ...scales, space: { ...scales.space, [step.id]: value } })
                    }
                  />
                  <span className="sc-use">{step.use}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function ShapeEditor({ scales, dirty, onChange, onSave }) {
  const history = useHistory(scales, onChange);
  const setShadow = (id, key, value) =>
    history.commit({
      ...scales,
      shadows: { ...scales.shadows, [id]: { ...scales.shadows[id], [key]: value } },
    });

  return (
    <div className="cw">
      <Toolbar label="elevation, borders, and radius" history={history} dirty={dirty} onSave={onSave} />

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Radius</span>
        </div>
        <div className="cw-list">
          {RADIUS_STEPS.map((step) => (
            <div className="cw-row" key={step.id}>
              <div className="cw-row-top">
                <span className="sc-radius" style={{ borderRadius: Math.min(scales.radius[step.id], 12) }} />
                <span className="cw-name" title={step.use}>--{step.id}</span>
              </div>
              <div className="cw-row-edit">
                <NumberField
                  label={`${step.id} value`}
                  value={scales.radius[step.id]}
                  onChange={(value) =>
                    history.commit({ ...scales, radius: { ...scales.radius, [step.id]: value } })
                  }
                />
                <span className="sc-use">{step.use}</span>
              </div>
            </div>
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

      <section className="cw-group">
        <div className="cw-group-head">
          <span className="eyebrow">Elevation</span>
        </div>
        <div className="cw-list">
          {SHADOW_STEPS.map((step) => {
            const shadow = scales.shadows[step.id];
            return (
              <div className="cw-row" key={step.id}>
                <div className="cw-row-top">
                  <span className="sc-shadow" style={{ boxShadow: shadowValue(shadow) }} />
                  <span className="cw-name" title={step.use}>--{step.id}</span>
                </div>
                <div className="sc-shadow-fields">
                  <span>Y</span>
                  <NumberField label={`${step.id} offset`} value={shadow.y} max={64} unit="" onChange={(v) => setShadow(step.id, "y", v)} />
                  <span>Blur</span>
                  <NumberField label={`${step.id} blur`} value={shadow.blur} max={128} unit="" onChange={(v) => setShadow(step.id, "blur", v)} />
                  <span>Alpha</span>
                  <NumberField label={`${step.id} opacity`} value={shadow.alpha} max={1} step={0.05} unit="" onChange={(v) => setShadow(step.id, "alpha", v)} />
                </div>
                <span className="sc-use">{step.use}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
