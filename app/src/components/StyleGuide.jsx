import { useEffect, useRef, useState } from "react";
import { MOTION_TOKENS, resolveBrandColors, resolveCoreColors } from "../bibleLanguage.js";
import { applyScales, resolveScales, SHADOW_STEPS, shadowValue } from "../scales.js";
import { applyColors, themeColors } from "../tokens.js";

const DURATIONS = MOTION_TOKENS.filter((token) => token.id.startsWith("duration-"));
const EASINGS = MOTION_TOKENS.filter((token) => token.id.startsWith("ease-"));
const MAX_DURATION = Math.max(...DURATIONS.map((token) => Number.parseFloat(token.value)));
// Slow enough to read the curves apart; the tokens themselves are much shorter.
const RACE_MS = 1200;

function bezierPoints(value) {
  if (value === "linear") return [0, 0, 1, 1];
  return value.match(/-?[\d.]+/g).map(Number);
}

// Curve thumbnail in a 40×40 box with 8px headroom so overshoot stays visible.
function EaseCurve({ value }) {
  const [x1, y1, x2, y2] = bezierPoints(value);
  const map = (x, y) => `${4 + x * 32} ${36 - y * 24}`;
  return (
    <svg className="sg-ease-curve" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <path d={`M${map(0, 0)} C${map(x1, y1)} ${map(x2, y2)} ${map(1, 1)}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Spec({ children }) {
  return <div className="type-spec">{children}</div>;
}

function Specimen({ spec, children }) {
  return (
    <div className="sg-specimen">
      {children}
      <Spec>{spec}</Spec>
    </div>
  );
}

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
  const brandRows = resolveBrandColors(colors, project.brandColors);
  const scales = resolveScales(project.tokenScales);
  const [race, setRace] = useState("idle");

  useEffect(() => {
    applyColors(rootRef.current, colors);
  }, [colors]);

  useEffect(() => {
    applyScales(rootRef.current, scales);
    for (const token of MOTION_TOKENS) {
      rootRef.current?.style.setProperty(`--${token.id}`, token.value);
    }
  }, [project.tokenScales]);

  // Snap the bars back with no transition, then release them on the next frame.
  function playRace() {
    setRace("reset");
    requestAnimationFrame(() => requestAnimationFrame(() => setRace("go")));
  }

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
              ? `Live specimen from ${project.tokenFile}. Color, type, spacing, shape, and components follow the mapped tokens.`
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
          <div className="core-table">
            <div className="core-row core-head">
              <span />
              <span>Branding token</span>
              <span>Name</span>
            </div>
            {brandRows.length ? (
              brandRows.map((row) => (
                <div className="core-row" key={row.id}>
                  <span
                    className="swatch"
                    style={{ background: row.value || "transparent" }}
                  />
                  <code>{row.css}</code>
                  <span className="core-controls">{row.label}</span>
                </div>
              ))
            ) : (
              <p className="guide-note">
                No custom branding colors. Add them under Branding in Visualizer → Colorway.
              </p>
            )}
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
          <SectionHead n="03" title="Spacing" />
          <p className="guide-note">{scales.spaceBase}px base · compact density</p>
          <div className="sg-space-list">
            {Object.entries(scales.space).map(([id, value]) => (
              <div className="sg-space-row" key={id}>
                <code className="type-spec">{id}</code>
                <span className="type-spec">{value}px</span>
                <span className="sg-space-bar" style={{ width: value }} />
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="04" title="Shape & elevation" />
          <div className="sg-shape-grid">
            <div className="sg-shape-col">
              <div className="sg-group-label">Radius</div>
              <div className="sg-tiles">
                {Object.entries(scales.radius).map(([id, value]) => (
                  <div className="sg-tile-cell" key={id}>
                    <div className="sg-tile" style={{ borderRadius: value }} />
                    <div className="sg-tile-name">{id.replace("radius-", "")}</div>
                    <Spec>{value >= 999 ? "9999px" : `${value}px`}</Spec>
                  </div>
                ))}
              </div>
              <Spec>border-width · {scales.borderWidth}px</Spec>
            </div>
            <div className="sg-shape-col">
              <div className="sg-group-label">Shadow</div>
              <div className="sg-shadow-panel">
                {SHADOW_STEPS.map((step) => (
                  <div className="sg-tile-cell" key={step.id}>
                    <div
                      className="sg-tile sg-tile-shadow"
                      style={{ boxShadow: shadowValue(scales.shadows[step.id]) }}
                    />
                    <div className="sg-tile-name">{step.id}</div>
                    <Spec>{step.use}</Spec>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="05" title="Motion" />
          <p className="guide-note">
            {DURATIONS.length} durations and {EASINGS.length} easings, exported as --duration-* and --ease-*.
            Press play to race the curves.
          </p>
          <div className="sg-shape-grid">
            <div className="sg-shape-col">
              <div className="sg-group-label">Duration</div>
              {DURATIONS.map((token) => (
                <div className="sg-duration-row" key={token.id}>
                  <span className="sg-tile-name">{token.id.replace("duration-", "")}</span>
                  <span className="sg-track">
                    <span
                      className="sg-track-fill"
                      style={{ width: `${(Number.parseFloat(token.value) / MAX_DURATION) * 100}%` }}
                    />
                  </span>
                  <span className="type-spec">{token.value}</span>
                </div>
              ))}
              <div className="sg-hover-demo" tabIndex={0}>
                <strong>Hover to feel it</strong>
                <Spec>lift duration-fast · ease-emphasized · shadow duration-base · ease-standard</Spec>
              </div>
            </div>
            <div className="sg-shape-col">
              <div className="sg-easing-head">
                <div className="sg-group-label">Easing</div>
                <button type="button" className="sg-btn sg-btn-outline" onClick={playRace}>
                  ▶ Play
                </button>
              </div>
              {EASINGS.map((token) => (
                <div className="sg-ease-row" key={token.id}>
                  <EaseCurve value={token.value} />
                  <div className="sg-ease-body">
                    <div className="sg-ease-meta">
                      <span className="sg-tile-name">{token.id.replace("ease-", "")}</span>
                      <Spec>{token.value}</Spec>
                    </div>
                    <span className="sg-track">
                      <span
                        className={`sg-track-fill sg-race sg-race-${race}`}
                        style={{ transitionTimingFunction: token.value, transitionDuration: `${RACE_MS}ms` }}
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="06" title="Components" />

          <div className="sg-group">
            <div className="sg-group-label">Buttons</div>
            <div className="guide-controls">
              <Specimen spec="brand"><button type="button" className="sg-btn sg-btn-primary">Request removal</button></Specimen>
              <Specimen spec="brand-hover"><button type="button" className="sg-btn sg-btn-primary is-hover">Hover</button></Specimen>
              <Specimen spec="brand · pressed"><button type="button" className="sg-btn sg-btn-primary is-pressed">Pressed</button></Specimen>
              <Specimen spec="surface · border"><button type="button" className="sg-btn sg-btn-secondary">Cancel</button></Specimen>
              <Specimen spec="outline"><button type="button" className="sg-btn sg-btn-outline">Export CSV</button></Specimen>
              <Specimen spec="brand on bg"><button type="button" className="sg-btn sg-btn-link">View log</button></Specimen>
              <Specimen spec="destructive"><button type="button" className="sg-btn sg-btn-destructive">Delete account</button></Specimen>
              <Specimen spec="surface-elevated · muted"><button type="button" className="sg-btn sg-btn-disabled" disabled>Disabled</button></Specimen>
            </div>
          </div>

          <div className="sg-group">
            <div className="sg-group-label">Inputs</div>
            <div className="sg-input-grid">
              <Specimen spec="border"><input className="sg-input" defaultValue="Default" /></Specimen>
              <Specimen spec="brand ring"><input className="sg-input is-focus" defaultValue="Focused" /></Specimen>
              <div className="sg-specimen">
                <input className="sg-input is-invalid" defaultValue="Invalid" aria-invalid="true" />
                <div className="sg-field-error">Enter a valid email.</div>
              </div>
              <Specimen spec="text-muted"><input className="sg-input" placeholder="Placeholder" /></Specimen>
              <Specimen spec="surface-elevated"><input className="sg-input" defaultValue="Disabled" disabled /></Specimen>
              <Specimen spec="select">
                <div className="sg-input sg-select">
                  <span>Select broker</span>
                  <span aria-hidden="true">▾</span>
                </div>
              </Specimen>
            </div>
          </div>

          <div className="sg-group">
            <div className="sg-group-label">Selection controls</div>
            <div className="guide-controls">
              <span className="sg-choice"><span className="sg-check on">✓</span>Checked</span>
              <span className="sg-choice"><span className="sg-check" />Unchecked</span>
              <span className="sg-choice"><span className="sg-radio on" />Selected</span>
              <span className="sg-choice"><span className="sg-radio" />Option</span>
              <span className="sg-choice"><span className="sg-switch on"><span /></span>On</span>
              <span className="sg-choice"><span className="sg-switch"><span /></span>Off</span>
            </div>
          </div>

          <div className="sg-group">
            <div className="sg-group-label">Status chips and alerts</div>
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
            <div className="sg-alert-grid">
              <div className="sg-alert sg-alert-success"><strong>Removed.</strong> Spokeo confirmed the opt-out.</div>
              <div className="sg-alert sg-alert-warning"><strong>Needs review.</strong> PeopleFinders wants an identity check.</div>
              <div className="sg-alert sg-alert-destructive"><strong>Rejected.</strong> Radaris declined; retry in 24h.</div>
              <div className="sg-alert sg-alert-brand"><strong>Scanning.</strong> 214 brokers queued for tonight.</div>
            </div>
          </div>

          <div className="sg-group">
            <div className="sg-group-label">Surfaces</div>
            <div className="sg-surface-row">
              <Specimen spec="surface · shadow-1 · radius-lg">
                <div className="sg-card">
                  <div className="applied-title">Card</div>
                  <p className="guide-note">Surface on background. Muted text for supporting copy.</p>
                </div>
              </Specimen>
              <Specimen spec="surface-elevated · shadow-2">
                <div className="sg-menu" role="menu">
                  <div className="sg-menu-item on">Request removal</div>
                  <div className="sg-menu-item">Rescan broker</div>
                  <div className="sg-menu-item">Archive</div>
                </div>
              </Specimen>
            </div>
            <Specimen spec="tabs · brand underline">
              <div className="sg-tabs" role="tablist">
                <span className="sg-tab on">Overview</span>
                <span className="sg-tab">Brokers</span>
                <span className="sg-tab">Activity</span>
              </div>
            </Specimen>
          </div>

          <div className="sg-group">
            <div className="sg-group-label">Table</div>
            <Specimen spec="surface-elevated header · brand-subtle selected row · surface rows">
              <div className="sg-table">
                <div className="sg-table-row sg-table-head">
                  <span>Record</span>
                  <span>Broker</span>
                  <span>Status</span>
                </div>
                <div className="sg-table-row">
                  <code>4F82-A1</code>
                  <span>Spokeo</span>
                  <span><StatusChip tone="success">Completed</StatusChip></span>
                </div>
                <div className="sg-table-row on">
                  <code>4F82-A2</code>
                  <span>WhitePages</span>
                  <span><StatusChip tone="brand">In progress</StatusChip></span>
                </div>
                <div className="sg-table-row">
                  <code>4F82-A3</code>
                  <span>PeopleFinders</span>
                  <span><StatusChip tone="warning">Needs review</StatusChip></span>
                </div>
              </div>
            </Specimen>
          </div>

          <div className="sg-group">
            <div className="sg-group-label">Misc</div>
            <div className="sg-misc-row">
              <Specimen spec="avatar">
                <span className="sg-avatar">JO</span>
              </Specimen>
              <Specimen spec="progress · 59.8%">
                <span className="sg-track sg-progress"><span className="sg-track-fill" style={{ width: "59.8%" }} /></span>
              </Specimen>
              <Specimen spec="skeleton">
                <span className="sg-skeleton-stack">
                  <span className="sg-skeleton" style={{ width: 140 }} />
                  <span className="sg-skeleton" style={{ width: 96 }} />
                </span>
              </Specimen>
              <Specimen spec="tooltip · inverted">
                <span className="sg-tooltip">Last checked 4h ago</span>
              </Specimen>
              <Specimen spec="breadcrumb">
                <span className="sg-breadcrumb">Brokers / Spokeo / <strong>Log</strong></span>
              </Specimen>
              <Specimen spec="kbd">
                <kbd className="sg-kbd">⌘K</kbd>
              </Specimen>
              <Specimen spec="nav count · filled">
                <span className="sg-nav-count">Queue <span className="sg-count">12</span></span>
              </Specimen>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <SectionHead n="07" title="Applied" />
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
