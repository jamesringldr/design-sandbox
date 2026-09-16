// Grid of scaled screens and a one-at-a-time viewer. Shared by LoFi and AppShots.
// An item is { id, label, width, height, frameHeight?, badge? }: the screen is
// drawn at width × height CSS px; frameHeight crops tall pages in the grid and
// sets the fit in the single view (the rest scrolls).
import { useEffect, useRef, useState } from "react";

const GAP = 16;

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => setWidth(node.clientWidth));
    observer.observe(node);
    setWidth(node.clientWidth);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function Scaled({ item, scale, height, children }) {
  return (
    <div className="viz-phone-slot" style={{ width: item.width * scale, height: height * scale }}>
      <div
        className="viz-phone-scale"
        style={{ width: item.width, height: item.height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

export function ShotGrid({ items, renderScreen, onOpen, minCell = 180, maxColumns = 4 }) {
  const gridRef = useRef(null);
  const available = useWidth(gridRef);
  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((available + GAP) / (minCell + GAP)) || 1)
  );
  const cell = available ? (available - GAP * (columns - 1)) / columns : minCell;

  return (
    <div
      ref={gridRef}
      className="viz-lofi-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: GAP }}
    >
      {items.map((item) => {
        const scale = Math.min(cell / item.width, 1);
        return (
          <button
            type="button"
            className="viz-lofi-cell"
            key={item.id}
            aria-label={`Open ${item.label}`}
            onClick={() => onOpen(item)}
          >
            <Scaled item={item} scale={scale} height={item.frameHeight || item.height}>
              {renderScreen(item)}
            </Scaled>
            <span className="viz-frame-label">
              {item.label}
              {item.badge ? <span className="viz-shot-badge">{item.badge}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function NavIcon({ kind }) {
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

export function ShotSingle({ items, index, onIndex, onClose, renderScreen, headExtra }) {
  const count = items.length;
  const item = items[index];
  const stageRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const step = (delta) => onIndex((index + delta + count) % count);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest("input, textarea, select, [contenteditable], dialog")) return;
      if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() =>
      setBox({ w: node.clientWidth, h: node.clientHeight })
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!item) return null;
  const frame = item.frameHeight || item.height;
  const scale = box.w && box.h ? Math.min(box.w / item.width, box.h / frame, 1) : 0;

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
        <span className="viz-lofi-single-title">{item.label}</span>
        <span className="viz-frame-label">
          {index + 1} / {count}
        </span>
        {headExtra ? <div className="viz-lofi-single-extra">{headExtra(item)}</div> : null}
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
        <div ref={stageRef} className="viz-shot-stage">
          {scale ? (
            <Scaled item={item} scale={scale} height={item.height}>
              {renderScreen(item)}
            </Scaled>
          ) : null}
        </div>
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
