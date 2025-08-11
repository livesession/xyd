import { useLocation } from "react-router";
import { pageLink, trailingSlash } from "../utils";
import { useMatchedSegment } from "./useMatchedSegment";

export function useActiveSegment() {
    const location = useLocation()
    const pathname = trailingSlash(location.pathname)
    const matchedSegment = useMatchedSegment()

    const active = matchedSegment?.pages?.findLast(item => {
        return pathname.startsWith(pageLink(item.page || ""))
    })

    return active?.page || ""
}
