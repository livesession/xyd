import React from "react";
import { renderToString } from "react-dom/server";

// Internal documan imports (appInit is NOT in @xyd-js/documan's exports map).
import { appInit } from "../utils";

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
 * The real S1 render: reproduces xyd's docs-page render (loader → theme +
 * framework providers → compiled MDX → renderToString) WITHOUT React Router,
 * for the Bun dev server. Built from the verified render-pipeline spec.
 * First slice: SSR-only (no client hydration yet), plain-prose routes.
 */

let theme: any;
let settings: any;
let surfaces: Surfaces;
let themeName = "poetry";

// Virtual-module substitutions for the SSR-only first slice (see spec D4).
const loadProvider = async () => null;
const iconSet = {};

function resolveThemeName(name?: string): string {
  if (!name) return "poetry";
  if (name.startsWith("npm:")) return name.slice("npm:".length);
  return name;
}

export function getSettings() {
  return settings;
}
export function getThemeName() {
  return themeName;
}

/** Boot once at server start (cwd = a docs project). Sets every global the
 *  render reads, then instantiates the theme. */
export async function bootRender() {
  console.error("[boot] appInit…");
  await appInit(); // sets __xydSettings, __xydPagePathMapping, __xydUser*, __xydSettingsClone
  console.error("[boot] appInit done");
  settings = globalThis.__xydSettings;

  // --- replicate layout.tsx module-load globals (before `new Theme()`) ---
  surfaces = new Surfaces();
  const atlasXyd = (AtlasXydPlugin as any)()(settings);
  const sir = atlasXyd?.customComponents?.["AtlasSidebarItemRight"];
  if (sir) surfaces.define(sir.surface, sir.component);

  globalThis.__xydReactContent = new ReactContent(settings, {
    Link: FwLink,
    components: { Atlas },
    useLocation,
    useNavigate,
    useNavigation,
  } as any);
  globalThis.__xydThemeSettings = settings.theme; // live object; Theme ctor mutates it
  globalThis.__xydNavigation = settings.navigation;
  globalThis.__xydWebeditor = settings.webeditor;
  globalThis.__xydSurfaces = surfaces;
  (globalThis as any).__xydUserPreferences ??= {};

  new Composer(); // registers @metaComponent transforms used by the markdown chain
  console.error("[boot] seeded globals + composer");

  themeName = resolveThemeName(settings.theme?.name);
  console.error("[boot] loading @xyd-js/theme-" + themeName);
  const Ctor = (await import(`@xyd-js/theme-${themeName}`)).default;
  theme = new Ctor();
  if (theme.mergeUserAppearance) theme.mergeUserAppearance();
  console.error("[boot] theme ready");
}

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
  return "/" + slug; // first cut; refine to the SidebarRoute prefix for active state
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
  const locale = ""; // no __xydI18n for apps/docs

  const props: any = await mapSettingsToProps(
    s,
    globalThis.__xydPagePathMapping,
    slug,
    undefined as any,
    locale
  );
  const { groups: sidebarGroups, breadcrumbs, navlinks, metadata } = props;

  const md: any = await markdownPlugins(
    { maxDepth: metadata?.maxTocDepth || s?.theme?.writer?.maxTocDepth || 2 } as any,
    s
  );
  const remark = [...md.remarkPlugins];
  const rehype = [...md.rehypePlugins];
  if (globalThis.__xydUserMarkdownPlugins?.remark?.length)
    remark.push(globalThis.__xydUserMarkdownPlugins.remark as any);
  if (globalThis.__xydUserMarkdownPlugins?.rehype?.length)
    rehype.push(globalThis.__xydUserMarkdownPlugins.rehype as any);

  const fs = new ContentFS(
    s,
    remark,
    rehype,
    md.recmaPlugins,
    globalThis.__xydUserMarkdownPlugins?.remarkRehypeHandlers || {}
  );
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
    sidebarGroups,
    breadcrumbs,
    navlinks,
    slug,
    code,
    metadata,
    rawPage,
    editLink,
    canPassComponents,
    shellOnly: false,
  };

  setLocation({ pathname: "/" + slug, search: "", hash: "" });
  setMatches([{ id: matchRouteId(s, slug), pathname: "/" + slug, params: {}, data: loaderData, handle: {} }]);

  const bodyHtml = renderToString(<ShellProviders loaderData={loaderData} />);
  return renderShell({ settings: s, metadata: loaderData.metadata, bodyHtml });
}
