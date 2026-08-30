import { Segment } from "@xyd-js/core";

import { useMatchedSegment } from "./useMatchedSegment";
import { useMatchedSegmentTabs } from "./useMatchedSegmentTabs";
import { useTabSegments } from "./useTabSegments";
import { useAppearance } from "../contexts";

// TODO: better data structures
export function useMatchedSubNav(): Segment | null {
    const tabsSegment = useMatchedSegmentTabs()
    const matchedSegment = useMatchedSegment()
    const tabSegments = useTabSegments()
    const appearance = useAppearance()

    // A route-scoped `appearance: "tabs"` segment (per-product) owns the subnav
    // slot — its `pages` render as the tab bar, replacing any global `tabs`.
    // EXCEPT when `appearance.tabs.surface === "center"`: then the tabs render in
    // the primary-nav center (FwNav) instead of the subnav.
    if (tabsSegment && appearance?.tabs?.surface !== "center") {
        return tabsSegment
    }

    if (
        (
            appearance?.tabs?.surface === "center" ||
            appearance?.tabs?.surface === "sidebar"
        ) && !matchedSegment
    ) {
        return null
    }

    // A segment with an explicit appearance (sidebarDropdown, logoTrailing, …)
    // renders in its own dedicated place — never as the default subnav/subheader.
    if (!matchedSegment || matchedSegment.appearance) {
        return tabSegments
    }

    return matchedSegment || null
}

