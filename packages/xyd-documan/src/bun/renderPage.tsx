import { renderToString } from "react-dom/server";
import React from "react";
import * as path from "node:path";

import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";

import { createRouterStore, RouterProvider } from "@xyd-js/router";

import { seedGlobals, ShellProviders, getSettings, getSettingsClone, matchRoute, slugToPathname } from "./render-tree";
import { metaTagsHtml, robotsTxt, sitemapXml, sitemapRoutes } from "./seo";
import { themePackage, themeShortName } from "./themePkg";
import { stripReactElements, settingsBundleJs } from "./serialize";
import { resolveShellOnly, authFromCookie, accessAllowed, pageAccess } from "./accessControl";
import { matchPluginPage, pluginPageMeta } from "./pluginPages";
export { stripReactElements }; // re-exported for existing consumers

/**
 * Server render (SSR). Reuses the browser-safe tree in `render-tree.tsx` so the
 * SSR HTML matches the client hydration exactly. Bundled by `launcher.ts`
 * (target bun). `appInit` (in the launcher) already set the globals.
 */

function esc(x: any): string {
  return String(x).replace(/[&<>]/g, (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as any)[c]));
}

// The PROJECT icon set must reach the client before the (deferred) client module
// runs — the prebuilt client bundle is project-agnostic (bakes no icons). It is
// served as ONE cached asset (a `<script src>` that sets globalThis.__xydIconSet),
// NOT inlined per page: the default Iconify set is ~840KB, so inlining it into
// every page would bloat the SSG output ~N×. Build → /assets/iconset-<hash>.js
// (from __xydBuildAssets.iconSetJs); dev → /_xyd/iconset.js (served live).
function iconSetJs(): string {
  return "globalThis.__xydIconSet=" + JSON.stringify((globalThis as any).__xydIconSet || {}) + ";";
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
  const favicon = settings?.theme?.favicon;
  return (
    `<!doctype html><html data-color-scheme="${colorScheme}"><head>` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    // Same SEO/head surface as the static build shell (parity): color-scheme
    // prehydration, title, meta tags, favicon, theme.head.
    `<script>window.__xydColorSchemeSettings=${JSON.stringify({ defaultColorScheme: colorScheme })};${COLOR_SCHEME_SCRIPT}</script>` +
    `<title>${esc(title)}</title>` +
    metaTagsHtml(metadata, settings) +
    (favicon ? `<link rel="icon" href="${esc(favicon)}">` : "") +
    `<style>${layer}</style>` +
    `<link rel="stylesheet" href="/_xyd/theme.css">` +
    `<link rel="stylesheet" href="/_xyd/components.css">` +
    `<link rel="stylesheet" href="/_xyd/atlas.css">` +
    `<link rel="stylesheet" href="/_xyd/ui.css">` +
    themeHeadHtml(settings) +
    `</head><body>` +
    `<div id="root">${bodyHtml}</div>` +
    `<script src="/_xyd/settings.js"></script>` +
    `<script src="/_xyd/iconset.js"></script>` +
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
/** Derive the i18n locale from a (locale-pre-prefixed) slug — parity with
 *  plugin-docs getPathname(). Default locale for unprefixed slugs; the first
 *  segment when it's a declared non-default locale. "" when i18n is off. */
function deriveLocale(slug: string): string {
  const i18n = (globalThis as any).__xydI18n as { defaultLocale?: string; locales?: string[] } | undefined;
  if (!i18n?.locales?.length) return "";
  let locale = i18n.defaultLocale ?? "";
  const seg = (slug || "").replace(/^\/+/, "").split("/")[0];
  if (seg && i18n.locales.includes(seg) && seg !== i18n.defaultLocale) locale = seg;
  return locale;
}

export async function buildPageData(slug: string, opts: { shellOnly?: boolean } = {}) {
  slug = slug || "index";
  const s = getSettings();
  const locale = deriveLocale(slug);

  const props: any = await mapSettingsToProps(s, globalThis.__xydPagePathMapping, slug, undefined as any, locale);
  const { groups: sidebarGroups, breadcrumbs, navlinks, metadata } = props;

  // SECURITY (S3 SSG): a protected page with no server-side deploy adapter must
  // NEVER compile/emit its MDX into the static HTML — render an empty shell; the
  // client's ProtectedPageShell fetches the content chunk after auth.
  if (opts.shellOnly) {
    return {
      sidebarGroups, breadcrumbs, navlinks, slug, locale, code: "", metadata,
      rawPage: "", editLink: undefined, canPassComponents: false, shellOnly: true,
    };
  }

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
    sidebarGroups, breadcrumbs, navlinks, slug, locale, code, metadata, rawPage, editLink, canPassComponents, shellOnly: false,
  };
}

export async function renderPage(slug: string, search: string = "", cookieHeader: string | null = null): Promise<string> {
  slug = slug || "index";
  const s = getSettings();
  // Access control (Layer-1): a protected page the viewer can't access renders as
  // an empty shell — its MDX is never compiled into the HTML. Uses the request
  // cookie so an authenticated user gets the full server-rendered content.
  const shellOnly = resolveShellOnly(slug, cookieHeader);
  const loaderData = await buildPageData(slug, { shellOnly });
  const pathname = slugToPathname(slug); // index → "/" so home active-state hydrates
  const routeId = matchRoute(pathname, s?.navigation);

  // Per-request router store (in context, not module scope → concurrent-render
  // safe). Seed location.pathname/search to match the client's window.location
  // (index → "/", real query threaded through) so useLocation-driven active
  // state + query-synced Tabs hydrate identically. No loadPageData server-side;
  // getServerSnapshot returns this frozen snapshot.
  const store = createRouterStore({
    location: { pathname, search: search || "", hash: "" },
    matches: [{ id: routeId, pathname, params: {}, data: loaderData }],
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
  // Per-page data only — settings/settingsClone ship in the external settings
  // asset (renderShell references it), NOT inlined per page, so the raw all-locale
  // settings ("i18n:" keys, per-locale overrides) never land in the page HTML.
  const data = {
    slug,
    loaderData,
    routeId,
    userComponents: [], // plugin components not serialized in this slice
    userHooks: {},
  };
  return renderShell({ settings: s, bodyHtml, data: stripReactElements(data) });
}

// ---- CSS + client-bundle serving ----

export function cssResolver(HOST: string, themePkg: string) {
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
    "/_xyd/theme.css": [tryResolve(`${themePkg}/index.css`) || pkgDist(themePkg, "dist/index.css")],
    "/_xyd/components.css": [tryResolve("@xyd-js/components/index.css") || pkgDist("@xyd-js/components", "dist/index.css")],
    "/_xyd/atlas.css": [
      tryResolve("@xyd-js/atlas/index.css") || pkgDist("@xyd-js/atlas", "index.css"),
      tryResolve("@xyd-js/atlas/tokens.css") || pkgDist("@xyd-js/atlas", "tokens.css"),
      tryResolve("@xyd-js/atlas/styles.css") || pkgDist("@xyd-js/atlas", "styles.css"),
    ],
    "/_xyd/ui.css": [tryResolve("@xyd-js/ui/index.css") || pkgDist("@xyd-js/ui", "dist/index.css")],
  } as Record<string, (string | null)[]>;
}

// ---- S3: static build (SSG) render ----

// Synchronous color-scheme resolver (mirrors host/app/scripts/colorSchemeScript.ts).
// Runs before paint: honors the saved preference / OS setting, so a static (MPA)
// site doesn't flash the wrong scheme on every navigation.
const COLOR_SCHEME_SCRIPT =
  `(function(){try{var s=window.__xydColorSchemeSettings||{};var d=s.defaultColorScheme;` +
  `var t=localStorage.getItem('xyd-color-scheme')||d||'auto';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;` +
  `document.documentElement.setAttribute('data-color-scheme',t==='auto'?(m?'dark':'light'):t)}` +
  `catch(e){document.documentElement.setAttribute('data-color-scheme',window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}})();`;

/** Serialize settings.theme.head (["script",{src}] / ["meta",{...}] / ["script",{},"code"]).
 *  Carries site-verification tags, analytics/third-party scripts, plugin head. */
function themeHeadHtml(settings: any): string {
  const head = settings?.theme?.head;
  if (!Array.isArray(head)) return "";
  const voidTags = new Set(["meta", "link", "base"]);
  return head
    .map((entry: any) => {
      if (!Array.isArray(entry)) return "";
      const [tag, attrs, inner] = entry;
      if (!tag) return "";
      const a =
        attrs && typeof attrs === "object"
          ? Object.entries(attrs)
              .map(([k, v]) => (v === true ? ` ${k}` : v == null || v === false ? "" : ` ${k}="${esc(String(v))}"`))
              .join("")
          : "";
      return voidTags.has(tag) ? `<${tag}${a}>` : `<${tag}${a}>${inner || ""}</${tag}>`;
    })
    .join("");
}

/** Production HTML shell for `xyd build`: hashed asset hrefs (from
 *  globalThis.__xydBuildAssets), color-scheme prehydration script, SEO meta,
 *  favicon, theme.head — NO live-reload script. */
function renderStaticShell({ settings, bodyHtml, data }: any): string {
  const a = (globalThis as any).__xydBuildAssets as {
    clientJs: string; cssLinks: string[]; iconSetJs?: string; settingsJs?: string;
  };
  const defaultColorScheme = settings?.theme?.appearance?.colorScheme || "os";
  const metadata = data.loaderData.metadata;
  const title = metadata?.seoTitle || metadata?.title || settings?.seo?.title || "xyd";
  const favicon = settings?.theme?.favicon;
  const layer =
    "@layer reset, defaults, defaultfix, components, fabric, templates, decorators, themes, themedecorator, presets, user, overrides;";
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    `<!doctype html><html data-color-scheme="${defaultColorScheme}"><head>` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    // Color scheme resolved synchronously before paint (no FOUC on MPA nav).
    `<script>window.__xydColorSchemeSettings=${JSON.stringify({ defaultColorScheme })};${COLOR_SCHEME_SCRIPT}</script>` +
    `<title>${esc(title)}</title>` +
    metaTagsHtml(metadata, settings) +
    (favicon ? `<link rel="icon" href="${esc(favicon)}">` : "") +
    `<style>${layer}</style>` + // @layer declaration before the layer-using stylesheets
    (a?.cssLinks || []).map((h: string) => `<link rel="stylesheet" href="${h}">`).join("") +
    themeHeadHtml(settings) +
    `</head><body>` +
    `<div id="root">${bodyHtml}</div>` +
    (a?.settingsJs ? `<script src="${esc(a.settingsJs)}"></script>` : "") +
    (a?.iconSetJs ? `<script src="${esc(a.iconSetJs)}"></script>` : "") +
    `<script id="__xyd_data" type="application/json">${json}</script>` +
    `<script type="module" src="${a?.clientJs || "/assets/client.js"}"></script>` +
    `</body></html>`
  );
}

/** Build-time per-slug render. Mirrors renderPage() but uses the static shell and
 *  a caller-supplied shellOnly (protected pages). `renderToString` (not
 *  renderToStaticMarkup) so bootClient's hydrateRoot matches. */
export async function renderPageStatic(slug: string, opts: { shellOnly?: boolean } = {}): Promise<string> {
  slug = slug || "index";
  const s = getSettings();
  const loaderData = await buildPageData(slug, opts);
  const pathname = slugToPathname(slug);
  const routeId = matchRoute(pathname, s?.navigation);
  const store = createRouterStore({
    location: { pathname, search: "", hash: "" },
    matches: [{ id: routeId, pathname, params: {}, data: loaderData }],
  });
  const bodyHtml = renderToString(
    <RouterProvider store={store}>
      <ShellProviders />
    </RouterProvider>
  );
  const data = {
    slug,
    loaderData,
    routeId,
    userComponents: [],
    userHooks: {},
  };
  return renderStaticShell({ settings: s, bodyHtml, data: stripReactElements(data) });
}

/** Loader payload for a plugin page (login/auth callback). No docs data — the flag
 *  `pluginPage` makes ShellProviders render the registered component instead. */
function pluginPageLoaderData(route: string) {
  return {
    pluginPage: route,
    slug: route.replace(/^\/+/, "") || "index",
    locale: "",
    metadata: pluginPageMeta(route),
    sidebarGroups: [],
    breadcrumbs: [],
    navlinks: {},
    code: "",
    rawPage: "",
    editLink: undefined,
    canPassComponents: false,
  };
}

function renderPluginTree(route: string): { bodyHtml: string; data: any } {
  const loaderData = pluginPageLoaderData(route);
  const store = createRouterStore({
    location: { pathname: route, search: "", hash: "" },
    matches: [{ id: route, pathname: route, params: {}, data: loaderData }],
  });
  const bodyHtml = renderToString(
    <RouterProvider store={store}>
      <ShellProviders />
    </RouterProvider>
  );
  return { bodyHtml, data: { slug: loaderData.slug, loaderData, routeId: route, userComponents: [], userHooks: {} } };
}

/** Dev: render a plugin page (login/auth callback) to a full HTML document. */
export async function renderPluginPage(route: string): Promise<string> {
  const s = getSettings();
  const { bodyHtml, data } = renderPluginTree(route);
  return renderShell({ settings: s, bodyHtml, data: stripReactElements(data) });
}

/** Build: render a plugin page with the static (hashed-asset) shell. */
export async function renderPluginPageStatic(route: string): Promise<string> {
  const s = getSettings();
  const { bodyHtml, data } = renderPluginTree(route);
  return renderStaticShell({ settings: s, bodyHtml, data: stripReactElements(data) });
}

/** Seed the render globals for a static build (same head as start(), no serve). */
export function seedForBuild(ThemeCtor: any) {
  globalThis.__xydSettings = stripReactElements(globalThis.__xydSettings);
  if (globalThis.__xydSettingsClone) {
    globalThis.__xydSettingsClone = stripReactElements(globalThis.__xydSettingsClone);
  }
  seedGlobals(ThemeCtor);
}

/** Called by the launcher's generated server entry with the theme class. */
/** Vite-parity `server.allowedHosts` enforcement (advanced.vite.server.allowedHosts).
 *  Loopback + IP literals are always allowed; `.example.com` entries match the
 *  apex + any subdomain. Only enforced when the setting is explicitly configured
 *  (undefined → allow all, so normal/remote dev isn't broken). */
export function hostAllowed(hostHeader: string | null, allowed: string[] | boolean | undefined): boolean {
  if (allowed === true) return true;
  if (!hostHeader) return true; // no Host header (e.g. curl) — lenient, like a missing origin
  let host = hostHeader.trim();
  const v6 = host.match(/^\[(.+)\](?::\d+)?$/); // bracketed IPv6: [::1]:5175
  host = (v6 ? v6[1] : host.replace(/:\d+$/, "")).toLowerCase();
  if (host === "localhost" || host === "0.0.0.0") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // IPv4 literal
  if (host.includes(":")) return true; // IPv6 literal
  for (const a of Array.isArray(allowed) ? allowed : []) {
    const e = String(a).toLowerCase();
    if (e === host) return true;
    if (e[0] === "." && (host === e.slice(1) || host.endsWith(e))) return true;
  }
  return false;
}

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
  const rawName = s?.theme?.name || "poetry";
  const themeName = themeShortName(rawName);
  const themePkg = themePackage(rawName);
  // In the compiled binary the CSS is embedded (Bun.file reads the bunfs paths in
  // __xydDevCss directly); otherwise resolve from HOST node_modules as usual.
  const CSS = (globalThis as any).__xydDevCss || cssResolver(HOST, themePkg);
  const CWD = process.cwd();
  const basename = (s?.advanced?.basename || "").replace(/\/$/, "");

  // Strip the basename (prefix OR exact match) from a request pathname → slug.
  // The exact-basename case (`/docs` with no trailing slash) must map to the
  // index, not the literal slug "docs" (which has no page → 500).
  const deriveSlug = (pathname: string): string => {
    let p = decodeURIComponent(pathname);
    if (basename) {
      if (p === basename || p === basename + "/") p = "/";
      else if (p.startsWith(basename + "/")) p = p.slice(basename.length);
    }
    return p.replace(/^\/+/, ""); // "" (root) → renderPage/buildPageData default to "index"
  };

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
      // advanced.vite.server.allowedHosts (Vite parity): reject requests whose
      // Host header isn't allowlisted (DNS-rebinding guard). Read live so a hot
      // settings edit takes effect; only enforced when explicitly configured.
      const allowedHosts = getSettings()?.advanced?.vite?.server?.allowedHosts;
      if (allowedHosts !== undefined && !hostAllowed(req.headers.get("host"), allowedHosts)) {
        return new Response("Host not allowed", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      // Live-reload channel: the watcher's rebuild() broadcasts "reload" here.
      if (url.pathname === "/_xyd/livereload") {
        return srv.upgrade(req) ? undefined : new Response("upgrade failed", { status: 400 });
      }
      if (CSS[url.pathname]) return serveCss(CSS[url.pathname]);
      if (url.pathname === "/_xyd/iconset.js") {
        // Project icon set as one cached script (reflects hot reloads — read live).
        return new Response(iconSetJs(), { headers: { "content-type": "text/javascript; charset=utf-8" } });
      }
      if (url.pathname === "/_xyd/settings.js") {
        // The full settings as an EXTERNAL asset (not inlined per page) so raw
        // all-locale settings never land in the page HTML. Read live (hot reload).
        return new Response(settingsBundleJs(getSettings(), getSettingsClone()), {
          headers: { "content-type": "text/javascript; charset=utf-8" },
        });
      }
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
        const rawSlug = url.searchParams.get("slug") || "index";
        const dslug = deriveSlug("/" + rawSlug.replace(/^\/+/, "")) || "index";
        try {
          const st = getSettings();
          const shellOnly = resolveShellOnly(dslug, req.headers.get("cookie"));
          const loaderData = await buildPageData(dslug, { shellOnly });
          // stripReactElements is mandatory — metadata/sidebarGroups can't cross JSON otherwise.
          return Response.json(stripReactElements({ loaderData, routeId: matchRoute(slugToPathname(dslug), st?.navigation) }));
        } catch (e: any) {
          return new Response(JSON.stringify({ error: String(e?.message || e) }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }
      }
      // Access-control: compiled content chunk for a protected page, fetched by
      // ProtectedPageShell AFTER the client confirms auth. Re-checks the cookie
      // server-side so an unauthorized viewer gets 401, never the content.
      if (url.pathname.startsWith("/__xyd_protected_content/") && url.pathname.endsWith(".js")) {
        const enc = url.pathname.slice("/__xyd_protected_content/".length, -3);
        const pslug = deriveSlug("/" + decodeURIComponent(enc).replace(/^\/+/, "")) || "index";
        const access = pageAccess(pslug);
        const { authed, groups } = authFromCookie(req.headers.get("cookie"));
        if (access && access !== "public" && !accessAllowed(access, authed, groups)) {
          return new Response("Unauthorized", { status: 401, headers: { "content-type": "text/plain" } });
        }
        try {
          const data = await buildPageData(pslug, { shellOnly: false });
          return new Response(data.code || "", { headers: { "content-type": "text/javascript; charset=utf-8" } });
        } catch {
          return new Response("", { status: 404, headers: { "content-type": "text/javascript" } });
        }
      }
      // SEO artifacts — parity with the static build (buildStatic emits these to
      // disk; the dev server generates them on the fly from the same helpers).
      if (url.pathname === "/robots.txt") {
        return new Response(robotsTxt(getSettings(), url.origin), { headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      if (url.pathname === "/sitemap.xml") {
        const routes = sitemapRoutes(
          Object.keys(globalThis.__xydPagePathMapping || {}),
          (globalThis as any).__xydAccessMap || {},
          !!(globalThis as any).__xydHasIndexPage
        );
        const xml = sitemapXml(getSettings(), routes, url.origin);
        return xml
          ? new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } })
          : new Response("", { status: 404, headers: { "content-type": "text/plain" } });
      }
      if (url.pathname === "/llms.txt") {
        const raw = ((globalThis as any).__xydRawRouteFiles || {})["/llms.txt"];
        return raw
          ? new Response(raw, { headers: { "content-type": "text/plain; charset=utf-8" } })
          : new Response("", { status: 404, headers: { "content-type": "text/plain" } });
      }

      // Plugin pages (access-control /login, /auth/jwt-callback, …) — render the
      // registered plugin component instead of a docs page. Basename-stripped first.
      let acPath = decodeURIComponent(url.pathname);
      if (basename && acPath.startsWith(basename + "/")) acPath = acPath.slice(basename.length);
      const pluginRoute = matchPluginPage(acPath);
      if (pluginRoute) {
        try {
          return new Response(await renderPluginPage(pluginRoute), { headers: { "content-type": "text/html; charset=utf-8" } });
        } catch (e: any) {
          console.error(`render error for plugin page ${pluginRoute}:`, e);
          return new Response(`<pre>plugin page error ${pluginRoute}\n\n${e?.stack || e}</pre>`, {
            status: 500,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
      }

      const asset = await serveStatic(url.pathname);
      if (asset) return asset;
      const slug = deriveSlug(url.pathname);
      // No page for this slug? The root with no index page → redirect to the first
      // page (so `xyd dev` opening `/` lands somewhere); anything else (a stray
      // browser request like /favicon.ico or a service worker /__sw__.js, or a real
      // 404) → a QUIET 404, not a 500 with a scary stack trace.
      const mapping: Record<string, string> = (globalThis as any).__xydPagePathMapping || {};
      if (!mapping[slug || "index"]) {
        if (slug === "" || slug === "index") {
          const first = Object.keys(mapping).find((k) => k !== "index");
          if (first) return Response.redirect(`/${first}`, 302);
        }
        return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
      }
      try {
        return new Response(await renderPage(slug, url.search, req.headers.get("cookie")), { headers: { "content-type": "text/html; charset=utf-8" } });
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
