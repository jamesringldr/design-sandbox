import { useEffect, useRef, useState } from "react";
import { normalizePreviewOrigin, previewFrameSrc } from "../previewUrl.js";
import { applyColors, themeColors } from "../tokens.js";

const EDITORS = [
  "Colorway",
  "Libraries",
  "Spacing",
  "Elevation, Borders, Radius",
];

const MOBILE_PRESETS = [
  { id: "iphone-15-pro-max", label: "iPhone 15 Pro Max", aspect: "430 / 932" },
  { id: "iphone-15", label: "iPhone 15", aspect: "393 / 852" },
  { id: "iphone-se", label: "iPhone SE", aspect: "375 / 667" },
];

const DESKTOP_PRESETS = [
  { id: "16-9", label: "16:9", aspect: "16 / 9" },
  { id: "16-10", label: "16:10", aspect: "16 / 10" },
  { id: "4-3", label: "4:3", aspect: "4 / 3" },
];

function paintPreview(iframe, colors, theme) {
  const doc = iframe?.contentDocument;
  if (!doc?.documentElement) return;
  applyColors(doc.documentElement, colors);
  if (doc.body) applyColors(doc.body, colors);
  doc.documentElement.classList.toggle("dark", theme !== "light");
  doc.documentElement.classList.toggle("light", theme === "light");
}

function ViewScreen({ colors, aspect, variant }) {
  const ref = useRef(null);
  useEffect(() => {
    applyColors(ref.current, colors);
  }, [colors]);
  return (
    <div
      ref={ref}
      className={`viz-screen viz-screen-${variant}`}
      style={{ aspectRatio: aspect }}
    />
  );
}

function PreviewFrame({ origin, route, colors, theme, aspect, variant }) {
  const ref = useRef(null);
  const src = previewFrameSrc(origin, route);

  useEffect(() => {
    paintPreview(ref.current, colors, theme);
  }, [colors, theme]);

  if (!src) {
    return <ViewScreen colors={colors} aspect={aspect} variant={variant} />;
  }

  return (
    <iframe
      ref={ref}
      className={`viz-screen viz-screen-${variant}`}
      style={{ aspectRatio: aspect }}
      src={src}
      title={route}
      sandbox="allow-scripts allow-same-origin allow-forms"
      onLoad={() => paintPreview(ref.current, colors, theme)}
    />
  );
}

