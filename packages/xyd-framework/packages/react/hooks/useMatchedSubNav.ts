import { useLocation } from "react-router";

import { Segment } from "@xyd-js/core";

import { pageLink, trailingSlash } from "../utils";
import { useMatchedSegment } from "./useMatchedSegment";
import { useTabSegments } from "./useTabSegments";

// TODO: better data structures
export function useMatchedSubNav(): Segment | null {
    const matchedSegment = useMatchedSegment()
    const tabSegments = useTabSegments()

    if (!matchedSegment || matchedSegment.type === "sidebarDropdown") {
        return tabSegments
    }

    return matchedSegment || null
}

