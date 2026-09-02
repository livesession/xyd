/**
 * Does `pathname` sit at or under the route `link`?
 *
 * A plain `startsWith` is not enough, because it matches on characters rather
 * than path segments: `/sdks/javascript/react` "starts with" `/sdks/java`, so a
 * Java entry declared after a JavaScript one wins every JavaScript page. Any two
 * routes where one name prefixes another hit this — java/javascript,
 * go/golang, api/apidocs.
 *
 * Both arguments are expected to be normalised already (leading slash, no
 * trailing slash).
 */
export function isRoutePrefix(pathname: string, link: string): boolean {
    if (!link) return false

    // The root matches everything under it, which is the whole point of a
    // root-level entry — segment logic would make it match only "/" itself.
    if (link === "/") return true

    return pathname === link || pathname.startsWith(`${link}/`)
}
