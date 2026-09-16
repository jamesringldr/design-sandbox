// Libraries → Font: pick Google Fonts families and weights for the UI,
// Display, and Mono roles. Previews repaint live; Save stores them on the project.
import { useEffect, useRef, useState } from "react";
import {
  FONT_CATEGORIES,
  FONT_ROLES,
  fontsCssUrl,
  fontStack,
  pickWeights,
  syncFontLink,
} from "../fonts.js";

const SAMPLE = {
  ui: "Request removal · 14 brokers",
  display: "Removals in progress",
  mono: "4F82-A1 · 128/214",
};

function RoleFont({ role, font, onChange }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(role.id === "mono" ? "Monospace" : "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, category, limit: "12" });
        const res = await fetch(`/api/fonts?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Font search failed.");
        setResults(data.fonts);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [open, query, category]);

  // Load just the letters of each result's name so results preview in their own face.
  useEffect(() => {
    const letters = [...new Set(results.map((row) => row.family).join(""))].join("");
    const url = results.length
      ? fontsCssUrl(
          Object.fromEntries(results.map((row) => [row.family, { family: row.family, weights: [] }])),
          `&text=${encodeURIComponent(letters)}`
        )
      : "";
    syncFontLink(`results-${role.id}`, open ? url : "");
  }, [results, open, role.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(row) {
    onChange({
      family: row.family,
      category: row.category,
      available: row.weights,
      weights: pickWeights(row.weights, role),
    });
    setOpen(false);
    setQuery("");
  }

  function toggleWeight(weight) {
    const has = font.weights.includes(weight);
    if (has && font.weights.length === 1) return;
    const weights = has
      ? font.weights.filter((value) => value !== weight)
      : [...font.weights, weight].sort((a, b) => a - b);
    onChange({ ...font, weights });
  }

  return (
    <section className="cw-group">
      <div className="cw-group-head">
        <span className="eyebrow">{role.label}</span>
        <span className="cw-name ft-token">--{role.token}</span>
      </div>
      <div className="cw-row">
        <div
          className="ft-sample"
          style={{
            fontFamily: font ? fontStack(font) : undefined,
            fontWeight: font ? Math.max(...font.weights) : undefined,
          }}
        >
          {SAMPLE[role.id]}
        </div>
        <div className="cw-row-top">
          <span className="ft-family">
            {font ? font.family : "Default"}
            <span className="sc-use">{font ? ` · ${font.category}` : ` · ${role.use}`}</span>
          </span>
          {font ? (
            <button
              type="button"
              className="viz-icon cw-remove"
              aria-label={`Clear ${role.label} font`}
              title="Use the default"
              onClick={() => onChange(null)}
            >
              ×
            </button>
          ) : null}
        </div>
        {font ? (
          <div className="ft-weights" role="group" aria-label={`${role.label} weights`}>
            {font.available.map((weight) => (
              <button
                key={weight}
                type="button"
                className={`ft-weight${font.weights.includes(weight) ? " on" : ""}`}
                aria-pressed={font.weights.includes(weight)}
                onClick={() => toggleWeight(weight)}
              >
                {weight}
              </button>
            ))}
          </div>
        ) : null}
        <div className="ft-search" ref={boxRef}>
          <div className="ft-search-row">
            <input
              className="input cw-hex"
              aria-label={`Search Google Fonts for ${role.label}`}
              placeholder="Search Google Fonts"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
                if (event.key === "Enter" && results[0]) choose(results[0]);
              }}
            />
            <select
              className="input ft-category"
              aria-label={`${role.label} font category`}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setOpen(true);
              }}
            >
              <option value="">All</option>
              {FONT_CATEGORIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {open ? (
            <div className="ft-results" role="listbox" aria-label={`${role.label} font results`}>
              {error ? <p className="cw-add-hint error">{error}</p> : null}
              {!error && results.length === 0 ? <p className="cw-add-hint">No matches.</p> : null}
              {results.map((row) => (
                <button
                  key={row.family}
                  type="button"
                  role="option"
                  aria-selected={font?.family === row.family}
                  className="ft-result"
                  onClick={() => choose(row)}
                >
                  <span style={{ fontFamily: `"${row.family}", ${row.category === "Monospace" ? "monospace" : "sans-serif"}` }}>
                    {row.family}
                  </span>
                  <span className="sc-use">{row.category}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function FontEditor({ fonts, dirty, onChange, onSave }) {
  return (
    <div className="cw ft">
      <div className="cw-toolbar">
        <button
          type="button"
          className="viz-icon cw-tool"
          aria-label="Save fonts"
          disabled={!dirty}
          onClick={onSave}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3.4h8l2 2v7.2H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M5.2 3.4v3.2h5.2V3.4" stroke="currentColor" strokeWidth="2" />
            <path d="M5.2 12.6v-3h5.6v3" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <span className="cw-status">{dirty ? "Unsaved" : ""}</span>
      </div>
      <p className="sc-hint ft-intro">Font — Google Fonts, loaded live into LoFi and AppShots.</p>
      {FONT_ROLES.map((role) => (
        <RoleFont
          key={role.id}
          role={role}
          font={fonts[role.id]}
          onChange={(font) => onChange({ ...fonts, [role.id]: font })}
        />
      ))}
    </div>
  );
}
