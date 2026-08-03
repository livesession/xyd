import React from "react";

import { Surfaces } from "@xyd-js/framework";
import { Framework, FrameworkPage, FwLink, FwLogo, FwLocaleSwitcher, type IFrameworkI18n } from "@xyd-js/framework/react";
import { resolveLocaleSettings } from "@xyd-js/framework/hydration/locale";
import { ReactContent } from "@xyd-js/components/content";
import { IconProvider } from "@xyd-js/components/writer";
import { CoderProvider } from "@xyd-js/components/coder";
import { SearchButton } from "@xyd-js/components/system";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import AtlasXydPlugin from "@xyd-js/atlas/xydPlugin";
import { Composer } from "@xyd-js/composer";
import { Analytics, useAnalytics } from "@xyd-js/analytics";

import { useLocation, useNavigate, useNavigation, useLoaderData, ScrollRestoration } from "@xyd-js/router";
import { mdxContent } from "./mdx";

/**
 * The browser-safe render tree — shared by the SSR path (`renderPage.tsx`) and
 * the client hydration entry (`client-entry.tsx`) so both produce identical
 * markup. NO node/Bun/ContentFS here; per-page loader data flows through the
 * @xyd-js/router store (useLoaderData), so a client navigation swaps the page
 * without a full reload.
 */

// Module-scoped render state (per-bundle: separate on server vs client).
const state: { theme: any; settings: any; settingsClone: any; surfaces: Surfaces | null } = {
  theme: null,
  settings: null,
  settingsClone: null,
  surfaces: null,
};

const loadProvider = async () => null;

export function getSettings() {
  return state.settings;
}

// The pristine clone the theme reads (webeditor/social-anchor icons). Captured
// atomically with `settings` in seedGlobals so a request served mid-reinit (after
// appInit swapped globalThis.__xydSettingsClone but before reseed) can't serialize
// a NEW clone against OLD settings/theme → SSR≠CSR mismatch.
export function getSettingsClone() {
  return state.settingsClone;
}

/** Populate the runtime globals + instantiate the theme. `settings` must already
 *  be on `globalThis.__xydSettings` (server: appInit; client: hydration data). */
export function seedGlobals(ThemeCtor: any) {
  const settings = globalThis.__xydSettings;
  state.settings = settings;
  state.settingsClone = globalThis.__xydSettingsClone;

  const surfaces = new Surfaces();
  const atlasXyd = (AtlasXydPlugin as any)()(settings);
  const sir = atlasXyd?.customComponents?.["AtlasSidebarItemRight"];
  if (sir) surfaces.define(sir.surface, sir.component);
  // i18n: auto-register the built-in locale switcher on nav.right when
  // navigation.languages[] is configured (parity with plugin-docs layout.tsx).
  if (settings?.navigation?.languages?.length) {
    surfaces.define("nav.right", FwLocaleSwitcher as any, { append: true } as any);
  }
  state.surfaces = surfaces;

  globalThis.__xydReactContent = new ReactContent(settings, {
    Link: FwLink,
    components: { Atlas },
    useLocation,
    useNavigate,
    useNavigation,
  } as any);
  globalThis.__xydThemeSettings = settings.theme;
  globalThis.__xydNavigation = settings.navigation;
  globalThis.__xydWebeditor = settings.webeditor;
  globalThis.__xydSurfaces = surfaces;
  (globalThis as any).__xydUserPreferences ??= {};

  // Composer registers server-side meta-components (markdown chain). Not needed
  // on the client (content is already compiled) and it pulls node built-ins, so
  // it's stubbed out of the client bundle — only construct it on the server.
  if (typeof window === "undefined") {
    new Composer();
  }
  state.theme = new ThemeCtor();
  if (state.theme.mergeUserAppearance) state.theme.mergeUserAppearance();
}

/**
 * Route id parity with pathRoutes.ts: the most-specific enclosing `SidebarRoute`
 * section collapses to its `/<route>` prefix (every nested page shares it, like
 * the `/<route>/*` wildcard route); a plain page outside any section → its exact
 * `/<page>` path; index → `/`. basename-free (RR ids are basename-independent).
 * Consumed by useActivePage/useActivePageRoute/useMatchedSegment via match.id.
 */
/** Slug → RR-style location pathname: index → "/" (so useLocation()/match.pathname
 *  === "/" home checks hydrate identically), else "/<slug>". */
export function slugToPathname(slug: string): string {
  return slug === "index" || slug === "" ? "/" : "/" + String(slug).replace(/^\/+/, "");
}

export function matchRoute(pathname: string, navigation: any): string {
  const norm = (x: string) => (x === "index" || x === "/index" ? "/" : "/" + String(x).replace(/^\/+/, ""));
  const target = norm(pathname === "/" ? "index" : pathname.replace(/^\/+/, ""));
  if (target === "/") return "/";
  let best = "";
  const walk = (items: any[]) => {
    for (const it of items || []) {
      if (it && typeof it === "object" && it.route) {
        const prefix = it.route.startsWith("/") ? it.route : "/" + it.route;
        if ((target + "/").startsWith(prefix + "/") && prefix.length > best.length) best = prefix;
        if (Array.isArray(it.pages)) walk(it.pages);
      } else if (it && typeof it === "object" && Array.isArray(it.pages)) {
        walk(it.pages);
      }
    }
  };
  const sidebar = navigation?.sidebar || [];
  walk(Array.isArray(sidebar) ? sidebar : sidebar?.pages || []);
  return best || target; // fall back to the exact plain-page id
}

