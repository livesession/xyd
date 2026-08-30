import { NavigationItem } from "@xyd-js/core";
import { useLocation } from "react-router";

import { resolveActiveLogoTrailingItem } from "../utils";

import { useLogoTrailingSegment } from "./useLogoTrailingSegment";

/**
 * The active product of the (global) `logoTrailing` segment — whichever page's
 * route prefixes the current path (`findLast`, so the deepest/last match wins on
 * overlapping prefixes). Returns `null` when there is no logoTrailing segment or
 * no product is active (e.g. the landing page).
 *
 * Shared by {@link FwSegmentLogoTrailing} (the switcher trigger) and
 * accent-aware themes (which read the active item's `color` to recolor the UI
 * per product). Delegates to the pure {@link resolveActiveLogoTrailingItem}.
 */
export function useActiveLogoTrailingItem(): NavigationItem | null {
    const segment = useLogoTrailingSegment()
    const location = useLocation()

    if (!segment) {
        return null
    }

    return resolveActiveLogoTrailingItem(segment, location.pathname)
}
