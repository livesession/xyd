import React from "react";

// Serialization shared by the SSR shells (renderPage) and the static build
// (buildStatic) — kept react-router-free so buildStatic can import it.

/** React elements can't cross the SSR→CSR boundary via JSON (the $$typeof Symbol
 *  is dropped, leaving an invalid child object). Strip them before serializing;
 *  the client re-derives them (e.g. webeditor icons the theme injects). */
export function stripReactElements(o: any): any {
  if (o == null || typeof o !== "object") return o;
  if (React.isValidElement(o)) return null;
  // Already-broken serialized element (lost its $$typeof Symbol): shape {props, _owner|_store}.
  if (("_owner" in o || "_store" in o) && "props" in o) return null;
  if (Array.isArray(o)) return o.map(stripReactElements);
  const out: any = {};
  for (const k of Object.keys(o)) out[k] = stripReactElements(o[k]);
  return out;
}

/** The settings bootstrap script served as an EXTERNAL asset (not inlined per
 *  page) — parity with the Vite path's virtual:xyd-settings bundle. Keeps the raw,
 *  ALL-LOCALE settings (incl. "i18n:" keys + per-locale overrides) out of the page
 *  HTML: only the current locale's rendered markup lands in the document; the full
 *  settings live in this cached asset. Sets both globals before the client module. */
export function settingsBundleJs(settings: any, settingsClone: any): string {
  const s = JSON.stringify(stripReactElements(settings)).replace(/</g, "\\u003c");
  const c = JSON.stringify(stripReactElements(settingsClone || settings)).replace(/</g, "\\u003c");
  return `globalThis.__xydSettings=${s};globalThis.__xydSettingsClone=${c};`;
}
