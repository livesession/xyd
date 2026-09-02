import { useLocation } from "react-router";

import { Segment } from "@xyd-js/core";

import { findActiveNavigationPage } from "../utils";
import { useMatchedSegment } from "./useMatchedSegment";

/**
 * The `page` of the segment item matching the current pathname (route-prefix,
 * last declared match wins), or "". By default the segment comes from
 * {@link useMatchedSegment}; pass `segment` to resolve against a SPECIFIC
 * segment's own pages (the sidebar-dropdown switcher does this so nested
 * `pages` groups resolve against the dropdown's items, not a co-routed tabs
 * segment). Nested groups are flattened — a group row itself (no `page`)
 * never becomes active, its leaves do.
 */
export function useActiveSegment(segment?: Segment | null) {
    const location = useLocation()
    const matchedSegment = useMatchedSegment()

    const seg = segment ?? matchedSegment

    return findActiveNavigationPage(seg?.pages, location.pathname)?.page || ""
}
