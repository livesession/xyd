import { useMatches } from "react-router";

import { useSettings } from "../contexts";
import { pageLink } from "../utils";
import { useMatchedSubNav } from "./useMatchedSubNav";

export function useActivePage() {
    const matches = useMatches()
    const matchedSubnav = useMatchedSubNav()
    const settings = useSettings()

    const lastMatch = matches[matches.length - 1]

    const navigationItems = [
        ...(settings?.navigation?.tabs || []),
        ...(settings?.navigation?.sidebarDropdown || []),
        ...(settings?.webeditor?.header || [])
    ]

    const active = navigationItems.find(item => {
        if (matchedSubnav) {
            return pageLink(item.page || "") === pageLink(matchedSubnav?.route)
        }

        return pageLink(item.page || "") === lastMatch?.id
    })

    return active?.page || ""
}