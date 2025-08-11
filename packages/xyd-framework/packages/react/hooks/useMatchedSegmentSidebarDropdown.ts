import { Segment } from "@xyd-js/core";

import { useMatchedSegment } from "./useMatchedSegment";

// TODO: better data structures
export function useMatchedSegmentSidebarDropdown(): Segment | null {
    const matchedSegment = useMatchedSegment()
    if (!matchedSegment) {
        return null
    }

    if (matchedSegment.appearance === "sidebarDropdown") {
        return matchedSegment
    }

    return null
}

