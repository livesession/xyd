import {useMatches} from "react-router";

import {useSettings} from "../contexts";

// TODO: better data structures
export function useMatchedSubNav() {
    const settings = useSettings()
    const matches = useMatches()

    const lastMatchId = matches[matches.length - 1]?.id

    const matchedSubnav = settings.navigation?.subheader
        ?.find(item => item.items?.find(item => item.url === lastMatchId))

    if (!matchedSubnav) {
        return null
    }

    return matchedSubnav || null
}
