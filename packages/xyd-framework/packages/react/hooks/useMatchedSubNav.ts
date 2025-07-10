import { useMatches } from "react-router";

import { useSettings } from "../contexts";
import { Segment } from "@xyd-js/core";

// TODO: better data structures
export function useMatchedSubNav(): Segment | null {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id

    const matchedSegment = settings.navigation?.segments
        ?.find(item => item.pages?.find(page => {
            return sanitizeUrl(page.page || "") === sanitizeUrl(lastMatchId)
        }))

    if (!matchedSegment) {
        const tabs = Array.isArray(settings.navigation?.tabs) ? settings.navigation?.tabs : settings.navigation?.tabs?.pages || []

        if (tabs?.length) {
            return {
                route: "",
                title: "",
                pages: tabs,
            }
        }

        return null
    }

    return matchedSegment || null
}

function sanitizeUrl(url: string) {
    if (url.startsWith("/")) {
        return url
    }

    return `/${url}`
}