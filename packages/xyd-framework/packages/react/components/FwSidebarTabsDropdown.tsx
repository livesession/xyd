import React from "react"

import { useSettings } from "../contexts"

import { Icon } from "@xyd-js/components/writer"
import { SidebarTabsDropdown } from "@xyd-js/ui"

import { useActivePage } from "../hooks"

export function FwSidebarTabsDropdown() {
    const settings = useSettings()
    const activeHeaderPage = useActivePage()

    const sidebarDropdown = settings.navigation?.sidebarDropdown || []

    if (!sidebarDropdown?.length) {
        return null
    }

    return (
        <SidebarTabsDropdown
            options={sidebarDropdown.map(item => ({
                label: item.title ?? "",
                description: item.description,
                value: item.page || item.href || "",
                icon: item.icon ? <Icon name={item.icon} size={18} /> : null
            }))}
            value={activeHeaderPage}
        />
    )
}