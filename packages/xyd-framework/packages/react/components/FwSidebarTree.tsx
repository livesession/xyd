import React, {} from "react";
import {useLocation} from "react-router";

import {useSidebarGroups} from "../contexts";
import {useSidebarActive} from "../lib";
import {trailingSlash} from "../utils";

import {FwSidebarItem, FwSidebarItemElementProps} from "./FwSidebarItem";

export function useSidebarTree(): [React.ReactElement[], { initialActiveItems: any[] }] {
    const location = useLocation()
    const groups = useSidebarGroups()
    const {activeHref} = useSidebarActive()

    const pathname = trailingSlash(location.pathname)
    // A scroll-spy host (the editor) can override the active href, so the sidebar
    // follows the scrolled-to reference instead of the route.
    const effectiveHref = activeHref ?? pathname

    // The tree STRUCTURE depends only on the groups — memoize it separately so a
    // changing active href (scroll) doesn't rebuild the whole tree.
    const sidebarTree = React.useMemo(
        () =>
            groups?.map((group, index) => <FwSidebarItem
                key={index + group.group}
                {...group}
                groupIndex={index}
            />) || [],
        [groups],
    )

    // Which items are open/active — recomputed when the active href changes
    // (cheap: just the path search, not the tree). Feeds FooSidebar, which (in
    // keepExpanded mode) MERGES these in, so scrolling auto-expands the active
    // reference's group.
    const initialActiveItems = React.useMemo(() => {
        const items: any[] = []
        groups.forEach((group, groupIndex) => {
            const activeLevels = recursiveSearch(group.items, effectiveHref) || []

            activeLevels.reduce((acc, index, level) => {
                items.push({
                    ...acc[index],
                    groupIndex: groupIndex,
                    level: level,
                    itemIndex: index,
                })
                acc[index].active = true
                return acc[index].items
            }, group.items)

            return group
        })
        return items
    }, [groups, effectiveHref])

    return [sidebarTree, {initialActiveItems}]
}

function recursiveSearch(items: FwSidebarItemElementProps[], href: string, levels: any[] = []) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.href === href) {
            return [...levels, i]
        }

        if (item.items) {
            const result = recursiveSearch(item.items, href, [...levels, i])
            if (result) {
                return result
            }
        }
    }
    return null
}