export default function Visualizer({ project, onUpdate }) {
  const routes = project.routes || [];
  const [mode, setMode] = useState("mobile");
  const [mobilePreset, setMobilePreset] = useState(MOBILE_PRESETS[0].id);
  const [desktopPreset, setDesktopPreset] = useState(DESKTOP_PRESETS[0].id);
  const [selected, setSelected] = useState(routes[0] || "");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [devState, setDevState] = useState("stopped");
  const [devCommand, setDevCommand] = useState("");
  const [devError, setDevError] = useState("");
  const [devPort, setDevPort] = useState("");
  const [liveKey, setLiveKey] = useState(0);
  const theme = project.theme === "light" ? "light" : "dark";
  const colors = themeColors(project);
  const previewOrigin = normalizePreviewOrigin(project.previewUrl);
  const presets = mode === "mobile" ? MOBILE_PRESETS : DESKTOP_PRESETS;
  const presetId = mode === "mobile" ? mobilePreset : desktopPreset;
  const preset = presets.find((item) => item.id === presetId) || presets[0];
  const active = routes.includes(selected) ? selected : routes[0] || "";

  useEffect(() => {
    let cancelled = false;
    const origin = previewOrigin || "http://localhost:5173";
    async function check() {
      try {
        const res = await fetch("/api/dev-server/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewUrl: origin }),
        });
        const data = await res.json();
        if (cancelled) return;
        setDevState(data.state || "stopped");
        if (data.port) setDevPort(String(data.port));
      } catch {
        if (!cancelled) setDevState("stopped");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [previewOrigin]);

  useEffect(() => {
    if (devState !== "starting" && devState !== "stopping") return undefined;
    const origin = previewOrigin || "http://localhost:5173";
    const timer = setInterval(async () => {
      const res = await fetch("/api/dev-server/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewUrl: origin }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.port) setDevPort(String(data.port));
      if (data.state === "running") {
        setDevState("running");
        setLiveKey((key) => key + 1);
      }
      if (devState === "stopping" && data.state === "stopped") {
        setDevState("stopped");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [devState, previewOrigin]);

  async function startDev() {
    const origin = previewOrigin || "http://localhost:5173";
    if (!project.previewUrl) {
      onUpdate({ ...project, previewUrl: origin });
    }
    setDevError("");
    setDevState("starting");
    try {
      const res = await fetch("/api/dev-server/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localPath: project.localPath,
          previewUrl: origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start.");
      setDevCommand(data.command || "");
      setDevState(data.state || "starting");
      if (data.port) setDevPort(String(data.port));
      if (data.state === "running") setLiveKey((key) => key + 1);
    } catch (error) {
      setDevState("stopped");
      setDevError(error.message);
    }
  }

  async function killDev() {
    const origin = previewOrigin || "http://localhost:5173";
    setDevError("");
    setDevState("stopping");
    try {
      const res = await fetch("/api/dev-server/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewUrl: origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not stop.");
      setDevState(data.state || "stopped");
      if (data.port) setDevPort(String(data.port));
    } catch (error) {
      setDevState("running");
      setDevError(error.message);
    }
  }

  function setTheme(next) {
    onUpdate({
      ...project,
      theme: next,
      colors: project.colorsByTheme?.[next] || colors,
    });
  }

  function addRoute() {
    let path = draft.trim();
    if (!path) return;
    if (!path.startsWith("/")) path = `/${path}`;
    if (routes.includes(path)) {
      setSelected(path);
      setDraft("");
      setAdding(false);
      return;
    }
    onUpdate({ ...project, routes: [...routes, path] });
    setSelected(path);
    setDraft("");
    setAdding(false);
  }

  function step(delta) {
    if (!routes.length) return;
    const index = Math.max(0, routes.indexOf(active));
    const next = routes[(index + delta + routes.length) % routes.length];
    setSelected(next);
  }

  return (
    <div className="viz">
      <div className="viz-stage">
        <div className="viz-toolbar">
          <div className="eyebrow">Visualizer</div>
          <select
            className="input viz-select"
            aria-label="Device type"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
          <select
            className="input viz-select"
            aria-label={mode === "mobile" ? "Device" : "Aspect ratio"}
            value={preset.id}
            onChange={(event) => {
              if (mode === "mobile") setMobilePreset(event.target.value);
              else setDesktopPreset(event.target.value);
            }}
          >
            {presets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            className="input input-mono viz-preview-url"
            aria-label="Preview origin"
            placeholder="http://localhost:5173"
            value={project.previewUrl || ""}
            onChange={(event) =>
              onUpdate({ ...project, previewUrl: event.target.value })
            }
          />
          <div className="seg viz-theme" role="group" aria-label="Color mode">
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

        <div className="viz-body">
          <div className="viz-views">
            <div className="viz-views-head">
              <span className="eyebrow">Views</span>
              <button
                type="button"
                className="viz-icon"
                aria-label="Add view"
                onClick={() => setAdding(true)}
              >
                +
              </button>
            </div>
            {adding ? (
              <input
                className="input input-mono"
                autoFocus
                placeholder="/home"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addRoute();
                  }
                  if (event.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                onBlur={() => {
                  if (!draft.trim()) setAdding(false);
                }}
              />
            ) : null}
            {routes.length === 0 ? (
              <p className="muted">No views yet.</p>
            ) : (
              routes.map((route) => (
                <button
                  key={route}
                  type="button"
                  className={`viz-view ${route === active ? "on" : ""}`}
                  onClick={() => setSelected(route)}
                >
                  {route}
                </button>
              ))
            )}
          </div>

          <div className="viz-canvas">
            {routes.length === 0 ? (
              <p className="muted">Add a view to render it here.</p>
            ) : (
              <div
                className={`viz-single${mode === "mobile" ? " viz-single-phone" : ""}`}
              >
                <div className="viz-single-bar">
                  <div className="viz-frame-label">{active}</div>
                  <div className="row">
                    <button
                      type="button"
                      className="viz-icon"
                      aria-label="Previous view"
                      onClick={() => step(-1)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="viz-icon"
                      aria-label="Next view"
                      onClick={() => step(1)}
                    >
                      ›
                    </button>
                  </div>
                </div>
                {mode === "mobile" ? (
                  <div className="viz-phone-stage">
                    <PreviewFrame
                      key={liveKey}
                      origin={previewOrigin}
                      route={active}
                      colors={colors}
                      theme={theme}
                      aspect={preset.aspect}
                      variant="phone"
                    />
                  </div>
                ) : (
                  <PreviewFrame
                    key={liveKey}
                    origin={previewOrigin}
                    route={active}
                    colors={colors}
                    theme={theme}
                    aspect={preset.aspect}
                    variant="desktop"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="viz-editors" aria-label="Design elements">
        <div className="viz-editor-list">
          {EDITORS.map((label) => (
            <div className="viz-editor-slot" key={label}>
              {label}
            </div>
          ))}
        </div>
        <div className="viz-editors-foot">
          <p className="muted">
            {!project.localPath && devState !== "running"
              ? "Attach a local folder to start the app."
              : devState === "running"
                ? `Dev server is up on port ${devPort || "5173"}.`
                : devState === "starting"
                  ? `Starting${devCommand ? ` ${devCommand}` : "…"}`
                  : devState === "stopping"
                    ? "Stopping…"
                    : devError || "Start the app to render live views."}
          </p>
          <button
            type="button"
            className={`btn btn-wide ${devState === "running" ? "btn-danger" : "btn-primary"}`}
            disabled={
              devState === "starting" ||
              devState === "stopping" ||
              (devState !== "running" && !project.localPath)
            }
            onClick={devState === "running" ? killDev : startDev}
          >
            {devState === "running"
              ? "Kill server"
              : devState === "starting"
                ? "Starting…"
                : devState === "stopping"
                  ? "Stopping…"
                  : "Start dev server"}
          </button>
        </div>
      </aside>
    </div>
  );
}
