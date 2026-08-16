// Basename helpers (React Router parity). The router's internal location is
// ALWAYS basename-free; the basename is applied only at the two boundaries where
// a URL faces the browser: rendered link hrefs and history entries.

/** Normalize a raw basename ("/docs/", "docs") → "/docs" (leading slash, no
 *  trailing). Empty/"/" → "". */
export function normBase(raw?: string): string {
  const b = (raw || "").replace(/\/+$/, "");
  if (!b || b === "") return "";
  return b.startsWith("/") ? b : "/" + b;
}

/** Prepend the basename to an absolute path (idempotent; leaves relative,
 *  external, and already-prefixed paths untouched). */
export function withBase(base: string, path: string): string {
  if (!base || typeof path !== "string" || !path.startsWith("/")) return path;
  if (path === base || path.startsWith(base + "/")) return path; // already prefixed
  return base + path;
}

/** Remove the basename from a pathname → basename-free ("/docs" or "/docs/" →
 *  "/"). */
export function stripBase(base: string, pathname: string): string {
  if (!base) return pathname;
  if (pathname === base || pathname === base + "/") return "/";
  if (pathname.startsWith(base + "/")) return pathname.slice(base.length);
  return pathname;
}
