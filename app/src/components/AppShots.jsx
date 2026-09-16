// AppShots: uploaded screenshots, converted by a Claude Code session into
// token-driven pages (docs/appshots.md). Converted pages render in a shadow
// root so their styles stay scoped, while token CSS variables still inherit.
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import { ShotGrid, ShotSingle } from "./ShotViews.jsx";

// Visible viewport used to crop tall pages: phone ≈ 393×852, desktop 16:10.
const FRAME_RATIO = { mobile: 852 / 393, desktop: 10 / 16 };

const fileUrl = (slug, file, version = "") =>
  `/api/appshots/file?slug=${encodeURIComponent(slug)}&file=${encodeURIComponent(file)}${
    version ? `&v=${version}` : ""
  }`;

async function api(url, body) {
  const res = await fetch(url, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : undefined);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`${file.name} is not an image.`));
      img.onload = () =>
        resolve({ dataUrl: reader.result, imageWidth: img.naturalWidth, imageHeight: img.naturalHeight });
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const HOST_CSS = `:host { display: block; min-height: 100%; background: var(--background); color: var(--text);
  font-family: var(--font-ui); font-size: 14px; line-height: 1.4; }
*, *::before, *::after { box-sizing: border-box; }
h1, h2, h3, h4 { font-family: var(--font-display); }
code, kbd, samp, pre { font-family: var(--font-mono); }
button, input, select, textarea { font: inherit; color: inherit; }`;

function ShotPage({ slug, shot }) {
  const hostRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    const root = host.shadowRoot || host.attachShadow({ mode: "open" });
    fetch(fileUrl(slug, `${shot.id}.html`, shot.version))
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("Page not found."))))
      .then((html) => {
        if (cancelled) return;
        const template = document.createElement("template");
        template.innerHTML = html;
        template.content.querySelectorAll("script, link, iframe").forEach((node) => node.remove());
        root.replaceChildren();
        const style = document.createElement("style");
        style.textContent = HOST_CSS;
        root.append(style, template.content);
        setError("");
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [slug, shot.id, shot.version]);

  return (
    <div className="viz-shot-page" ref={hostRef}>
      {error ? <p className="muted viz-shot-error">{error}</p> : null}
    </div>
  );
}

function ShotImage({ slug, shot }) {
  return <img className="viz-shot-image" src={fileUrl(slug, shot.image)} alt={shot.label} />;
}

