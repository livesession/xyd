import { renderToString } from "react-dom/server";
import React from "react";
import * as path from "node:path";

import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";

import { createRouterStore, RouterProvider } from "@xyd-js/router";

import { seedGlobals, ShellProviders, getSettings, getSettingsClone, matchRoute } from "./render-tree";

/**
 * Server render (SSR). Reuses the browser-safe tree in `render-tree.tsx` so the
 * SSR HTML matches the client hydration exactly. Bundled by `launcher.ts`
 * (target bun). `appInit` (in the launcher) already set the globals.
 */

// React elements can't cross the SSR→CSR boundary via JSON (the $$typeof Symbol
// is dropped, leaving an invalid child object). Strip them before serializing;
// the client re-derives them (e.g. webeditor icons the theme injects).
function stripReactElements(o: any): any {
  if (o == null || typeof o !== "object") return o;
  if (React.isValidElement(o)) return null;
  // Already-broken serialized element (lost its $$typeof Symbol): shape {props, _owner|_store}.
  if (("_owner" in o || "_store" in o) && "props" in o) return null;
  if (Array.isArray(o)) return o.map(stripReactElements);
  const out: any = {};
  for (const k of Object.keys(o)) out[k] = stripReactElements(o[k]);
  return out;
}

function esc(x: any): string {
  return String(x).replace(/[&<>]/g, (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as any)[c]));
}

// Live-reload client: connects to /_xyd/livereload, reloads on a "reload"
// message (broadcast by the watcher's rebuild), and — after the socket drops (a
// full server restart) — reloads once it reconnects. Reconnect loop keeps it
// resilient across restarts. This module only ever runs inside the Bun dev
// server (start()), so it's always injected — do NOT gate on NODE_ENV, which
// `.env.production` can set even during `xyd dev` and would silently break HMR.
const LIVE_RELOAD =
  `<script>(function(){var t,seen=false;function c(){` +
  `var ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/_xyd/livereload');` +
  `ws.onopen=function(){if(seen)location.reload();};` +
  `ws.onmessage=function(e){if(e.data==='reload')location.reload();};` +
  `ws.onclose=function(){seen=true;clearTimeout(t);t=setTimeout(c,1000);};` +
  `ws.onerror=function(){try{ws.close();}catch(_){}}}c();})();</script>`;

