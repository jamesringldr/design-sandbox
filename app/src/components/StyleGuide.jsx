import { useEffect, useRef } from "react";
import { resolveCoreColors } from "../bibleLanguage.js";
import { applyColors, themeColors } from "../tokens.js";

const TYPE_ROWS = [
  { role: "display", spec: "30 · 600 · -0.03em", sample: "Removals in progress", style: { fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05 } },
  { role: "title", spec: "22 · 600 · -0.02em", sample: "Data broker coverage", style: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 } },
  { role: "heading", spec: "15 · 600", sample: "Pending verification", style: { fontSize: 15, fontWeight: 600, lineHeight: 1.3 } },
  { role: "body", spec: "14 · 400 · 1.6", sample: "Plex Sans carries the interface. Open apertures keep dense tables legible at small sizes.", style: { fontSize: 14, lineHeight: 1.6, maxWidth: 560 } },
  { role: "caption", spec: "12 · 400 · muted", sample: "Last checked 4 hours ago", style: { fontSize: 12, color: "var(--text-muted)" } },
  { role: "label", spec: "mono 10 · 0.14em · caps", sample: "Record ID · 4F82-A1", style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" } },
  { role: "data", spec: "mono 13 · 500", sample: "128 / 214 removed · 59.8%", style: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500 } },
  { role: "terminal", spec: "Grotesk 13 · lowercase", sample: "removal request accepted — broker: spokeo", style: { fontFamily: "'Space Grotesk', monospace", fontSize: 13, color: "var(--success)", textTransform: "lowercase" } },
];

function SectionHead({ n, title }) {
  return (
    <div className="guide-head">
      <div className="eyebrow">
        {n} — {title}
      </div>
      <div className="guide-rule" />
    </div>
  );
}

function StatusChip({ tone, children }) {
  return (
    <span className={`guide-chip guide-chip-${tone}`}>{children}</span>
  );
}

export default function StyleGuide({ project, onUpdate }) {
  const rootRef = useRef(null);
  const theme = project.theme === "light" ? "light" : "dark";
  const colors = themeColors(project);
  const coreRows = resolveCoreColors(colors);

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

  return (
    <div className="page">
      <div className="guide-intro">
        <div>
          <div className="eyebrow">Style guide</div>
          <h2 className="guide-title">{project.name}</h2>
          <p className="muted">
            {project.tokenFile
              ? `Live specimen from ${project.tokenFile}. Type, chips, and controls follow the mapped tokens.`
              : "No token file yet. Add one in Project Settings to drive this specimen."}
          </p>
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

      <div ref={rootRef} className="preview-root guide">
        <section className="guide-section">
          <SectionHead n="01" title="Core Colors" />
          <div className="core-table">
            <div className="core-row core-head">
              <span />
              <span>Seed token</span>
              <span>What it controls</span>
            </div>
            {coreRows.map((row) => (
              <div className="core-row" key={row.id}>
                <span
                  className="swatch"
                  style={{ background: row.value || "transparent" }}
                />
                <code>{row.css}</code>
                <span className="core-controls">{row.controls}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="02" title="Type" />
          <div className="type-list">
            {TYPE_ROWS.map((row) => (
              <div className="type-row" key={row.role}>
                <div className="type-spec">{row.role} / {row.spec}</div>
                <div style={row.style}>{row.sample}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="03" title="Status chips" />
          <div className="guide-chip-row">
            <StatusChip tone="success">Completed</StatusChip>
            <StatusChip tone="brand">In progress</StatusChip>
            <StatusChip tone="warning">Needs review</StatusChip>
            <StatusChip tone="destructive">Failed</StatusChip>
            <StatusChip tone="muted">Queued</StatusChip>
          </div>
          <p className="guide-note">
            Outline only, 1px border at 35% of the status hue, 4px radius, sentence case.
            Filled chips are reserved for counts in navigation, not for state.
          </p>
        </section>

        <section className="guide-section">
          <SectionHead n="04" title="Controls" />
          <div className="guide-controls">
            <button type="button" className="sg-btn sg-btn-primary">Request removal</button>
            <button type="button" className="sg-btn sg-btn-secondary">Cancel</button>
            <button type="button" className="sg-btn sg-btn-outline">Export CSV</button>
            <button type="button" className="sg-btn sg-btn-destructive">Delete account</button>
            <button type="button" className="sg-btn sg-btn-link">View log</button>
            <button type="button" className="sg-btn sg-btn-disabled" disabled>Disabled</button>
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="05" title="Applied" />
          <div className="applied-grid">
            <div className="applied-panel">
              <div className="applied-panel-head">
                <div>
                  <div className="applied-title">Removal queue</div>
                  <div className="type-spec">214 brokers monitored</div>
                </div>
                <span className="sg-btn sg-btn-link">View all</span>
              </div>
              <div className="applied-row">
                <div>
                  <div className="applied-name">Spokeo</div>
                  <div className="applied-meta">4F82-A1 · opted out 2h ago</div>
                </div>
                <StatusChip tone="success">Completed</StatusChip>
              </div>
              <div className="applied-row">
                <div>
                  <div className="applied-name">WhitePages</div>
                  <div className="applied-meta">4F82-A2 · awaiting confirmation</div>
                </div>
                <StatusChip tone="brand">In progress</StatusChip>
              </div>
              <div className="applied-row last">
                <div>
                  <div className="applied-name">PeopleFinders</div>
                  <div className="applied-meta">4F82-A3 · identity check required</div>
                </div>
                <StatusChip tone="warning">Needs review</StatusChip>
              </div>
            </div>

            <div className="applied-stream">
              <div className="applied-stream-head">
                <span className="stream-dot" />
                <span className="type-spec">Activity stream</span>
              </div>
              <div className="stream-lines">
                <div className="stream-muted">scan started — 214 brokers</div>
                <div className="stream-brand">match found — spokeo, whitepages, peoplefinders</div>
                <div className="stream-success">removal request accepted — spokeo</div>
                <div className="stream-warning">identity check required — peoplefinders</div>
                <div className="stream-danger">request rejected — radaris (retry in 24h)</div>
                <div className="stream-muted">next scan queued — 04:00 utc</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
