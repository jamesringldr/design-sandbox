import "./sandbox.js";
import { listCandidates } from "./load-candidates.js";

const mount = document.querySelector("[data-candidates]");
const empty = document.querySelector("[data-empty]");

if (!mount) {
  throw new Error("Candidates mount missing");
}

const candidates = listCandidates();

if (empty) {
  empty.hidden = candidates.length > 0;
}

for (const candidate of candidates) {
  const parsed = new DOMParser().parseFromString(candidate.html, "text/html");
  const article = parsed.querySelector("[data-name]") ?? parsed.body;
  const name = article.getAttribute("data-name") ?? candidate.file.replace(/\.html$/, "");
  const workflow = article.getAttribute("data-workflow") ?? "unspecified";
  const note = article.getAttribute("data-note") ?? "";

  const frame = document.createElement("section");
  frame.className = "candidate-frame";
  frame.innerHTML = `
    <header class="candidate-frame-head">
      <div>
        <div class="type-label">${escapeHtml(workflow)}</div>
        <div class="type-heading" style="margin-top: 6px;">${escapeHtml(name)}</div>
        ${note ? `<div class="type-caption" style="margin-top: 4px;">${escapeHtml(note)}</div>` : ""}
      </div>
      <div class="type-data" style="color: var(--text-muted);">${escapeHtml(candidate.file)}</div>
    </header>
    <div class="candidate-frame-body"></div>
  `;

  const body = frame.querySelector(".candidate-frame-body");
  for (const child of [...parsed.body.childNodes]) {
    body.appendChild(document.importNode(child, true));
  }

  mount.appendChild(frame);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
