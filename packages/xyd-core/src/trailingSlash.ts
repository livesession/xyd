/** The page a trailing-slash path stands for (`/cli/deploy/` → `/cli/deploy`),
 *  or null when the path stays: it has no trailing slash, or it is the site's
 *  root (`/`, or the basename's root such as `/docs/`, which is a page of its
 *  own). Pages are served without the slash; the slashed form is a common way to
 *  type or link one, so the hosts redirect it. Leading slashes collapse to one,
 *  so the target can never become a protocol-relative URL (`//host`). */
export function trailingSlashTarget(pathname: string, basename = ""): string | null {
    if (!pathname.endsWith("/")) return null;
    const target = "/" + pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    const base = basename.replace(/^\/+|\/+$/g, "");
    if (target === "/" || (base && target === "/" + base)) return null;
    return target;
}
