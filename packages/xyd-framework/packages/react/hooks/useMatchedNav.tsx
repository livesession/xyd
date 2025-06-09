import { useMatches } from "react-router";

import { useSettings } from "../contexts";

// TODO: better data structures
export function useMatchedSubNav() {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id

    let matchedSubnav = settings.navigation?.subheader
        ?.find(item => item.items?.find(item => {
            return sanitizeUrl(item.url || "") === sanitizeUrl(lastMatchId)
        }))


    // if (!matchedSubnav) {
    //     matchedSubnav = settings.navigation?.subheader
    //         ?.find(item => sanitizeUrl(item.route || "") === sanitizeUrl(lastMatchId))
    // }

    if (!matchedSubnav) {
        return null
    }

    return matchedSubnav || null
}


function sanitizeUrl(url: string) {
    if (url.startsWith("/")) {
        return url.slice(1)
    }

    return url
}