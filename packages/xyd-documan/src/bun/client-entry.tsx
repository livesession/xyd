import React from "react";
import { hydrateRoot } from "react-dom/client";

import { seedGlobals, ShellProviders, applyLocation } from "./render-tree";

/**
 * Client hydration entry (S1). Reads the SSR data embedded by `renderShell`,
 * re-seeds the same globals/theme, and hydrates the identical tree. Called by
 * the launcher's generated client entry with the resolved theme class.
 * MPA slice: no client-side routing yet (links are full loads).
 */
export function bootClient(ThemeCtor: any) {
  const el = document.getElementById("__xyd_data");
  const data = JSON.parse(el!.textContent || "{}");

  globalThis.__xydSettings = data.settings;
  globalThis.__xydSettingsClone = data.settings; // Theme ctor reads __xydSettingsClone
  globalThis.__xydUserComponents = data.userComponents || [];
  globalThis.__xydUserHooks = data.userHooks || {};
  globalThis.__xydPagePathMapping = {};

  seedGlobals(ThemeCtor);
  applyLocation(data.slug, data.loaderData);

  hydrateRoot(document.getElementById("root")!, <ShellProviders loaderData={data.loaderData} />);
}
