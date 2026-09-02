import { Segment } from "@xyd-js/core";
import { useLocation } from "react-router";

import { useSettings } from "../contexts";
import { pageLink, trailingSlash, segmentAppearanceKind, flattenNavigationPages } from "../utils";

/**
 * The `appearance: "sidebarDropdown"` segment scoped to the current route — a
 * section switcher rendered at the top of the sidebar (e.g. flip between
 * "Intro to Terraform", "Terraform CLI", … from the left sidebar). Matched DIRECTLY
 * by appearance + route PREFIX (not via {@link useMatchedSegment}) so it coexists
 * with a `tabs` segment on the same `route`.
 *
 * A switcher only makes sense INSIDE one of its member sections — so when the
 * segment's pages declare `page` route-prefixes, the current path must be under
 * one of them (e.g. the Documentation switcher shows on `terraform/language/**`
 * but NOT on `terraform/install/**`, even though both share the `terraform`
 * route). `findLast` → the deepest matching route wins; a segment with no
 * `route` is global. Returns `null` when none matches.
 */
export function useMatchedSegmentSidebarDropdown(): Segment | null {
    const settings = useSettings()
    const pathname = trailingSlash(useLocation().pathname)

    return settings.navigation?.segments?.findLast?.(seg => {
        if (segmentAppearanceKind(seg) !== "sidebarDropdown") return false
        if (typeof seg.route === "string" && !pathname.startsWith(pageLink(seg.route))) return false

        // flattened: nested group children count as member sections too
        const sectionPrefixes = flattenNavigationPages(seg.pages).filter(p => typeof p.page === "string")
        if (!sectionPrefixes.length) return true
        return sectionPrefixes.some(p => pathname.startsWith(pageLink(p.page as string)))
    }) || null
}
