export function normalizePreviewOrigin(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function toBase64Url(value) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64url");
  }
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(token, "base64url").toString("utf8");
  }
  const pad = token.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad + "===".slice((pad.length + 3) % 4));
}

export function encodePreviewOrigin(origin) {
  const normalized = normalizePreviewOrigin(origin);
  if (!normalized) return "";
  return toBase64Url(normalized);
}

export function decodePreviewOrigin(token) {
  try {
    return normalizePreviewOrigin(fromBase64Url(String(token || "")));
  } catch {
    return "";
  }
}

export function previewFrameSrc(origin, route) {
  const encoded = encodePreviewOrigin(origin);
  if (!encoded) return "";
  const path = route && route.startsWith("/") ? route : `/${route || ""}`;
  return `/vp/${encoded}${path}`;
}

export function isAllowedPreviewOrigin(origin) {
  const url = new URL(origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return url.port !== "5180";
  }
  return true;
}
