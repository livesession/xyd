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

/**
 * The key of a request's raw route file in `__xydRawRouteFiles`.
 *
 * The map is keyed by the basename-relative file path as written
 * (`/guides/my page.md`), but a request pathname arrives percent-encoded
 * (`/guides/my%20page.md`), so it is decoded before the basename comes off.
 * A malformed escape leaves the pathname as it came.
 */
export function rawRouteKey(pathname: string, basename?: string | null): string {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // a lone `%` or a broken UTF-8 sequence: look the pathname up as it is
  }
  return stripBasename(decoded, basename);
}
