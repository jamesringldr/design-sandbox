// Live-tab capture: loads the proxied preview page in headless Chromium at the
// device size and saves a full-page screenshot as a new AppShot.
import { addShot } from "./appshots.js";
import { isAllowedPreviewOrigin, normalizePreviewOrigin, previewFrameSrc } from "./src/previewUrl.js";

const DESKTOP_WIDTH = 1440;

function viewportFor(device, width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!(w > 0 && h > 0)) throw new Error("Viewport size is missing.");
  if (device === "mobile") return { width: Math.round(w), height: Math.round(h) };
  // Desktop presets are ratios (16 / 9); render them at a real desktop width.
  return { width: DESKTOP_WIDTH, height: Math.round((DESKTOP_WIDTH * h) / w) };
}

function labelFor(route) {
  const clean = String(route || "/").replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "");
  return clean ? clean.replace(/\//g, " · ") : "home";
}

export async function captureShot(dataRoot, { slug, origin, route, device, width, height, host }) {
  const path = previewFrameSrc(origin, route || "/");
  if (!path) throw new Error("Set a preview origin and start the app first.");
  // The proxy only serves allowed origins; anything else would fall through to
  // the playground itself.
  if (!isAllowedPreviewOrigin(normalizePreviewOrigin(origin))) {
    throw new Error("That preview origin is not allowed.");
  }
  if (!["mobile", "desktop"].includes(device)) throw new Error("Unknown device.");
  const viewport = viewportFor(device, width, height);
  const deviceScaleFactor = device === "mobile" ? 3 : 1;

  let chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    throw new Error("Capture needs playwright-core. Run npm install in app/.");
  }
  const browser = await chromium.launch().catch((error) => {
    throw new Error(`Could not start headless Chromium: ${error.message.split("\n")[0]}`);
  });
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor });
    // The captured page must never reach the playground's own API (e.g. save).
    await page.route(`http://${host}/api/**`, (route) => route.abort());
    const url = `http://${host}${path}`;
    const response = await page
      .goto(url, { waitUntil: "networkidle", timeout: 20000 })
      .catch((error) => {
        // Pages that keep a connection open never go idle; settle for load.
        if (!/Timeout/i.test(error.message)) throw error;
        return null;
      });
    if (response && response.status() >= 400) {
      throw new Error(`The app returned ${response.status()} for ${route || "/"}. Is it running?`);
    }
    await page.waitForTimeout(600);
    const png = await page.screenshot({ fullPage: true, type: "png" });
    return addShot(dataRoot, {
      slug,
      name: labelFor(route),
      dataUrl: `data:image/png;base64,${png.toString("base64")}`,
      imageWidth: png.readUInt32BE(16),
      imageHeight: png.readUInt32BE(20),
      device,
      cssWidth: viewport.width,
    });
  } finally {
    await browser.close();
  }
}
