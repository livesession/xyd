import {useLocation} from "react-router";

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
    const location = useLocation()

    const matchedSubnav = settings.navigation?.header
        ?.filter(item => item.sub)
        ?.find(item => normalizeHref(location.pathname).startsWith(normalizeHref(item.sub?.route || "")))

    if (!matchedSubnav) {
        return null
    }

    return matchedSubnav.sub || null
}
