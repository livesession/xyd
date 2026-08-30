import { useMatches } from "react-router";

import { Segment } from "@xyd-js/core";

import { useSettings } from "../contexts";

// TODO: better data structures
export function useMatchedSegment(): Segment | null {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id
    const segments = settings.navigation?.segments

    // A ROUTE-SCOPED segment (route is a string) matches when a router match id
    // equals its route, or one of its pages' `page` equals the current match id.
    let matchedSegment = segments?.find?.(item => {
        if (typeof item.route !== "string") {
            return false
        }
        if (matches?.find(m => sanitizeUrl(m.id) === sanitizeUrl(item.route as string))) {
            return true
        }
        return item.pages?.find?.(page => {
            return sanitizeUrl(page.page || "") === sanitizeUrl(lastMatchId || "")
        })
    })

    // Otherwise fall back to a GLOBAL segment (no `route` / `route: false`).
    if (!matchedSegment) {
        matchedSegment = segments?.find?.(item => item.route == null || item.route === false)
    }

    return matchedSegment || null
}

function sanitizeUrl(url: string) {
    if (url.startsWith("/")) {
        return url
    }

    return `/${url}`
}