function renderShell({ settings, bodyHtml, data }: any): string {
  const colorScheme = settings?.theme?.appearance?.colorScheme || "os";
  const metadata = data.loaderData.metadata;
  const title = metadata?.seoTitle || metadata?.title || settings?.seo?.title || "xyd";
  const layer =
    "@layer reset, defaults, defaultfix, components, fabric, templates, decorators, themes, themedecorator, presets, user, overrides;";
  const json = JSON.stringify(data).replace(/</g, "\\u003c"); // safe inside <script>
  return (
    `<!doctype html><html data-color-scheme="${colorScheme}"><head>` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(title)}</title>` +
    `<style>${layer}</style>` +
    `<link rel="stylesheet" href="/_xyd/theme.css">` +
    `<link rel="stylesheet" href="/_xyd/components.css">` +
    `<link rel="stylesheet" href="/_xyd/atlas.css">` +
    `<link rel="stylesheet" href="/_xyd/ui.css">` +
    `</head><body>` +
    `<div id="root">${bodyHtml}</div>` +
    `<script id="__xyd_data" type="application/json">${json}</script>` +
    `<script type="module" src="/_bun/client.js"></script>` +
    LIVE_RELOAD +
    `</body></html>`
  );
}

/**
 * Build the per-route loader data — the same payload for the SSR HTML route AND
 * the client-nav JSON endpoint (`GET /_xyd/data`), so both are byte-identical.
 * Pure function of `slug` + the live server globals; ContentFS reads files fresh
 * per request, so the watcher's reinit/reseed keeps it current with no caching.
 */
export async function buildPageData(slug: string) {
  slug = slug || "index";
  const s = getSettings();
  const locale = "";

  const props: any = await mapSettingsToProps(s, globalThis.__xydPagePathMapping, slug, undefined as any, locale);
  const { groups: sidebarGroups, breadcrumbs, navlinks, metadata } = props;

  const md: any = await markdownPlugins(
    { maxDepth: metadata?.maxTocDepth || s?.theme?.writer?.maxTocDepth || 2 } as any,
    s
  );
  const remark = [...md.remarkPlugins];
  const rehype = [...md.rehypePlugins];
  if (globalThis.__xydUserMarkdownPlugins?.remark?.length) remark.push(globalThis.__xydUserMarkdownPlugins.remark as any);
  if (globalThis.__xydUserMarkdownPlugins?.rehype?.length) rehype.push(globalThis.__xydUserMarkdownPlugins.rehype as any);

  const fs = new ContentFS(s, remark, rehype, md.recmaPlugins, globalThis.__xydUserMarkdownPlugins?.remarkRehypeHandlers || {});
  const pagePath = globalThis.__xydPagePathMapping[slug];
  if (!pagePath) throw new Error(`No page mapping for slug: ${slug}`);
  const code = await fs.compile(pagePath);
  const rawPage = await fs.readRaw(pagePath);

  const baseUrl = s?.integrations?.editLink?.baseUrl;
  const editLink = baseUrl ? `${baseUrl}${pagePath}` : undefined;
  let canPassComponents = true;
  const apply = globalThis.__xydUserHooks?.applyComponents;
  if (apply) {
    const hooks = Array.isArray(apply) ? apply : [apply];
    for (const h of hooks) if (!h({ metadata })) canPassComponents = false;
  }

  return {
    sidebarGroups, breadcrumbs, navlinks, slug, code, metadata, rawPage, editLink, canPassComponents, shellOnly: false,
  };
}

export async function renderPage(slug: string): Promise<string> {
  slug = slug || "index";
  const s = getSettings();
  const loaderData = await buildPageData(slug);
  const routeId = matchRoute("/" + slug, s?.navigation);

  // Per-request router store (in context, not module scope → concurrent-render
  // safe). No loadPageData server-side; getServerSnapshot returns this frozen
  // snapshot so SSR markup === the client's first snapshot.
  const store = createRouterStore({
    location: { pathname: "/" + slug, search: "", hash: "" },
    matches: [{ id: routeId, pathname: "/" + slug, params: {}, data: loaderData }],
  });
  const bodyHtml = renderToString(
    <RouterProvider store={store}>
      <ShellProviders />
    </RouterProvider>
  );

  // Data the client needs to hydrate the same tree. Serialize BOTH settings the
  // theme/framework read: `settings` (the live, theme-mutated __xydSettings) AND
  // `settingsClone` (the PRISTINE appInit clone the theme reads via
  // __xydSettingsClone to rebuild webeditor). Plus `routeId` so the client store
  // uses the same match id without re-deriving.
  const data = {
    slug,
    settings: s,
    settingsClone: getSettingsClone() || s,
    loaderData,
    routeId,
    userComponents: [], // plugin components not serialized in this slice
    userHooks: {},
  };
  return renderShell({ settings: s, bodyHtml, data: stripReactElements(data) });
}

// ---- CSS + client-bundle serving ----

function cssResolver(HOST: string, themeName: string) {
  const tryResolve = (...specs: string[]) => {
    for (const s of specs) {
      try {
        return Bun.resolveSync(s, HOST);
      } catch {}
    }
    return null;
  };
  const pkgDist = (pkg: string, file: string) => {
    try {
      return Bun.resolveSync(pkg + "/package.json", HOST).replace(/package\.json$/, "") + file;
    } catch {
      return null;
    }
  };
  return {
    "/_xyd/theme.css": [tryResolve(`@xyd-js/theme-${themeName}/index.css`) || pkgDist(`@xyd-js/theme-${themeName}`, "dist/index.css")],
    "/_xyd/components.css": [tryResolve("@xyd-js/components/index.css") || pkgDist("@xyd-js/components", "dist/index.css")],
    "/_xyd/atlas.css": [
      tryResolve("@xyd-js/atlas/index.css") || pkgDist("@xyd-js/atlas", "index.css"),
      tryResolve("@xyd-js/atlas/tokens.css") || pkgDist("@xyd-js/atlas", "tokens.css"),
      tryResolve("@xyd-js/atlas/styles.css") || pkgDist("@xyd-js/atlas", "styles.css"),
    ],
    "/_xyd/ui.css": [tryResolve("@xyd-js/ui/index.css") || pkgDist("@xyd-js/ui", "dist/index.css")],
  } as Record<string, (string | null)[]>;
}

/** Called by the launcher's generated server entry with the theme class. */
export function start(ThemeCtor: any) {
  // Strip pre-resolved React-element icons from settings BEFORE the theme builds
  // webeditor — so the server render and the (element-stripped) client hydration
  // match. String-name icons are untouched and render on both sides.
  globalThis.__xydSettings = stripReactElements(globalThis.__xydSettings);
  if (globalThis.__xydSettingsClone) {
    globalThis.__xydSettingsClone = stripReactElements(globalThis.__xydSettingsClone);
  }
  seedGlobals(ThemeCtor);
  const s = getSettings();

  const HOST = process.env.XYD_HOST || path.resolve(process.cwd(), ".xyd/host");
  const themeName = (s?.theme?.name || "poetry").replace(/^npm:/, "");
  const CSS = cssResolver(HOST, themeName);
  const CWD = process.cwd();
  const basename = (s?.advanced?.basename || "").replace(/\/$/, "");

  // Static assets (logo, images, favicon) referenced by settings/content. Vite
  // served `public/` at root; here we strip the basename and try the path on
  // disk (both verbatim and under `public/`) before treating it as a page slug —
  // otherwise `/…/logo.svg` gets compiled as MDX and 500s.
  const STATIC_ROOTS = [path.resolve(CWD), path.resolve(CWD, "public")];
  async function serveStatic(pathname: string): Promise<Response | null> {
    let rel = decodeURIComponent(pathname);
    if (basename && rel.startsWith(basename + "/")) rel = rel.slice(basename.length);
    rel = rel.replace(/^\/+/, "");
    if (!rel || !/\.[a-zA-Z0-9]+$/.test(rel)) return null; // only extension'd paths
    // Path-traversal guard: `%2e%2e`/`%2f` survive URL normalization and decode
    // to `..`/`/` here — reject any `..` segment BEFORE touching the FS, then
    // confirm the resolved candidate stays under an allowed root. Bun.serve binds
    // 0.0.0.0, so an unguarded join would expose arbitrary files (e.g. .env).
    if (rel.split(/[\\/]/).some((seg) => seg === "..")) return null;
    const bare = rel.replace(/^public\//, "");
    for (const cand of [path.join(CWD, rel), path.join(CWD, "public", bare)]) {
      const abs = path.resolve(cand);
      if (!STATIC_ROOTS.some((root) => abs === root || abs.startsWith(root + path.sep))) continue;
      const f = Bun.file(abs);
      if (await f.exists()) return new Response(f);
    }
    return null;
  }

  async function serveCss(paths: (string | null)[]): Promise<Response> {
    let out = "";
    for (const p of paths) {
      if (!p) continue;
      const f = Bun.file(p);
      if (await f.exists()) out += (await f.text()) + "\n";
    }
    return new Response(out, { headers: { "content-type": "text/css; charset=utf-8" } });
  }

  const serveConfig: any = {
    development: true,
    async fetch(req: Request, srv: any) {
      const url = new URL(req.url);
      // Live-reload channel: the watcher's rebuild() broadcasts "reload" here.
      if (url.pathname === "/_xyd/livereload") {
        return srv.upgrade(req) ? undefined : new Response("upgrade failed", { status: 400 });
      }
      if (CSS[url.pathname]) return serveCss(CSS[url.pathname]);
      if (url.pathname === "/_bun/client.js") {
        // Read live — an icon rebuild re-bundles the client and updates this env,
        // so the next request (after a reload) serves the fresh bundle.
        const bundle = process.env.XYD_CLIENT_BUNDLE || "";
        if (bundle) {
          return new Response(Bun.file(bundle), {
            headers: { "content-type": "text/javascript; charset=utf-8" },
          });
        }
        return new Response("/* no client bundle */", { headers: { "content-type": "text/javascript" } });
      }
      if (url.pathname.startsWith("/_bun/") && url.pathname.endsWith(".map")) {
        // External sourcemap for the client bundle — the browser fetches this
        // (relative to /_bun/client.js) only when devtools open. One client
        // bundle → one map at `${XYD_CLIENT_BUNDLE}.map`.
        const map = (process.env.XYD_CLIENT_BUNDLE || "") + ".map";
        const f = Bun.file(map);
        if (map && (await f.exists())) {
          return new Response(f, { headers: { "content-type": "application/json; charset=utf-8" } });
        }
        return new Response("{}", { status: 404, headers: { "content-type": "application/json" } });
      }
      if (url.pathname === "/_xyd/data") {
        // Client-nav JSON: the SAME per-route payload renderPage builds, minus the
        // app-wide settings. buildPageData reads files fresh per request, so the
        // watcher's reinit/reseed keeps it current with no extra wiring.
        let dslug = decodeURIComponent(url.searchParams.get("slug") || "index");
        if (basename && ("/" + dslug).startsWith(basename + "/")) dslug = dslug.slice(basename.length);
        dslug = dslug.replace(/^\/+/, "") || "index";
        try {
          const st = getSettings();
          const loaderData = await buildPageData(dslug);
          // stripReactElements is mandatory — metadata/sidebarGroups can't cross JSON otherwise.
          return Response.json(stripReactElements({ loaderData, routeId: matchRoute("/" + dslug, st?.navigation) }));
        } catch (e: any) {
          return new Response(JSON.stringify({ error: String(e?.message || e) }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }
      }
      const asset = await serveStatic(url.pathname);
      if (asset) return asset;
      let slug = decodeURIComponent(url.pathname.replace(/^\//, ""));
      if (basename && ("/" + slug).startsWith(basename + "/")) slug = slug.slice(basename.length);
      slug = slug.replace(/^\//, "");
      try {
        return new Response(await renderPage(slug), { headers: { "content-type": "text/html; charset=utf-8" } });
      } catch (e: any) {
        console.error(`render error for /${slug}:`, e);
        return new Response(`<pre>render error for /${slug}\n\n${e?.stack || e}</pre>`, {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    },
    websocket: {
      open(ws: any) {
        ws.subscribe("xyd-reload");
      },
      message() {},
      close() {},
    },
  };

  // Bind with graceful port fallback: the default 5175 matches Vite, and a stale
  // server or a parallel dev instance makes Bun.serve throw EADDRINUSE
  // synchronously. Retry the next few ports instead of crashing the dev command.
  const basePort = Number(process.env.XYD_PORT ?? 5175);
  let server: any = null;
  for (let p = basePort; p < basePort + 20; p++) {
    try {
      server = Bun.serve({ ...serveConfig, port: p });
      if (p !== basePort) console.error(`xyd bun dev: port ${basePort} in use → using ${p}`);
      process.env.XYD_PORT = String(p); // a restart reuses the actually-bound port
      break;
    } catch (e: any) {
      if (e?.code === "EADDRINUSE" || /EADDRINUSE|address already in use/i.test(String(e?.message || e))) continue;
      throw e;
    }
  }
  if (!server) {
    console.error(`xyd bun dev: no free port in ${basePort}..${basePort + 19}. Set XYD_PORT.`);
    process.exit(1);
  }
  console.error(`xyd bun dev (S1 render+hydrate) → ${server.url}  [theme: ${themeName}]`);
  return server;
}

/**
 * Re-seed the render globals after a hot re-appInit (settings/api/appearance
 * change): re-strip pre-resolved React-element icons (or SSR≠CSR icon
 * hydration mismatches return) and re-point state.settings + rebuild the theme.
 * The running Bun.serve handler picks up the new settings on the next request
 * (renderPage reads getSettings() + the __xyd* globals live).
 */
export function reseed(ThemeCtor: any) {
  globalThis.__xydSettings = stripReactElements(globalThis.__xydSettings);
  if (globalThis.__xydSettingsClone) {
    globalThis.__xydSettingsClone = stripReactElements(globalThis.__xydSettingsClone);
  }
  seedGlobals(ThemeCtor);
}
