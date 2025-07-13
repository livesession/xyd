import {useLocation} from "react-router";
import {pageLink, trailingSlash} from "../utils";
import {useMatchedSubNav} from "./useMatchedSubNav";

export function useActiveMatchedSubNav() {
    const location = useLocation()
    const pathname = trailingSlash(location.pathname)
    const matchedSubnav = useMatchedSubNav()

    // TODO: in the future routing props from settings like {match: "/docs/api/browser"}
    return matchedSubnav?.pages?.findLast(item => {
        return pathname.startsWith(pageLink(item.page || ""))
    })
}
