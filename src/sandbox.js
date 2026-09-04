import "./tokens.css";
import "./sandbox.css";
import "./system.css";
import { candidateCount } from "./load-candidates.js";

const path = window.location.pathname;
const count = candidateCount();

function isActive(href) {
  if (href === "/") {
    return path === "/" || path.endsWith("/index.html");
  }
  return path.endsWith(href);
}

const links = [
  { href: "/", label: "Foundations" },
  { href: "/explorations.html", label: "Explorations" },
  { href: "/candidates.html", label: "Candidates", count },
];

const nav = document.querySelector("[data-sandbox-nav]");

if (nav) {
  nav.innerHTML = `
    <div class="sandbox-brand">
      <div class="sandbox-brand-name">Vanyshr</div>
      <div class="sandbox-brand-meta">design sandbox</div>
    </div>
    <div class="sandbox-links">
      ${links
        .map((link) => {
          const active = isActive(link.href) ? " is-active" : "";
          const badge =
            typeof link.count === "number"
              ? `<span class="sandbox-count">${link.count}</span>`
              : "";
          return `<a class="sandbox-link${active}" href="${link.href}">${link.label}${badge}</a>`;
        })
        .join("")}
    </div>
    <div class="sandbox-nav-foot">
      <div>v1 foundations · dark only</div>
      <div>Spec lives in design.md. Nothing here is copied into production.</div>
    </div>
  `;
}
