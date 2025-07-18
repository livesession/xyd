import React from "react"

import { useSettings } from "../contexts"

import { Icon } from "@xyd-js/components/writer"
import { SidebarTabsDropdown, UISidebar } from "@xyd-js/ui"

import { useActivePage, useActiveSegment, useMatchedSegmentSidebarDropdown } from "../hooks"
import { NavigationItem } from "@xyd-js/core"

export function FwSidebarTabsDropdown() {
    const settings = useSettings()

    const activeSegment = useActiveSegment()
    const matchedSegmentSidebarDropdown = useMatchedSegmentSidebarDropdown()

    const activePage = useActivePage(true)

    const sidebarDropdown = settings.navigation?.sidebarDropdown || []

    return <UISidebar.ItemGroup>
        <$NavigationItemsSidebarTabs
            active={activePage || ""}
            items={sidebarDropdown || []}
        />

        <$NavigationItemsSidebarTabs
            active={activeSegment || ""}
            items={matchedSegmentSidebarDropdown?.pages || []}
        />
    </UISidebar.ItemGroup>
}

function $NavigationItemsSidebarTabs({ items, active }: { items: NavigationItem[], active?: string }) {
    if (!items?.length) {
        return null
    }

    return <SidebarTabsDropdown
        options={items.map(item => ({
            label: item.title ?? "",
            description: item.description,
            value: item.page || item.href || "",
            icon: item.icon ? <Icon name={item.icon} size={18} /> : null
        }))}
        value={active || ""}
    />
}