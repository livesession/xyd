/** The package-dist CSS groups every page of the bun engine links, in cascade
 *  order. One definition for the dev server (/_xyd/<label>.css), the static
 *  build and the binary's prebuild, so the three can never link them in a
 *  different order.
 *
 *  The theme comes LAST. A built-in theme's index.css already bundles the other
 *  three groups (ui, components, atlas) and, after them, its own token mappings
 *  (for example the reference's palette mapped onto the theme's dark-mode
 *  colours). Linking the shared files after the theme re-declared their defaults
 *  over those mappings, so a reference page kept its light colours in dark mode.
 *  With the theme last, its own bundle decides the cascade, as on the Vite path,
 *  which links nothing but the theme's CSS. A theme that bundles nothing still
 *  overrides the shared defaults, which is what a theme is for. */
export const CSS_GROUP_ORDER = ["components", "atlas", "ui", "theme"] as const;

export type CssGroupLabel = (typeof CSS_GROUP_ORDER)[number];

/** Where a group's files come from: a package export, else the file in the
 *  package directory. Order inside a group is the concatenation order. */
export interface CssSource {
  spec: string;
  pkg: string;
  file: string;
}

export function cssGroupSources(themePkg: string): Record<CssGroupLabel, CssSource[]> {
  return {
    components: [{ spec: "@xyd-js/components/index.css", pkg: "@xyd-js/components", file: "dist/index.css" }],
    atlas: [
      { spec: "@xyd-js/atlas/index.css", pkg: "@xyd-js/atlas", file: "dist/index.css" },
      { spec: "@xyd-js/atlas/tokens.css", pkg: "@xyd-js/atlas", file: "dist/tokens.css" },
      { spec: "@xyd-js/atlas/styles.css", pkg: "@xyd-js/atlas", file: "dist/styles.css" },
    ],
    ui: [{ spec: "@xyd-js/ui/index.css", pkg: "@xyd-js/ui", file: "dist/index.css" }],
    theme: [{ spec: `${themePkg}/index.css`, pkg: themePkg, file: "dist/index.css" }],
  };
}

/** The groups in cascade order, each with its resolved files (null when a file
 *  resolves nowhere). `resolve` maps a package export to a path, `pkgDist` a
 *  package's own file; both return null when it is not found. */
export function resolveCssGroups(
  themePkg: string,
  resolve: (spec: string) => string | null,
  pkgDist: (pkg: string, file: string) => string | null
): [CssGroupLabel, (string | null)[]][] {
  const sources = cssGroupSources(themePkg);
  return CSS_GROUP_ORDER.map((label) => [label, sources[label].map((s) => resolve(s.spec) || pkgDist(s.pkg, s.file))]);
}

/** The page shell's `<link>` tags for the dev server's /_xyd/<label>.css routes. */
export function devCssLinksHtml(): string {
  return CSS_GROUP_ORDER.map((label) => `<link rel="stylesheet" href="/_xyd/${label}.css">`).join("");
}
