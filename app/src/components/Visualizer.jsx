import { useEffect, useRef, useState } from "react";
import { normalizePreviewOrigin, previewFrameSrc } from "../previewUrl.js";
import { LOFI_SHOTS, LofiShot } from "../screens/lofi.jsx";
import { applyColors, resolvePaintColors, STARTER_THEMES } from "../tokens.js";
import ColorwayEditor from "./ColorwayEditor.jsx";

const VIEW_TABS = [
  { id: "live", label: "Live" },
  { id: "static", label: "Static" },
  { id: "layout", label: "Layout" },
];

const EDITORS = [
  { id: "colorway", label: "Colorway" },
  { id: "libraries", label: "Libraries" },
  { id: "spacing", label: "Spacing" },
  { id: "elevation", label: "Elevation, Borders, Radius" },
];

function themeBags(project) {
  return {
    dark: resolvePaintColors(
      project.colorsByTheme?.dark || project.colors || STARTER_THEMES.dark,
      "dark"
    ),
    light: resolvePaintColors(
      project.colorsByTheme?.light || STARTER_THEMES.light,
      "light"
    ),
  };
}

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

function parseAspect(aspect) {
  const [w, h] = String(aspect)
    .split("/")
    .map((part) => Number(part.trim()));
  if (!w || !h) return { width: 390, height: 844 };
  return { width: w, height: h };
}

