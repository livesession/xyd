// Resolve the theme PACKAGE SPECIFIER from settings.theme.name — parity with the
// Vite path, which branches on the `npm:` prefix. Used by every site that imports
// or resolves the theme (startDevServer, buildStatic, renderPage cssResolver) so
// external themes work identically to built-ins.
//
//   "poetry"              → "@xyd-js/theme-poetry"   (built-in)
//   "npm:@co/docs-theme"  → "@co/docs-theme"          (external, scoped)
//   "npm:my-theme"        → "my-theme"                (external, unscoped)
export function themePackage(rawName: string | undefined): string {
  const name = rawName || "poetry";
  return name.startsWith("npm:") ? name.slice("npm:".length) : `@xyd-js/theme-${name}`;
}

/** The short theme label (npm: prefix stripped) — for logging / CSS labels /
 *  multi-theme embed keys, NOT for import specifiers. */
export function themeShortName(rawName: string | undefined): string {
  const name = rawName || "poetry";
  return name.startsWith("npm:") ? name.slice("npm:".length) : name;
}
