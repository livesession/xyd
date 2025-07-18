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

    if (!matchedSegment || matchedSegment.appearance === "sidebarDropdown") {
        return tabSegments
    }

    return matchedSegment || null
}

