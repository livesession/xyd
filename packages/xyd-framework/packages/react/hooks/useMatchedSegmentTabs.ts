import { Segment } from "@xyd-js/core";
import { useLocation } from "react-router";

import { useSettings } from "../contexts";
import { pageLink, trailingSlash, segmentAppearanceKind } from "../utils";

/**
 * The `appearance: "tabs"` segment whose `route` prefixes the current path — a
 * PER-PRODUCT tab bar. Unlike {@link useMatchedSegment} (exact match-id / page
 * equality), this matches by route PREFIX so the tabs stay visible across every
 * page of the product section (e.g. all of `/nomad/**`). `findLast` so the
 * deepest/last matching route wins on overlapping prefixes. Returns `null` when
 * no tabs segment is scoped to the current route.
 */
export function useMatchedSegmentTabs(): Segment | null {
    const settings = useSettings()
    const location = useLocation()

    const pathname = trailingSlash(location.pathname)

    return settings.navigation?.segments?.findLast?.(seg =>
        segmentAppearanceKind(seg) === "tabs" &&
        typeof seg.route === "string" &&
        pathname.startsWith(pageLink(seg.route))
    ) || null
}
