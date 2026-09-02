import React from "react"

import { WebEditorHeader } from "@xyd-js/core"

import { useHeaderItems } from "../hooks"
import { FwSidebarNavigationItem } from "./FwSidebarNavigationItem"

export function FwSidebarMobileHeaderItems() {
    const headerItems = useHeaderItems()

    const headerLeftItems = headerItems?.default?.filter(renderableItem).map(FwSidebarNavigationItem)
    const headerRightItems = headerItems?.right?.filter(renderableItem).map(FwSidebarNavigationItem)

    const mergedHeaderItems = [...headerLeftItems, ...headerRightItems]

    if (!mergedHeaderItems?.length) {
        return null
    }

    return <div data-mobile>
        {mergedHeaderItems}
    </div>
}

// Unlike the header, this surface renders every entry through FwSidebarNavigationItem — a plain
// link row that ignores `component`. Entries that exist only to mount a component (e.g. the theme's
// `Search`) therefore have nothing to show and would emit a blank row with an empty `href`.
function renderableItem(item: WebEditorHeader) {
    return !!(item.title || item.icon || item.page || item.href)
}