function PhoneStage({ aspect, children }) {
  const stageRef = useRef(null);
  const { width, height } = parseAspect(aspect);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const fit = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      setScale(Math.min(w / width, h / height, 1));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div ref={stageRef} className="viz-phone-stage">
      <div
        className="viz-phone-slot"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          className="viz-phone-scale"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ViewScreen({ colors, theme, aspect, variant, children }) {
  const ref = useRef(null);
  useEffect(() => {
    applyColors(ref.current, resolvePaintColors(colors, theme));
  }, [colors, theme]);
  const phone = variant === "phone" ? parseAspect(aspect) : null;
  return (
    <div
      ref={ref}
      className={`viz-screen viz-screen-${variant}`}
      style={
        phone
          ? { width: phone.width, height: phone.height }
          : { aspectRatio: aspect }
      }
    >
      {children}
    </div>
  );
}

function PlaceholderScreen({ colors, theme, aspect, variant, label }) {
  return (
    <ViewScreen colors={colors} theme={theme} aspect={aspect} variant={variant}>
      <div className="viz-placeholder">
        <p className="muted">{label}</p>
      </div>
    </ViewScreen>
  );
}

function LofiGrid({ colors, theme, aspect, onOpen }) {
  const gridRef = useRef(null);
  const { width, height } = parseAspect(aspect);
  const [layout, setLayout] = useState({ columns: 4, scale: 0.4 });
  const gap = 16;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const fit = () => {
      const available = grid.clientWidth;
      if (!available) return;
      const columns = Math.max(1, Math.min(4, Math.floor((available + gap) / (180 + gap))));
      const cell = (available - gap * (columns - 1)) / columns;
      setLayout({ columns, scale: Math.min(cell / width, 1) });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={gridRef}
      className="viz-lofi-grid"
      style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`, gap }}
    >
      {LOFI_SHOTS.map((shot, index) => (
        <button
          type="button"
          className="viz-lofi-cell"
          key={shot.id}
          aria-label={`Open ${shot.label}`}
          onClick={() => onOpen(index)}
        >
          <div
            className="viz-phone-slot"
            style={{ width: width * layout.scale, height: height * layout.scale }}
          >
            <div
              className="viz-phone-scale"
              style={{ width, height, transform: `scale(${layout.scale})` }}
            >
              <ViewScreen colors={colors} theme={theme} aspect={aspect} variant="phone">
                <LofiShot Screen={shot.Screen} />
              </ViewScreen>
            </div>
          </div>
          <span className="viz-frame-label">{shot.label}</span>
        </button>
      ))}
    </div>
  );
}

function NavIcon({ kind }) {
  const paths = {
    grid: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z",
    prev: "M10 3.5 5.5 8l4.5 4.5",
    next: "M6 3.5 10.5 8 6 12.5",
  };
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={paths[kind]}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LofiSingle({ colors, theme, aspect, index, onIndex, onClose }) {
  const count = LOFI_SHOTS.length;
  const shot = LOFI_SHOTS[index];
  const step = (delta) => onIndex((index + delta + count) % count);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="viz-lofi-single">
      <div className="viz-lofi-single-head">
        <button
          type="button"
          className="viz-icon"
          aria-label="All pages"
          title="All pages"
          onClick={onClose}
        >
          <NavIcon kind="grid" />
        </button>
        <span className="viz-lofi-single-title">{shot.label}</span>
        <span className="viz-frame-label">
          {index + 1} / {count}
        </span>
      </div>
      <div className="viz-lofi-single-body">
        <button
          type="button"
          className="viz-icon viz-lofi-arrow"
          aria-label="Previous page"
          onClick={() => step(-1)}
        >
          <NavIcon kind="prev" />
        </button>
        <PhoneStage aspect={aspect}>
          <ViewScreen colors={colors} theme={theme} aspect={aspect} variant="phone">
            <LofiShot Screen={shot.Screen} />
          </ViewScreen>
        </PhoneStage>
        <button
          type="button"
          className="viz-icon viz-lofi-arrow"
          aria-label="Next page"
          onClick={() => step(1)}
        >
          <NavIcon kind="next" />
        </button>
      </div>
    </div>
  );
}

function PreviewFrame({ origin, route, colors, theme, aspect, variant }) {
  const ref = useRef(null);
  const src = previewFrameSrc(origin, route);

  useEffect(() => {
    paintPreview(ref.current, colors, theme);
  }, [colors, theme]);

  if (!src) {
    return (
      <PlaceholderScreen
        colors={colors}
        theme={theme}
        aspect={aspect}
        variant={variant}
        label="Start the app to render live views."
      />
    );
  }

  const phone = variant === "phone" ? parseAspect(aspect) : null;

  return (
    <iframe
      ref={ref}
      className={`viz-screen viz-screen-${variant}`}
      style={
        phone
          ? { width: phone.width, height: phone.height }
          : { aspectRatio: aspect }
      }
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
  const [viewTab, setViewTab] = useState("live");
  const [staticSource, setStaticSource] = useState("lofi");
  const [lofiIndex, setLofiIndex] = useState(null);
  const [openEditor, setOpenEditor] = useState(null);
  const [draftByTheme, setDraftByTheme] = useState(() => themeBags(project));
  const [savedByTheme, setSavedByTheme] = useState(() => themeBags(project));
  const [savingColors, setSavingColors] = useState(false);
  const [saveError, setSaveError] = useState("");
  const theme = project.theme === "light" ? "light" : "dark";
  const colors = draftByTheme[theme];
  const previewOrigin = normalizePreviewOrigin(project.previewUrl);
  const presets = mode === "mobile" ? MOBILE_PRESETS : DESKTOP_PRESETS;
  const presetId = mode === "mobile" ? mobilePreset : desktopPreset;
  const preset = presets.find((item) => item.id === presetId) || presets[0];
  const active = routes.includes(selected) ? selected : routes[0] || "";
  const showLofi = viewTab === "static" && staticSource === "lofi";

  useEffect(() => {
    const bags = themeBags(project);
    setDraftByTheme(bags);
    setSavedByTheme(bags);
    setSaveError("");
  }, [project.id]);

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
      colors: project.colorsByTheme?.[next] || draftByTheme[next],
    });
  }

  function toggleLock(id) {
    onUpdate({
      ...project,
      tokenLocks: {
        ...project.tokenLocks,
        [id]: !project.tokenLocks?.[id],
      },
    });
  }

  async function saveColors() {
    setSavingColors(true);
    setSaveError("");
    const colorsByTheme = {
      dark: { ...(project.colorsByTheme?.dark || {}), ...draftByTheme.dark },
      light: { ...(project.colorsByTheme?.light || {}), ...draftByTheme.light },
    };
    for (const mode of ["dark", "light"]) {
      if (colorsByTheme[mode].brand) {
        colorsByTheme[mode].brandPrimary = colorsByTheme[mode].brand;
      }
      if (colorsByTheme[mode].brandHover) {
        colorsByTheme[mode].brandSecondary = colorsByTheme[mode].brandHover;
      }
    }
    onUpdate({
      ...project,
      colorsByTheme,
      colors: colorsByTheme[theme],
    });
    setSavedByTheme({
      dark: { ...draftByTheme.dark },
      light: { ...draftByTheme.light },
    });
    setSavingColors(false);
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

  function canvasFrame(child) {
    if (mode === "mobile") {
      return <PhoneStage aspect={preset.aspect}>{child}</PhoneStage>;
    }
    return child;
  }

  let canvas = null;
  if (viewTab === "live") {
    canvas = canvasFrame(
      <PreviewFrame
        key={liveKey}
        origin={previewOrigin}
        route={active}
        colors={colors}
        theme={theme}
        aspect={preset.aspect}
        variant={mode === "mobile" ? "phone" : "desktop"}
      />
    );
  } else if (viewTab === "static") {
    canvas = canvasFrame(
      <PlaceholderScreen
        colors={colors}
        theme={theme}
        aspect={preset.aspect}
        variant={mode === "mobile" ? "phone" : "desktop"}
        label="App shots coming next."
      />
    );
  } else {
    canvas = canvasFrame(
      <PlaceholderScreen
        colors={colors}
        theme={theme}
        aspect={preset.aspect}
        variant={mode === "mobile" ? "phone" : "desktop"}
        label="Layout coming next."
      />
    );
  }

  return (
    <div className="viz">
      <div className="viz-stage">
        <div className="viz-tabs" role="tablist" aria-label="Visualizer view">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={viewTab === tab.id}
              className={`viz-tab${viewTab === tab.id ? " on" : ""}`}
              onClick={() => setViewTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="viz-toolbar">
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
          {viewTab === "live" ? (
            <input
              className="input input-mono viz-preview-url"
              aria-label="Preview origin"
              placeholder="http://localhost:5173"
              value={project.previewUrl || ""}
              onChange={(event) =>
                onUpdate({ ...project, previewUrl: event.target.value })
              }
            />
          ) : null}
          <div className="viz-toolbar-end">
            {viewTab === "static" ? (
              <div className="seg" role="group" aria-label="Static source">
                <button
                  type="button"
                  className={staticSource === "appshots" ? "on" : ""}
                  onClick={() => setStaticSource("appshots")}
                >
                  AppShots
                </button>
                <button
                  type="button"
                  className={staticSource === "lofi" ? "on" : ""}
                  onClick={() => setStaticSource("lofi")}
                >
                  LoFi
                </button>
              </div>
            ) : null}
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
        </div>

        {showLofi ? (
          <div className="viz-canvas viz-lofi">
            {mode !== "mobile" ? (
              <p className="muted">LoFi shots are mobile only.</p>
            ) : lofiIndex === null ? (
              <LofiGrid
                colors={colors}
                theme={theme}
                aspect={preset.aspect}
                onOpen={setLofiIndex}
              />
            ) : (
              <LofiSingle
                colors={colors}
                theme={theme}
                aspect={preset.aspect}
                index={lofiIndex}
                onIndex={setLofiIndex}
                onClose={() => setLofiIndex(null)}
              />
            )}
          </div>
        ) : (
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
                {canvas}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <aside className="viz-editors" aria-label="Design elements">
        <div className="viz-editor-list">
          {EDITORS.map((editor) => {
            const open = openEditor === editor.id;
            return (
              <div
                className={`viz-acc${open ? " open" : ""}`}
                key={editor.id}
              >
                <button
                  type="button"
                  className="viz-acc-head"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenEditor(open ? null : editor.id)
                  }
                >
                  <span className="viz-acc-caret" aria-hidden="true">
                    {open ? "▾" : "▸"}
                  </span>
                  {editor.label}
                </button>
                {open ? (
                  <div className="viz-acc-body">
                    {editor.id === "colorway" ? (
                      <ColorwayEditor
                        key={project.id}
                        theme={theme}
                        colors={colors}
                        saved={savedByTheme[theme]}
                        locks={project.tokenLocks || {}}
                        onChange={(next) =>
                          setDraftByTheme((current) => ({
                            ...current,
                            [theme]: next,
                          }))
                        }
                        onToggleLock={toggleLock}
                        onSave={saveColors}
                        saving={savingColors}
                        saveError={saveError}
                      />
                    ) : (
                      <p className="muted">Not wired yet.</p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
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
