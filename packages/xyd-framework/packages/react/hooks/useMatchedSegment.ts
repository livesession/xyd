import { useMatches } from "react-router";

import { Segment } from "@xyd-js/core";

import { useSettings } from "../contexts";

// TODO: better data structures
export function useMatchedSegment(): Segment | null {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id

    const matchedSegment = settings.navigation?.segments
        ?.find(item => item.pages?.find(page => {
            return sanitizeUrl(page.page || "") === sanitizeUrl(lastMatchId)
        }))


    return matchedSegment || null
}

function sanitizeUrl(url: string) {
    if (url.startsWith("/")) {
        return url
    }

    return `/${url}`
}
