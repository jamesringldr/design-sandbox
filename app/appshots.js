// AppShots storage. Screenshots and their converted pages live in
// data/projects/<slug>/appshots/:
//   appshots.json     [{ id, label, device, width, height, image, createdAt }]
//   <id>.<png|jpg|webp>  the uploaded screenshot
//   <id>.html          the converted page, written by a Claude Code session
// A shot is "converted" when its <id>.html exists.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const FILE = /^[a-z0-9-]+\.(png|jpe?g|webp|html)$/;
const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const CONTENT_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  html: "text/html; charset=utf-8",
};
// CSS widths a converted page is designed at.
export const DEVICE_WIDTH = { mobile: 393, desktop: 1440 };

function shotsDir(dataRoot, slug) {
  if (!SLUG.test(String(slug || ""))) throw new Error("Invalid project slug.");
  return path.join(dataRoot, "projects", slug, "appshots");
}

async function readIndex(dir) {
  try {
    return JSON.parse(await fs.readFile(path.join(dir, "appshots.json"), "utf8"));
  } catch {
    return [];
  }
}

async function writeIndex(dir, shots) {
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "appshots.json");
  await fs.writeFile(`${file}.tmp`, `${JSON.stringify(shots, null, 2)}\n`);
  await fs.rename(`${file}.tmp`, file);
}

async function exists(file) {
  return fs.stat(file).then(() => true, () => false);
}

export async function listShots(dataRoot, slug) {
  const dir = shotsDir(dataRoot, slug);
  const shots = await readIndex(dir);
  return Promise.all(
    shots.map(async (shot) => ({
      ...shot,
      converted: await exists(path.join(dir, `${shot.id}.html`)),
    }))
  );
}

export async function addShot(dataRoot, { slug, name, dataUrl, imageWidth, imageHeight, device: forced, cssWidth }) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(String(dataUrl || ""));
  if (!match) throw new Error("Upload a PNG, JPEG, or WebP image.");
  const w = Number(imageWidth);
  const h = Number(imageHeight);
  if (!(w > 0 && h > 0)) throw new Error("Image size is missing.");
  const dir = shotsDir(dataRoot, slug);
  await fs.mkdir(dir, { recursive: true });
  const id = `shot-${randomUUID().slice(0, 8)}`;
  const image = `${id}.${IMAGE_TYPES[match[1]]}`;
  await fs.writeFile(path.join(dir, image), Buffer.from(match[2], "base64"));
  const device = DEVICE_WIDTH[forced] ? forced : w / h < 1 ? "mobile" : "desktop";
  // Captures know their real CSS width; uploads use the device default.
  const width = Number(cssWidth) > 0 ? Math.round(Number(cssWidth)) : DEVICE_WIDTH[device];
  const shot = {
    id,
    label: String(name || "Screenshot").replace(/\.(png|jpe?g|webp)$/i, "").slice(0, 80),
    device,
    width,
    height: Math.round((width * h) / w),
    image,
    createdAt: new Date().toISOString(),
  };
  await writeIndex(dir, [...(await readIndex(dir)), shot]);
  return shot;
}

export async function updateShot(dataRoot, { slug, id, label, device }) {
  const dir = shotsDir(dataRoot, slug);
  const shots = await readIndex(dir);
  const shot = shots.find((row) => row.id === id);
  if (!shot) throw new Error("Shot not found.");
  if (typeof label === "string" && label.trim()) shot.label = label.trim().slice(0, 80);
  if (device && device !== shot.device && DEVICE_WIDTH[device]) {
    shot.height = Math.round((DEVICE_WIDTH[device] * shot.height) / shot.width);
    shot.width = DEVICE_WIDTH[device];
    shot.device = device;
  }
  await writeIndex(dir, shots);
  return shot;
}

export async function removeShot(dataRoot, { slug, id }) {
  const dir = shotsDir(dataRoot, slug);
  const shots = await readIndex(dir);
  const shot = shots.find((row) => row.id === id);
  if (!shot) return { removed: false };
  await Promise.all(
    [shot.image, `${id}.html`].map((file) => fs.rm(path.join(dir, file), { force: true }))
  );
  await writeIndex(dir, shots.filter((row) => row.id !== id));
  return { removed: true };
}

export async function readShotFile(dataRoot, { slug, file }) {
  if (!FILE.test(String(file || ""))) throw new Error("Invalid file name.");
  const body = await fs.readFile(path.join(shotsDir(dataRoot, slug), file));
  return { body, type: CONTENT_TYPES[file.split(".").pop()] };
}
