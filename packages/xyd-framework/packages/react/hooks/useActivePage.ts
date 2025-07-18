import { useMatches } from "react-router";

import { useSettings } from "../contexts";
import { pageLink } from "../utils";
import { useMatchedSubNav } from "./useMatchedSubNav";

export function useActivePage(subnavMatch: boolean = false) {
    const matches = useMatches()
    const matchedSubnav = useMatchedSubNav()
    const settings = useSettings()

    const lastMatch = matches[matches.length - 1]

    const navigationItems = [
        ...(settings?.navigation?.tabs || []),
        ...(settings?.navigation?.sidebarDropdown || []),
        ...(settings?.webeditor?.header || [])
    ]

    const isIndex = lastMatch?.pathname === "/"

    let active = navigationItems.find(item => {
        if (isIndex) {
            return item.page === "index"
        }

        if (matchedSubnav) {
            const routeMatch = pageLink(item.page || "") === pageLink(matchedSubnav?.route)

            if (routeMatch) {
                return routeMatch
            }

            if (subnavMatch) {
                const pageMatch = matchedSubnav?.pages.findLast(page => {
                    if (!page.page) {
                        return false
                    }

                    return pageLink(lastMatch?.id).startsWith(pageLink(page.page || ""))
                })
                
                return pageLink(pageMatch?.page || "") === pageLink(item.page || "")
            }

            return false
        }

        return pageLink(item.page || "") === lastMatch?.id
    })

    if (!active && !matchedSubnav && subnavMatch) {
        active = navigationItems.findLast(item => {
            if (!item.page) {
                return false
            }

            return pageLink(lastMatch?.id).startsWith(pageLink(item.page || ""))
        })
    }

    return active?.page || ""
}