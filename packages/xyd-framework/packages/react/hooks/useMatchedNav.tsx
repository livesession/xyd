import {useLocation, useMatches} from "react-router";

import {useSettings} from "../contexts";

function normalizeHref(href: string) {
    if (href.startsWith("/")) {
        return href
    }

    return `/${href}`
}

// TODO: better data structures
export function useMatchedSubNav() {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id

    const matchedSubnav = settings.navigation?.header
        ?.filter(item => item.sub)
        ?.find(item => item.sub?.items?.find(item => item.url === lastMatchId))

    if (!matchedSubnav) {
        return null
    }

    return matchedSubnav.sub || null
}
