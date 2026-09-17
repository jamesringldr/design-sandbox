export function normalizeHex(input) {
  if (input == null) return null;
  let value = String(input).trim();
  if (!value) return null;
  if (value[0] !== "#") value = `#${value}`;
  if (/^#([0-9a-f]{3})$/i.test(value)) {
    const [r, g, b] = value.slice(1);
    value = `#${r}${r}${g}${g}${b}${b}`;
  } else if (/^#([0-9a-f]{4})$/i.test(value)) {
    const [r, g, b, a] = value.slice(1);
    value = `#${r}${r}${g}${g}${b}${b}${a}${a}`;
  }
  if (!/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return null;
  return value.toUpperCase();
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
}

export function rgbToHex({ r, g, b, a = 1 }) {
  const hex = (n) => clampByte(n).toString(16).padStart(2, "0").toUpperCase();
  const alpha = a == null ? 1 : Number(a);
  if (alpha < 0.999) return `#${hex(r)}${hex(g)}${hex(b)}${hex(alpha * 255)}`;
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function parseRgb(value) {
  const hex = normalizeHex(value);
  if (hex) {
    const n = hex.slice(1);
    return {
      r: parseInt(n.slice(0, 2), 16),
      g: parseInt(n.slice(2, 4), 16),
      b: parseInt(n.slice(4, 6), 16),
      a: n.length === 8 ? parseInt(n.slice(6, 8), 16) / 255 : 1,
    };
  }
  const text = String(value || "").trim();
  const rgb = text.match(
    /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i
  );
  if (!rgb) return null;
  const a =
    rgb[4] == null
      ? 1
      : String(rgb[4]).endsWith("%")
        ? parseFloat(rgb[4]) / 100
        : Number(rgb[4]);
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a };
}

export function colorToHex(value) {
  const rgb = parseRgb(value);
  return rgb ? rgbToHex(rgb) : "";
}

export function rgbString(value) {
  const rgb = parseRgb(value);
  if (!rgb) return "";
  return `rgb(${clampByte(rgb.r)}, ${clampByte(rgb.g)}, ${clampByte(rgb.b)})`;
}

export function hexToHsl(hex) {
  const rgb = parseRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s, l, a: rgb.a };
}

function hueToRgb(p, q, t) {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

export function hslToHex({ h, s, l, a = 1 }) {
  const hue = ((h % 360) + 360) % 360 / 360;
  const sat = Math.max(0, Math.min(1, s));
  const lit = Math.max(0, Math.min(1, l));
  let r;
  let g;
  let b;
  if (sat === 0) {
    r = g = b = lit;
  } else {
    const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
    const p = 2 * lit - q;
    r = hueToRgb(p, q, hue + 1 / 3);
    g = hueToRgb(p, q, hue);
    b = hueToRgb(p, q, hue - 1 / 3);
  }
  return rgbToHex({ r: r * 255, g: g * 255, b: b * 255, a });
}

export function opaqueHex(hex) {
  const parsed = normalizeHex(hex);
  if (!parsed) return "#000000";
  return parsed.slice(0, 7);
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}
