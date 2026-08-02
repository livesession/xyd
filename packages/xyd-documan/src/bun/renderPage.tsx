import { renderToString } from "react-dom/server";
import React from "react";
import * as path from "node:path";

import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";

import { seedGlobals, ShellProviders, getSettings, applyLocation } from "./render-tree";

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
    `</body></html>`
  );
}

export async function renderPage(slug: string): Promise<string> {
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

  const loaderData = {
    sidebarGroups, breadcrumbs, navlinks, slug, code, metadata, rawPage, editLink, canPassComponents, shellOnly: false,
  };

  applyLocation(slug, loaderData);
  const bodyHtml = renderToString(<ShellProviders loaderData={loaderData} />);

  // Data the client needs to hydrate the same tree. Use the CLEAN pre-theme
  // clone (appInit's __xydSettingsClone) — the live settings has React elements
  // injected into webeditor by the theme, which don't survive JSON. The client
  // theme rebuilds webeditor itself, matching the server.
  const data = {
    slug,
    settings: s,
    loaderData,
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
  const clientBundlePath = process.env.XYD_CLIENT_BUNDLE || "";

  async function serveCss(paths: (string | null)[]): Promise<Response> {
    let out = "";
    for (const p of paths) {
      if (!p) continue;
      const f = Bun.file(p);
      if (await f.exists()) out += (await f.text()) + "\n";
    }
    return new Response(out, { headers: { "content-type": "text/css; charset=utf-8" } });
  }

  const server = Bun.serve({
    port: Number(process.env.XYD_PORT ?? 5185),
    development: true,
    async fetch(req) {
      const url = new URL(req.url);
      if (CSS[url.pathname]) return serveCss(CSS[url.pathname]);
      if (url.pathname === "/_bun/client.js") {
        if (clientBundlePath) {
          return new Response(Bun.file(clientBundlePath), {
            headers: { "content-type": "text/javascript; charset=utf-8" },
          });
        }
        return new Response("/* no client bundle */", { headers: { "content-type": "text/javascript" } });
      }
      const slug = decodeURIComponent(url.pathname.replace(/^\//, ""));
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
  });
  console.error(`xyd bun dev (S1 render+hydrate) → ${server.url}  [theme: ${themeName}]`);
}