export default function AppShots({ slug, renderFrame }) {
  const [shots, setShots] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const pending = shots.filter((shot) => !shot.converted);

  async function refresh() {
    if (!slug) return;
    try {
      const data = await api(`/api/appshots?slug=${encodeURIComponent(slug)}`);
      setShots((current) =>
        data.shots.map((shot) => {
          const before = current.find((row) => row.id === shot.id);
          // Bump the version when a page appears so the shadow root refetches it.
          const version =
            before && before.converted === shot.converted ? before.version : String(Date.now());
          return { ...shot, version };
        })
      );
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    setShots([]);
    setLoaded(false);
    setOpenId(null);
    refresh();
  }, [slug]);

  // Watch for conversions while any shot is waiting.
  useEffect(() => {
    if (!pending.length) return undefined;
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [pending.length, slug]);

  async function upload(files) {
    const images = [...files].filter((file) => /^image\/(png|jpeg|webp)$/.test(file.type));
    if (!images.length) {
      setError("Drop PNG, JPEG, or WebP screenshots.");
      return;
    }
    setBusy(true);
    try {
      for (const file of images) {
        const image = await readImage(file);
        await api("/api/appshots/upload", { slug, name: file.name, ...image });
      }
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function update(shot, changes) {
    try {
      await api("/api/appshots/update", { slug, id: shot.id, ...changes });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(shot) {
    setRemoving(null);
    try {
      await api("/api/appshots/remove", { slug, id: shot.id });
      if (openId === shot.id) setOpenId(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyPrompt() {
    const list = pending.map((shot) => `- ${shot.id} (${shot.device}, ${shot.width}px wide): ${shot.image}`);
    const prompt = [
      `Convert the pending AppShots for design playground project "${slug}".`,
      "Follow docs/appshots.md in the design sandbox repo exactly.",
      `Screenshots are in data/projects/${slug}/appshots/. For each, write <id>.html next to it:`,
      ...list,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  const items = [...shots]
    .sort((a, b) => (a.device === b.device ? 0 : a.device === "mobile" ? -1 : 1))
    .map((shot) => ({
      ...shot,
      frameHeight: Math.min(shot.height, Math.round(shot.width * FRAME_RATIO[shot.device])),
      badge: shot.converted ? "" : "Needs conversion",
    }));
  const openIndex = items.findIndex((item) => item.id === openId);

  const renderScreen = (item, forceImage = false) =>
    renderFrame(
      item,
      item.converted && !forceImage ? <ShotPage slug={slug} shot={item} /> : <ShotImage slug={slug} shot={item} />
    );

  if (!slug) return <p className="muted">Save the project before adding AppShots.</p>;

  const toolbar = (
    <div className="viz-shots-bar">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : "+ Add screenshots"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(event) => {
          upload(event.target.files);
          event.target.value = "";
        }}
      />
      {pending.length ? (
        <>
          <span className="muted">
            {pending.length} waiting for conversion. Ask Claude Code to convert them.
          </span>
          <button type="button" className="btn btn-secondary" onClick={copyPrompt}>
            {copied ? "Copied" : "Copy prompt"}
          </button>
        </>
      ) : null}
      {error ? <span className="viz-shots-error">{error}</span> : null}
    </div>
  );

  return (
    <div
      className={`viz-shots${dragging ? " dragging" : ""}`}
      onDragOver={(event) => {
        if (![...event.dataTransfer.types].includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        upload(event.dataTransfer.files);
      }}
    >
      {openIndex >= 0 ? (
        <ShotSingle
          items={items}
          index={openIndex}
          onIndex={(index) => setOpenId(items[index].id)}
          onClose={() => setOpenId(null)}
          renderScreen={(item) => renderScreen(item, showImage)}
          headExtra={(item) => (
            <>
              {item.converted ? (
                <div className="seg seg-sm" role="group" aria-label="Show">
                  <button type="button" className={showImage ? "" : "on"} onClick={() => setShowImage(false)}>
                    Page
                  </button>
                  <button type="button" className={showImage ? "on" : ""} onClick={() => setShowImage(true)}>
                    Screenshot
                  </button>
                </div>
              ) : (
                <span className="viz-shot-badge">Needs conversion</span>
              )}
              <div className="seg seg-sm" role="group" aria-label="Device">
                {["mobile", "desktop"].map((device) => (
                  <button
                    key={device}
                    type="button"
                    className={item.device === device ? "on" : ""}
                    onClick={() => item.device !== device && update(item, { device })}
                  >
                    {device === "mobile" ? "Mobile" : "Desktop"}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRemoving(item)}>
                Delete
              </button>
            </>
          )}
        />
      ) : (
        <>
          {toolbar}
          {!loaded ? null : items.length === 0 ? (
            <div className="viz-shots-empty">
              <p>Drop screenshots here, or use Add screenshots.</p>
              <p className="muted">
                Each one is converted by Claude Code into a lightweight page that follows the
                Colorway, Spacing, and Elevation panels.
              </p>
            </div>
          ) : (
            ["mobile", "desktop"].map((device) => {
              const group = items.filter((item) => item.device === device);
              if (!group.length) return null;
              return (
                <section className="viz-shots-group" key={device}>
                  <span className="eyebrow">{device === "mobile" ? "Mobile" : "Desktop"}</span>
                  <ShotGrid
                    items={group}
                    minCell={device === "mobile" ? 180 : 320}
                    maxColumns={device === "mobile" ? 4 : 2}
                    renderScreen={renderScreen}
                    onOpen={(item) => {
                      setShowImage(false);
                      setOpenId(item.id);
                    }}
                  />
                </section>
              );
            })
          )}
        </>
      )}
      {removing ? (
        <ConfirmModal
          title="Delete AppShot"
          body={`Delete "${removing.label}"? The screenshot and its converted page are removed.`}
          confirmLabel="Delete"
          onCancel={() => setRemoving(null)}
          onConfirm={() => remove(removing)}
        />
      ) : null}
    </div>
  );
}
