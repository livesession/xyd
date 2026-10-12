/**
 * Strip `advanced.basename` from a request pathname.
 *
 * React Router registers every route relative to its `basename`, so a raw
 * route registered as `/llms.txt` answers `/<basename>/llms.txt` — but the
 * loader's `request.url` still carries the full pathname. The raw-file map
 * (`__xydRawRouteFiles`) is keyed by the basename-relative path, so the
 * prefix has to come off before the lookup.
 *
 * - no basename (or `/`) → the pathname is returned as-is
 * - the pathname IS the basename (`/docs`) → `/`
 * - a pathname outside the basename (`/docsx/...`) → returned as-is
 */
export function stripBasename(pathname: string, basename?: string | null): string {
  const base = (basename || "").replace(/\/+$/, "");
  if (!base || base === "/") {
    return pathname;
  }
  if (pathname === base) {
    return "/";
  }
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length);
  }
  return pathname;
}
