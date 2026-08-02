import React from "react";
import { renderToString } from "react-dom/server";
import * as path from "node:path";

import { Surfaces } from "@xyd-js/framework";
import { Framework, FrameworkPage, FwLink, FwLogo } from "@xyd-js/framework/react";
import { mapSettingsToProps } from "@xyd-js/framework/hydration";
import { ReactContent } from "@xyd-js/components/content";
import { IconProvider } from "@xyd-js/components/writer";
import { CoderProvider } from "@xyd-js/components/coder";
import { SearchButton } from "@xyd-js/components/system";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import AtlasXydPlugin from "@xyd-js/atlas/xydPlugin";
import { Composer } from "@xyd-js/composer";
import { Analytics, useAnalytics } from "@xyd-js/analytics";
import { markdownPlugins } from "@xyd-js/content/md";
import { ContentFS } from "@xyd-js/content";

import { useLocation, useNavigate, useNavigation, setLocation, setMatches } from "./rr-shim";
import { mdxContent } from "./mdx";

/**
 * The S1 render (SSR-only slice). This module is bundled by `bun/launcher.ts`
 * with a build-time `onResolve` plugin that resolves react/@xyd-js/theme from
 * `.xyd/host` (one deduped react) and aliases `react-router` → `./rr-shim`.
 * `appInit` runs in the launcher (documan dist) and sets the globals we read.
 */

let theme: any;
let settings: any;
let surfaces: Surfaces;
const loadProvider = async () => null;
const iconSet = {};

function DocsBody({ loaderData }: { loaderData: any }) {
  const analytics = useAnalytics();
  const themeContent = theme.reactContentComponents();
  const themeFile = theme.reactFileComponents();
  const globalAPI = { analytics };

  const content = mdxContent(loaderData.code, themeContent, themeFile, globalAPI);
  const contentOriginal = mdxContent(loaderData.code, themeContent, undefined, globalAPI);
  const ContentOriginal = contentOriginal.component;
  const { Page } = theme;

  let userComponents: any = {};
  if (loaderData.canPassComponents) {
    userComponents = (globalThis.__xydUserComponents || []).reduce((a: any, c: any) => {
      a[c.name] = c.component;
      return a;
    }, {});
  }

  return (
    <FrameworkPage
      metadata={content.metadata}
      breadcrumbs={loaderData.breadcrumbs}
      rawPage={loaderData.rawPage}
      toc={content.toc || []}
      navlinks={loaderData.navlinks}
      ContentComponent={content.component}
      ContentOriginal={ContentOriginal}
      editLink={loaderData.editLink}
    >
      <Page>
        <ContentOriginal
          components={{ ...themeContent, wrapper: (p: any) => <>{p.children}</>, ...userComponents }}
        />
      </Page>
    </FrameworkPage>
  );
}

function ShellProviders({ loaderData }: { loaderData: any }) {
  const variantToggles = [{ key: "symbolName", defaultValue: "" }];
  const { Layout } = theme;
  return (
    <Analytics settings={settings} loader={loadProvider as any}>
      <IconProvider value={{ iconSet }}>
        <Framework
          settings={settings}
          sidebarGroups={loaderData.sidebarGroups || []}
          metadata={loaderData.metadata || {}}
          surfaces={surfaces}
          BannerContent={null}
          components={{ Search: SearchButton, Logo: FwLogo }}
        >
          <AtlasContext
            value={
              {
                Link: FwLink,
                syntaxHighlight: settings.theme?.coder?.syntaxHighlight || null,
                baseMatch: "",
                variantToggles,
              } as any
            }
          >
            <CoderProvider lines scroll>
              <Layout>
                <DocsBody loaderData={loaderData} />
              </Layout>
            </CoderProvider>
          </AtlasContext>
        </Framework>
      </IconProvider>
    </Analytics>
  );
}

function matchRouteId(_s: any, slug: string): string {
  return "/" + slug;
}

function esc(x: any): string {
  return String(x).replace(/[&<>]/g, (c) => (({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as any)[c]));
}

function renderShell({ settings, metadata, bodyHtml }: any): string {
  const colorScheme = settings?.theme?.appearance?.colorScheme || "os";
  const title = metadata?.seoTitle || metadata?.title || settings?.seo?.title || "xyd";
  const layer =
    "@layer reset, defaults, defaultfix, components, fabric, templates, decorators, themes, themedecorator, presets, user, overrides;";
  return (
    `<!doctype html><html data-color-scheme="${colorScheme}"><head>` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(title)}</title>` +
    `<style>${layer}</style>` +
    `<link rel="stylesheet" href="/_xyd/theme.css">` +
    `<link rel="stylesheet" href="/_xyd/components.css">` +
    `<link rel="stylesheet" href="/_xyd/atlas.css">` +
    `<link rel="stylesheet" href="/_xyd/ui.css">` +
    `</head><body>${bodyHtml}<script type="module" src="/_bun/client.js"></script></body></html>`
  );
}

export async function renderPage(slug: string): Promise<string> {
  slug = slug || "index";
  const s = settings;
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

  setLocation({ pathname: "/" + slug, search: "", hash: "" });
  setMatches([{ id: matchRouteId(s, slug), pathname: "/" + slug, params: {}, data: loaderData, handle: {} }]);

  const bodyHtml = renderToString(<ShellProviders loaderData={loaderData} />);
  return renderShell({ settings: s, metadata: loaderData.metadata, bodyHtml });
}

// ---- seed + serve (theme injected by the launcher's generated entry) ----

function seedGlobals(ThemeCtor: any) {
  settings = globalThis.__xydSettings;
  surfaces = new Surfaces();
  const atlasXyd = (AtlasXydPlugin as any)()(settings);
  const sir = atlasXyd?.customComponents?.["AtlasSidebarItemRight"];
  if (sir) surfaces.define(sir.surface, sir.component);

  globalThis.__xydReactContent = new ReactContent(settings, {
    Link: FwLink, components: { Atlas }, useLocation, useNavigate, useNavigation,
  } as any);
  globalThis.__xydThemeSettings = settings.theme;
  globalThis.__xydNavigation = settings.navigation;
  globalThis.__xydWebeditor = settings.webeditor;
  globalThis.__xydSurfaces = surfaces;
  (globalThis as any).__xydUserPreferences ??= {};

  new Composer();
  theme = new ThemeCtor();
  if (theme.mergeUserAppearance) theme.mergeUserAppearance();
}

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

/** Entry point called by the launcher's generated entry, with the resolved theme class. */
export function start(ThemeCtor: any) {
  seedGlobals(ThemeCtor);

  const HOST = process.env.XYD_HOST || path.resolve(process.cwd(), ".xyd/host");
  const themeName = (settings?.theme?.name || "poetry").replace(/^npm:/, "");
  const CSS = cssResolver(HOST, themeName);

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
        return new Response("/* SSR-only slice (S1) */", { headers: { "content-type": "text/javascript; charset=utf-8" } });
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
  console.error(`xyd bun dev (S1 render) → ${server.url}  [theme: ${themeName}]`);
}
