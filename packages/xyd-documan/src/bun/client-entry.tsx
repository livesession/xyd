import React from "react";
import { hydrateRoot } from "react-dom/client";
import { createRouterStore, RouterProvider } from "@xyd-js/router";

import { seedGlobals, ShellProviders, slugToPathname } from "./render-tree";

/**
 * Client hydration entry (S1/S2). Reads the SSR data embedded by `renderShell`,
 * re-seeds the same globals/theme, builds the @xyd-js/router store, and hydrates
 * the identical tree under <RouterProvider>. `loadPageData` (client-side page
 * swap) is wired in a later step; until then navigate() hard-nav falls back to a
 * full load (MPA), so nothing regresses.
 */
export function bootClient(ThemeCtor: any) {
  const el = document.getElementById("__xyd_data");
  const data = JSON.parse(el!.textContent || "{}");

  // globalThis.__xydSettings + __xydSettingsClone are already set by the external
  // settings asset (<script src="…virtual_xyd-settings-*.js">) that runs before
  // this module — the theme rebuilds webeditor from the PRISTINE clone so the
  // client builds the identical markup the server rendered.
  const settings = (globalThis as any).__xydSettings;
  globalThis.__xydUserComponents = data.userComponents || [];
  globalThis.__xydUserHooks = data.userHooks || {};
  globalThis.__xydPagePathMapping = {};

  seedGlobals(ThemeCtor);

  // Router store. Location is basename-STRIPPED (RR semantics; matches the
  // server's normalized pathname so useLocation-driven active-state hydrates
  // identically), and matches carry the server-computed routeId + loaderData.
  const basename = (settings?.advanced?.basename || "").replace(/\/$/, "");
  // Strip basename (prefix OR exact match → root); root → "/".
  const stripBase = (p: string) => {
    if (basename) {
      if (p === basename || p === basename + "/") return "/";
      if (p.startsWith(basename + "/")) p = p.slice(basename.length);
    }
    return p.startsWith("/") ? p : "/" + p;
  };
  const pathnameToSlug = (pathname: string) => stripBase(pathname).replace(/^\/+/, "") || "index";

  // Client-side page swap: fetch the new route's loaderData JSON, update the
  // title, return the new match. `signal` cancels a superseded fetch (rapid nav)
  // so its title write doesn't apply. On failure the store hard-navs (MPA).
  const loadPageData = async (url: URL, signal?: AbortSignal) => {
    const slug = pathnameToSlug(url.pathname);
    let loaderData: any;
    let routeId: string;
    // The dev server exposes /_xyd/data; a STATIC host does not. Fall back to
    // fetching the target page's own HTML (at the basename-prefixed URL the host
    // serves) and reading its embedded <script id="__xyd_data"> — so client-side
    // SPA navigation works on static deploys too (no full reload, base preserved).
    let r: Response | null = null;
    try {
      r = await fetch(`/_xyd/data?slug=${encodeURIComponent(slug)}`, { signal });
    } catch {
      r = null;
    }
    if (r && r.ok) {
      ({ loaderData, routeId } = await r.json());
    } else {
      const pageHref = (basename || "") + url.pathname + url.search;
      const pr = await fetch(pageHref, { signal });
      if (!pr.ok) throw new Error(`page ${pr.status}`);
      const html = await pr.text();
      const el = new DOMParser().parseFromString(html, "text/html").getElementById("__xyd_data");
      if (!el?.textContent) throw new Error("no __xyd_data in page");
      const pageData = JSON.parse(el.textContent);
      loaderData = pageData.loaderData;
      routeId = pageData.routeId;
    }
    if (!signal?.aborted) {
      document.title =
        loaderData?.metadata?.seoTitle || loaderData?.metadata?.title || settings?.seo?.title || "xyd";
    }
    return { matches: [{ id: routeId, pathname: slugToPathname(slug), params: {}, data: loaderData }] };
  };

  const w = new URL(window.location.href);
  const store = createRouterStore({
    location: { pathname: stripBase(w.pathname), search: w.search, hash: w.hash },
    matches: [{ id: data.routeId, pathname: slugToPathname(data.slug), params: {}, data: data.loaderData }],
    loadPageData,
    basename,
  });

  hydrateRoot(
    document.getElementById("root")!,
    <RouterProvider store={store}>
      <ShellProviders />
    </RouterProvider>
  );
}
