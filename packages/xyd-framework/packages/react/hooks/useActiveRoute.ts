import { useMatches } from "react-router";

import { useSettings } from "../contexts";
import { pageLink } from "../utils";

// TODO: in the future nested routes
export function useActiveRoute() {
    const matches = useMatches()
    const settings = useSettings()

    const lastMatch = matches[matches.length - 1]

    const activeRoute = settings?.navigation?.sidebar?.find(item => {
        if (typeof item === "object" && "route" in item) {
            return pageLink(lastMatch?.id || "") === pageLink(item.route || "")
        }

        return false
    })


    if (typeof activeRoute === "object" && "route" in activeRoute) {
        return activeRoute
    }

    return null
}