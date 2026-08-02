import React from "react";
import { hydrateRoot } from "react-dom/client";
import { createRouterStore, RouterProvider } from "@xyd-js/router";

import { seedGlobals, ShellProviders } from "./render-tree";

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

  globalThis.__xydSettings = data.settings;
  // The theme rebuilds webeditor from __xydSettingsClone — seed it from the
  // PRISTINE server clone (not the live/mutated `settings`) so the client theme
  // builds the identical webeditor (social-anchor icons) the server rendered.
  globalThis.__xydSettingsClone = data.settingsClone || data.settings;
  globalThis.__xydUserComponents = data.userComponents || [];
  globalThis.__xydUserHooks = data.userHooks || {};
  globalThis.__xydPagePathMapping = {};

  seedGlobals(ThemeCtor);

  // Router store. Location is basename-STRIPPED (RR semantics; matches the
  // server's "/"+slug so useLocation-driven active-state hydrates identically),
  // and matches carry the server-computed routeId + loaderData.
  const basename = (data.settings?.advanced?.basename || "").replace(/\/$/, "");
  const stripBase = (p: string) => (basename && p.startsWith(basename + "/") ? p.slice(basename.length) : p) || "/";
  const w = new URL(window.location.href);
  const store = createRouterStore({
    location: { pathname: stripBase(w.pathname), search: w.search, hash: w.hash },
    matches: [{ id: data.routeId, pathname: "/" + data.slug, params: {}, data: data.loaderData }],
  });

  hydrateRoot(
    document.getElementById("root")!,
    <RouterProvider store={store}>
      <ShellProviders />
    </RouterProvider>
  );
}
