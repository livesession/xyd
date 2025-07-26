import React, {} from "react";
import {useLocation} from "react-router";

import {useSidebarGroups} from "../contexts";
import {trailingSlash} from "../utils";

import {FwSidebarItem, FwSidebarItemElementProps} from "./FwSidebarItem";

export function useSidebarTree(): [React.ReactElement[], { initialActiveItems: any[] }] {
    const location = useLocation()
    const groups = useSidebarGroups()

    const pathname = trailingSlash(location.pathname)

    const initialActiveItems: any[] = []
    groups.forEach((group, groupIndex) => {
        const activeLevels = recursiveSearch(group.items, pathname) || []

        activeLevels.reduce((acc, index, level) => {
            initialActiveItems.push({
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

    const sidebarTree = groups?.map((group, index) => <FwSidebarItem
        key={index + group.group}
        {...group}
        groupIndex={index}
    />) || []

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
