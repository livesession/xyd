/**
 * A minimal xyd `Settings` for the OpenAPI editor's docs runtime — just enough
 * for `pluginNavigation` + `mapSettingsToProps` (the sidebar) and `Framework` +
 * the theme instance (the look). Mirrors `apps/apidocs-demo/app/settings`, which
 * hand-wires the same runtime outside `xyd dev`.
 *
 * Shared by the server-only `toGroups` (builds the sidebar tree) and the
 * client-only xyd runtime (theme + ReactContent + Framework). It's a plain data
 * object with no imports, so both sides can consume it; every conversion clones
 * it first (the navigation tree is mutated per spec).
 */

/** The synthetic prefix the generated operation nav + Atlas `baseMatch` use for
 * canonicals. NOT a real route (sidebar clicks are intercepted client-side) —
 * deliberately not `/editor` so RR never treats a sidebar link as the editor
 * route (`/editor/:apiId`) and tries to prefetch/navigate it. */
export const DOCS_PREFIX = "/_ref";

export const EDITOR_SETTINGS = {
  theme: {
    name: "opener",
    // A @code-hike/lighter builtin — Atlas code samples use it.
    coder: { syntaxHighlight: "github-dark" },
    appearance: {
      colorScheme: "light",
      colorSchemeButton: false,
      // The whole spec renders in the Atlas, so keep opened sidebar groups open
      // (never auto-collapse) — collapsing from under you while scrolling is
      // disorienting. Manual toggle still closes.
      sidebar: { keepExpanded: true },
    },
    icons: { library: [{ name: "lucide", default: true }] },
  },
  webeditor: {},
  navigation: {
    sidebar: [
      { route: DOCS_PREFIX, pages: [{ group: "Endpoints", pages: [] }] },
    ],
  },
};

export type EditorSettings = typeof EDITOR_SETTINGS;