/** Access-control (Layer-1): a protected page the viewer can't see. Its MDX was
 *  never compiled server-side (loaderData.code === ""), so the SSR HTML carries no
 *  content — only an empty [data-auth-protected] placeholder. After hydration, if
 *  the pre-hydration script marked the viewer authenticated, fetch the compiled
 *  content chunk and render it client-side (parity with plugin-docs
 *  ProtectedPageShell). SSR and first client render are identical (code === null). */
function ProtectedPageShell() {
  const loaderData = useLoaderData();
  const theme = state.theme;
  const analytics = useAnalytics();
  const themeContent = theme.reactContentComponents();
  const themeFile = theme.reactFileComponents();
  const { Page } = theme;
  const [code, setCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).__xydAuthState?.authenticated) return;
    let alive = true;
    fetch(`/__xyd_protected_content/${encodeURIComponent(loaderData.slug)}.js`)
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => { if (alive && t) setCode(t); })
      .catch(() => {});
    return () => { alive = false; };
  }, [loaderData.slug]);

  if (code) {
    const content = mdxContent(code, themeContent, themeFile, { analytics });
    const contentOriginal = mdxContent(code, themeContent, undefined, { analytics });
    const ContentOriginal = contentOriginal.component;
    return (
      <FrameworkPage
        metadata={content.metadata}
        breadcrumbs={loaderData.breadcrumbs}
        rawPage=""
        toc={content.toc || []}
        navlinks={loaderData.navlinks}
        ContentComponent={content.component}
        ContentOriginal={ContentOriginal}
        editLink={loaderData.editLink}
      >
        <Page>
          <ContentOriginal components={{ ...themeContent, wrapper: (p: any) => <>{p.children}</> }} />
        </Page>
      </FrameworkPage>
    );
  }

  const Noop = () => null;
  return (
    <FrameworkPage
      metadata={loaderData.metadata || {}}
      breadcrumbs={loaderData.breadcrumbs}
      rawPage=""
      toc={[]}
      navlinks={loaderData.navlinks}
      ContentComponent={Noop}
      ContentOriginal={Noop}
      editLink={loaderData.editLink}
    >
      <Page>
        <div data-auth-protected />
      </Page>
    </FrameworkPage>
  );
}

function DocsBody() {
  const loaderData = useLoaderData();
  const theme = state.theme;
  const analytics = useAnalytics();
  const themeContent = theme.reactContentComponents();
  const themeFile = theme.reactFileComponents();
  const globalAPI = { analytics };

  if (loaderData.shellOnly) return <ProtectedPageShell />;

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

/** IFrameworkI18n payload for <Framework> — parity with plugin-docs layout.tsx
 *  buildFrameworkI18n. Drives the locale switcher + useT() catalog resolution. */
function buildFrameworkI18n(settings: any, currentLocale?: string): IFrameworkI18n | undefined {
  const langs = settings?.navigation?.languages;
  if (!langs || langs.length === 0) return undefined;
  const explicit = settings.i18n?.defaultLocale;
  const flagged = langs.find((l: any) => l.default)?.language;
  const defaultLocale = explicit ?? flagged ?? langs[0].language;
  const byLocale: Record<string, any> = {};
  for (const l of langs) byLocale[l.language] = l;
  const catalogs = ((globalThis as any).__xydI18nTranslations || {}) as Record<string, any>;
  return {
    currentLocale: currentLocale || defaultLocale,
    defaultLocale,
    locales: langs.map((l: any) => ({ code: l.language, name: l.name })),
    byLocale,
    catalogs,
  } as any;
}

/** Plugin page (access-control /login, /auth/jwt-callback, …). Rendered outside the
 *  docs chrome (no sidebar/Framework) — parity with the Vite pluginPageLayout: just
 *  theme CSS (from the shell) + the AccessControlProvider wrapper. The component is
 *  bundled + registered on __xydPluginPageComponents by pluginPagesEntrySrc(). */
function PluginPageRenderer({ route }: { route: string }) {
  const comps = (globalThis as any).__xydPluginPageComponents || {};
  const Provider = (globalThis as any).__xydAccessControlProvider;
  const Comp = comps[route];
  if (!Comp) return <div data-plugin-page-missing={route} />;
  const inner = <Comp />;
  return Provider ? <Provider>{inner}</Provider> : <>{inner}</>;
}

export function ShellProviders() {
  const loaderData = useLoaderData();
  // Plugin page (login/auth callback) short-circuits the docs render tree.
  if (loaderData.pluginPage) return <PluginPageRenderer route={loaderData.pluginPage} />;
  const settings = state.settings;
  // Per-locale settings overrides (catalog $-keys + languages[].overrides) so
  // useSettings() returns the locale-effective config; parity with layout.tsx.
  const locale = loaderData.locale;
  const effectiveSettings = locale ? resolveLocaleSettings(settings, locale) : settings;
  const { Layout } = state.theme;
  const variantToggles = [{ key: "symbolName", defaultValue: "" }];
  return (
    <Analytics settings={effectiveSettings} loader={loadProvider as any}>
      {/* Scroll to top on client PUSH navigation (react-router parity). */}
      <ScrollRestoration />
      <IconProvider value={{ iconSet: (globalThis as any).__xydIconSet || {} }}>
        <Framework
          settings={effectiveSettings}
          i18n={buildFrameworkI18n(settings, locale)}
          sidebarGroups={loaderData.sidebarGroups || []}
          metadata={loaderData.metadata || {}}
          surfaces={state.surfaces}
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
                {/* Key on slug so FrameworkPage remounts per page (its setMetadata
                    runs on empty deps) → title/nav-active/TOC refresh on client nav. */}
                <DocsBody key={loaderData.slug} />
              </Layout>
            </CoderProvider>
          </AtlasContext>
        </Framework>
      </IconProvider>
    </Analytics>
  );
}
