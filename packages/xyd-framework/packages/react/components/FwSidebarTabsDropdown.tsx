import React from "react"

import { useSettings } from "../contexts"

import { Icon } from "@xyd-js/components/writer"
import { SidebarTabsDropdown, UISidebar, type SidebarTabsDropdownOption } from "@xyd-js/ui"

import { useActivePage, useActiveSegment, useMatchedSegmentSidebarDropdown } from "../hooks"
import { NavigationItem } from "@xyd-js/core"
import { pageLink, segmentAppearanceOptions } from "../utils"

/**
 * The sidebar section switcher: the global `navigation.sidebarDropdown` plus the
 * matched `appearance: "sidebarDropdown"` segment.
 *
 * `fixed` selects the render SITE. A segment declaring
 * `appearance: { kind: "sidebarDropdown", options: { fixed: true } }` renders in
 * the sidebar's FIXED (pinned) region — FwSidebar mounts one instance there with
 * `fixed`, and one at the top of the scrollable list without it; each instance
 * shows only the content that belongs to its site.
 */
export function FwSidebarTabsDropdown({ fixed = false }: { fixed?: boolean } = {}) {
    const settings = useSettings()

    const matchedSegmentSidebarDropdown = useMatchedSegmentSidebarDropdown()
    // Resolve active against the DROPDOWN segment's own pages (nested groups
    // flattened) — a co-routed `tabs` segment must not shadow nested leaves.
    const activeSegment = useActiveSegment(matchedSegmentSidebarDropdown)

    const activePage = useActivePage(true)

    // The global config has no `fixed` concept → always the in-list site.
    const sidebarDropdown = fixed ? [] : (settings.navigation?.sidebarDropdown || [])
    const segmentIsFixed = !!segmentAppearanceOptions<{ fixed?: boolean }>(matchedSegmentSidebarDropdown).fixed
    const segmentDropdownPages = (matchedSegmentSidebarDropdown && segmentIsFixed === fixed)
        ? (matchedSegmentSidebarDropdown.pages || [])
        : []

    // Nothing to show → render nothing (an empty `[part="item-group"]` would still
    // add its top margin + separator space at the top of the sidebar).
    if (!sidebarDropdown.length && !segmentDropdownPages.length) {
        return null
    }

    const content = <>
        <$NavigationItemsSidebarTabs
            active={activePage || ""}
            items={sidebarDropdown || []}
        />

        <$NavigationItemsSidebarTabs
            active={activeSegment || ""}
            items={segmentDropdownPages}
        />
    </>

    // In the fixed (pinned) container there's no surrounding item list, so the
    // `[part="item-group"]` list chrome (top margin, separator) is skipped.
    if (fixed) {
        return content
    }

    return <UISidebar.ItemGroup>{content}</UISidebar.ItemGroup>
}

function $NavigationItemsSidebarTabs({ items, active }: { items: NavigationItem[], active?: string }) {
    if (!items?.length) {
        return null
    }

    // Recursive: an item with nested `pages` becomes a GROUP option (inline-
    // expandable row in the dropdown); its children map the same way.
    function toOption(item: NavigationItem): SidebarTabsDropdownOption {
        let href: string | null = null

        if (typeof item.href === "string") {
            href = pageLink(item.href)
        }

        if (!href && typeof item.page === "string") {
            href = pageLink(item.page)
        }

        return {
            label: item.title ?? "",
            description: item.description,
            value: item.page || item.href || "",
            icon: item.icon ? <Icon name={item.icon} size={18} /> : null,
            href: href,
            items: item.pages?.length ? item.pages.map(toOption) : undefined,
        }
    }

    return <SidebarTabsDropdown
        options={items.map(toOption)}
        value={active || ""}
    />
}