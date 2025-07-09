import {useMatches} from "react-router";

import {useSettings} from "../contexts";

// TODO: better data structures
export function useMatchedSubNav() {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id

    let matchedSubnav = settings.navigation?.segments
        ?.find(item => item.pages?.find(page => {
            return sanitizeUrl(page.page || "") === sanitizeUrl(lastMatchId)
        }))

    if (!matchedSubnav) {
        return null
    }

    return matchedSubnav || null
}

function sanitizeUrl(url: string) {
    if (url.startsWith("/")) {
        return url
    }

    return `/${url}`
}