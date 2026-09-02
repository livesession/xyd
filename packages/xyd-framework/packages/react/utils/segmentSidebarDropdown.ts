import type { NavigationItem } from "@xyd-js/core"

import { pageLink } from "./pageLink"
import { trailingSlash } from "./trailingSlash"

// Sidebar-dropdown nesting helpers. A NavigationItem inside
// `navigation.sidebarDropdown` or a sidebarDropdown segment's `pages` may
// itself declare `pages: [...]` — an inline-expandable GROUP row in the
// dropdown. Matching logic must see through that nesting; these helpers are
// identity operations for flat (non-nested) configs.

/** Depth-first flatten of nested navigation items (parents before children). */
export function flattenNavigationPages(pages?: NavigationItem[]): NavigationItem[] {
    const out: NavigationItem[] = []
    for (const item of pages || []) {
        out.push(item)
        if (item.pages?.length) {
            out.push(...flattenNavigationPages(item.pages))
        }
    }
    return out
}

/**
 * The item whose `page` route-prefix matches `pathname` — the LAST declared
 * match wins (deepest-declared semantics, same as the flat `findLast` this
 * replaces). Group rows without a `page` never match.
 */
export function findActiveNavigationPage(
    pages: NavigationItem[] | undefined,
    pathname: string,
): NavigationItem | null {
    const normalized = trailingSlash(pathname)
    return flattenNavigationPages(pages).findLast(item => {
        if (typeof item.page !== "string" || !item.page) return false
        return normalized.startsWith(pageLink(item.page))
    }) || null
}
