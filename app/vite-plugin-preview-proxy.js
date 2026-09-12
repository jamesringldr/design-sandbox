import http from "node:http";
import https from "node:https";
import { decodePreviewOrigin, isAllowedPreviewOrigin } from "./src/previewUrl.js";

const PREFIX = "/vp/";

const VITE_CLIENT_STUB = `const sheets = new Map();
export function updateStyle(id, content) {
  let style = sheets.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-vite-dev-id", id);
    document.head.appendChild(style);
    sheets.set(id, style);
  }
  style.textContent = content;
}
export function removeStyle(id) {
  const style = sheets.get(id);
  if (style) {
    style.remove();
    sheets.delete(id);
  }
}
export function createHotContext() {
  return {
    accept() {},
    decline() {},
    dispose() {},
    invalidate() {},
    prune() {},
    on() {},
    off() {},
    send() {},
    data: {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay extends HTMLElement {}
if (typeof customElements !== "undefined" && !customElements.get("vite-error-overlay")) {
  customElements.define("vite-error-overlay", ErrorOverlay);
}
`;

function parsePreview(url) {
  if (!url?.startsWith(PREFIX)) return null;
  const parsed = new URL(url, "http://127.0.0.1");
  const bare = parsed.pathname.slice(PREFIX.length);
  const slash = bare.indexOf("/");
  const token = slash === -1 ? bare : bare.slice(0, slash);
  const rest = slash === -1 ? "/" : bare.slice(slash);
  const origin = decodePreviewOrigin(token);
  if (!origin || !isAllowedPreviewOrigin(origin)) return null;
  return {
    origin,
    path: `${rest || "/"}${parsed.search}`,
    pathname: rest || "/",
    prefix: `${PREFIX}${token}`,
  };
}

function injectHead(html, snippet) {
  if (html.includes("<head>")) return html.replace("<head>", `<head>${snippet}`);
  return snippet + html;
}

function injectImportMap(html, prefix) {
  const map = JSON.stringify({
    imports: {
      "/@vite/client": `${prefix}/@vite/client`,
      "/@react-refresh": `${prefix}/@react-refresh`,
      "/src/": `${prefix}/src/`,
      "/node_modules/": `${prefix}/node_modules/`,
      "/@fs/": `${prefix}/@fs/`,
      "/@id/": `${prefix}/@id/`,
      "/@vite/": `${prefix}/@vite/`,
    },
  });
  return injectHead(html, `<script type="importmap">${map}</script>`);
}

function stripSourceMaps(content) {
  return content.replace(/\/\/[#@][ \t]*source(?:Mapping)?URL=.*$/gm, "");
}

function rebaseFsUrls(content, prefix) {
  return content.replace(/(['"])\/@fs\//g, `$1${prefix}/@fs/`);
}

function rebaseHtmlAttrs(content, prefix) {
  return content.replace(
    /(\s(?:src|href|action)=['"])\/(?!\/)/gi,
    `$1${prefix}/`
  );
}

function rebaseCssUrls(content, prefix) {
  return content.replace(/(url\(\s*['"]?)\/(?!\/)/g, `$1${prefix}/`);
}

function injectRouterBasename(content, prefix) {
  return content.replace(
    /\b(jsxDEV|jsx|_jsx|_jsxDEV|createElement)\(\s*BrowserRouter\s*,\s*\{(?!\s*basename\s*:)/g,
    `$1(BrowserRouter, { basename: ${JSON.stringify(prefix)}, `
  );
}

function stripViteClient(html) {
  return html.replace(
    /<script[^>]*src=["'][^"']*@vite\/client[^"']*["'][^>]*><\/script>/g,
    ""
  );
}

function rewriteBody(body, type, prefix) {
  if (/html/.test(type)) {
    return injectImportMap(
      rebaseCssUrls(
        rebaseHtmlAttrs(stripViteClient(body), prefix),
        prefix
      ),
      prefix
    );
  }
  if (/javascript|ecmascript|module/.test(type)) {
    return injectRouterBasename(
      rebaseFsUrls(rebaseCssUrls(stripSourceMaps(body), prefix), prefix),
      prefix
    );
  }
  if (/css/.test(type)) {
    return rebaseCssUrls(stripSourceMaps(body), prefix);
  }
  return body;
}

function isTextType(type) {
  return /html|javascript|css|json|xml|svg|text\/plain|module/.test(type || "");
}

function isViteClientPath(pathname) {
  const path = String(pathname || "").split("?")[0];
  return path === "/@vite/client" || path === "/@vite/client/";
}

function altLoopback(url) {
  const next = new URL(url);
  if (next.hostname === "127.0.0.1") next.hostname = "localhost";
  else if (next.hostname === "localhost") next.hostname = "127.0.0.1";
  else return null;
  return next;
}

function proxyPreview(req, res) {
  const parsed = parsePreview(req.url);
  if (!parsed) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "text/plain");
    res.end("Invalid preview origin.");
    return;
  }

  if (isViteClientPath(parsed.pathname)) {
    res.writeHead(200, {
      "Content-Type": "text/javascript",
      "Cache-Control": "no-cache",
    });
    res.end(VITE_CLIENT_STUB);
    return;
  }

  const first = new URL(parsed.path, parsed.origin);

  function fail() {
    res.statusCode = 502;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      `<!doctype html><html><body style="font:13px/1.4 sans-serif;padding:16px;color:#a3a3a3;background:#282828">Can't reach ${parsed.origin}. Start the app, then reload this view.</body></html>`
    );
  }

  function onIncoming(incoming) {
    const type = String(incoming.headers["content-type"] || "");
    const outHeaders = { ...incoming.headers };
    delete outHeaders["content-encoding"];
    delete outHeaders["content-length"];
    delete outHeaders["etag"];
    delete outHeaders["last-modified"];
    outHeaders["cache-control"] = "no-store";
    if (outHeaders.location) {
      try {
        const loc = new URL(outHeaders.location, parsed.origin);
        if (loc.origin === parsed.origin) {
          outHeaders.location = `${parsed.prefix}${loc.pathname}${loc.search}`;
        }
      } catch {
        /* keep */
      }
    }
    if (!isTextType(type)) {
      res.writeHead(incoming.statusCode || 502, outHeaders);
      incoming.pipe(res);
      return;
    }
    const chunks = [];
    incoming.on("data", (chunk) => chunks.push(chunk));
    incoming.on("end", () => {
      let body = Buffer.concat(chunks).toString("utf8");
      body = rewriteBody(body, type, parsed.prefix);
      res.writeHead(incoming.statusCode || 200, outHeaders);
      res.end(body);
    });
  }

  function connect(url, retried) {
    const lib = url.protocol === "https:" ? https : http;
    const headers = { ...req.headers, host: url.host };
    delete headers["accept-encoding"];
    delete headers["if-none-match"];
    delete headers["if-modified-since"];
    headers["accept-encoding"] = "identity";
    const up = lib.request(url, { method: req.method, headers }, onIncoming);
    up.on("error", (error) => {
      const alt = !retried && error.code === "ECONNREFUSED" ? altLoopback(url) : null;
      if (alt) {
        connect(alt, true);
        return;
      }
      fail();
    });
    if (req.method === "GET" || req.method === "HEAD") up.end();
    else req.pipe(up);
  }

  connect(first, false);
}

export default function previewProxyPlugin() {
  return {
    name: "preview-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(PREFIX)) {
          next();
          return;
        }
        proxyPreview(req, res);
      });
    },
  };
}
