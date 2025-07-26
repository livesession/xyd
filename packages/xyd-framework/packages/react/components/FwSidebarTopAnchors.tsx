import React from "react"

import { useSettings } from "../contexts"
import { FwSidebarNavigationItem } from "./FwSidebarNavigationItem"

export function FwSidebarTopAnchors() {
    const settings = useSettings()

    const sidebarTopAnchors = settings?.navigation?.anchors?.sidebar?.top?.map(FwSidebarNavigationItem)

    return sidebarTopAnchors
}