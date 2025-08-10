import { useLocation, useMatches } from "react-router";

import { pageLink, trailingSlash } from "../utils";
import { useMatchedSubNav } from "./useMatchedSubNav";

export function useActiveMatchedSubNav() {
    const location = useLocation()
    const matchedSubnav = useMatchedSubNav()
    const matches = useMatches()

    const pathname = trailingSlash(location.pathname)

    const lastMatch = matches[matches.length - 1]
    const isIndex = lastMatch?.pathname === "/"

    // TODO: in the future routing props from settings like {match: "/docs/api/browser"}
    return matchedSubnav?.pages?.filter(p => typeof p.page === "string").findLast(item => {
        if (isIndex) {
            return item.page === "index"
        }

        return pathname.startsWith(pageLink(item.page || ""))
    })
}
