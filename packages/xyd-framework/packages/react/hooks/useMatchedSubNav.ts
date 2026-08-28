import { Segment } from "@xyd-js/core";

import { useMatchedSegment } from "./useMatchedSegment";
import { useTabSegments } from "./useTabSegments";
import { useAppearance } from "../contexts";

// TODO: better data structures
export function useMatchedSubNav(): Segment | null {
    const matchedSegment = useMatchedSegment()
    const tabSegments = useTabSegments()
    const appearance = useAppearance()

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

