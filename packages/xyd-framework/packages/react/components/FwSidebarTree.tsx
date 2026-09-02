import React, {} from "react";
import {useLocation} from "react-router";

import {UISidebar} from "@xyd-js/ui";

import {useSidebarGroups} from "../contexts";
import {useSidebarActive} from "../lib";
import {trailingSlash} from "../utils";

import {FwSidebarItem, FwSidebarItemElementProps, FwSidebarItemProps} from "./FwSidebarItem";

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
    //
    // sidebar-as-TOC: CONSECUTIVE asToc groups (with the indicator enabled)
    // share ONE [data-astoc] wrapper — headers included — so a single
    // continuous TOC track line spans them (per-group wrappers would draw a
    // broken line per group). A group with `indicator: false` (or any
    // non-asToc group) ends the run.
    const sidebarTree = React.useMemo(
        () => {
            const nodes: React.ReactElement[] = []
            let run: React.ReactElement[] = []

            const flushRun = () => {
                if (!run.length) return
                nodes.push(
                    <UISidebar.ItemGroup asToc key={`astoc-run-${nodes.length}`}>
                        {run}
                    </UISidebar.ItemGroup>
                )
                run = []
            }

            groups?.forEach((group, index) => {
                const el = <FwSidebarItem
                    // `index + group.group` is NaN for a groupless group (flat items,
                    // pageless component wrap) → key collisions. Index is stable +
                    // unique here (groups don't reorder).
                    key={`group-${index}-${group.group ?? ""}`}
                    {...group}
                    groupIndex={index}
                />
                if (asTocIndicatorOf(group)) {
                    run.push(el)
                } else {
                    flushRun()
                    // A group with no header draws no divider of its own — themes
                    // hang that off the header — so consecutive headerless groups
                    // ran together as one flat list. Mark the boundary explicitly.
                    if (nodes.length && !group.group) {
                        nodes.push(<UISidebar.ItemSeparator key={`separator-${index}`} />)
                    }
                    nodes.push(el)
                }
            })
            flushRun()

            return nodes
        },
        [groups],
    )

    // Which items are open/active — recomputed when the active href changes
    // (cheap: just the path search, not the tree). Feeds FooSidebar, which (in
    // keepExpanded mode) MERGES these in, so scrolling auto-expands the active
    // reference's group.
    const routeActiveItems = React.useMemo(() => {
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

    // Groups configured `expanded: true` open regardless of the route. Purely
    // structural, so it depends on `groups` alone — an href change (scroll-spy)
    // can't add or remove one. Same {groupIndex, level, itemIndex} shape the
    // route search produces, since FwSidebarItem keys its open state by it.
    const expandedItems = React.useMemo(() => {
        const items: any[] = []

        function walk(nodes: FwSidebarItemElementProps[] | undefined, groupIndex: number, level: number) {
            nodes?.forEach((item, itemIndex) => {
                if (item.expanded) {
                    items.push({
                        ...item,
                        groupIndex: groupIndex,
                        level: level,
                        itemIndex: itemIndex,
                        expandedByDefault: true,
                    })
                }

                walk(item.items, groupIndex, level + 1)
            })
        }

        groups.forEach((group, groupIndex) => walk(group.items, groupIndex, 0))

        return items
    }, [groups])

    // Route branch LAST: a group holding the active page always opens, even if
    // the reader collapsed it earlier (FooSidebar only lets a manual collapse
    // stick for the `expandedByDefault` seeds).
    const initialActiveItems = React.useMemo(
        () => [...expandedItems, ...routeActiveItems],
        [expandedItems, routeActiveItems],
    )

    return [sidebarTree, {initialActiveItems}]
}

/** asToc group with the TOC track line enabled (`indicator` defaults true). */
function asTocIndicatorOf(group: FwSidebarItemProps): boolean {
    return !!group.asToc
        && (typeof group.asToc !== "object" || group.asToc.indicator !== false)
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
