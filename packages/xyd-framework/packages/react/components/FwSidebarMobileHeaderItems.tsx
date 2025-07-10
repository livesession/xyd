import React from "react"

import { useHeaderItems } from "../hooks"
import { FwSidebarNavigationItem } from "./FwSidebarNavigationItem"

export function FwSidebarMobileHeaderItems() {
    const headerItems = useHeaderItems()

    const headerLeftItems = headerItems?.default?.map(FwSidebarNavigationItem)
    const headerRightItems = headerItems?.right?.map(FwSidebarNavigationItem)

    const mergedHeaderItems = [...headerLeftItems, ...headerRightItems]

    if (!mergedHeaderItems?.length) {
        return null
    }

    return <div data-mobile>
        {mergedHeaderItems}
    </div>
}