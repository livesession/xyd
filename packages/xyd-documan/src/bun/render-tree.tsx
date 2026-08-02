import React from "react";

import { Surfaces } from "@xyd-js/framework";
import { Framework, FrameworkPage, FwLink, FwLogo } from "@xyd-js/framework/react";
import { ReactContent } from "@xyd-js/components/content";
import { IconProvider } from "@xyd-js/components/writer";
import { CoderProvider } from "@xyd-js/components/coder";
import { SearchButton } from "@xyd-js/components/system";
import { Atlas, AtlasContext } from "@xyd-js/atlas";
import AtlasXydPlugin from "@xyd-js/atlas/xydPlugin";
import { Composer } from "@xyd-js/composer";
import { Analytics, useAnalytics } from "@xyd-js/analytics";

import { useLocation, useNavigate, useNavigation, setLocation, setMatches } from "./rr-shim";
import { mdxContent } from "./mdx";

/**
 * The browser-safe render tree — shared by the SSR path (`renderPage.tsx`) and
 * the client hydration entry (`client-entry.tsx`) so both produce identical
 * markup. NO node/Bun/ContentFS here; the loader data (incl. the compiled MDX
 * `code`) is passed in as props.
 */

// Module-scoped render state (per-bundle: separate on server vs client).
const state: { theme: any; settings: any; surfaces: Surfaces | null } = {
  theme: null,
  settings: null,
  surfaces: null,
};

const loadProvider = async () => null;

export function getSettings() {
  return state.settings;
}

/** Populate the runtime globals + instantiate the theme. `settings` must already
 *  be on `globalThis.__xydSettings` (server: appInit; client: hydration data). */
export function seedGlobals(ThemeCtor: any) {
  const settings = globalThis.__xydSettings;
  state.settings = settings;

  const surfaces = new Surfaces();
  const atlasXyd = (AtlasXydPlugin as any)()(settings);
  const sir = atlasXyd?.customComponents?.["AtlasSidebarItemRight"];
  if (sir) surfaces.define(sir.surface, sir.component);
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

export function matchRouteId(_s: any, slug: string): string {
  return "/" + slug;
}

/** Set the per-request/-page location the shim reports (call before rendering). */
export function applyLocation(slug: string, loaderData: any) {
  setLocation({ pathname: "/" + slug, search: "", hash: "" });
  setMatches([{ id: matchRouteId(null, slug), pathname: "/" + slug, params: {}, data: loaderData, handle: {} }]);
}

function DocsBody({ loaderData }: { loaderData: any }) {
  const theme = state.theme;
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

export function ShellProviders({ loaderData }: { loaderData: any }) {
  const settings = state.settings;
  const { Layout } = state.theme;
  const variantToggles = [{ key: "symbolName", defaultValue: "" }];
  return (
    <Analytics settings={settings} loader={loadProvider as any}>
      <IconProvider value={{ iconSet: (globalThis as any).__xydIconSet || {} }}>
        <Framework
          settings={settings}
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
                <DocsBody loaderData={loaderData} />
              </Layout>
            </CoderProvider>
          </AtlasContext>
        </Framework>
      </IconProvider>
    </Analytics>
  );
}
