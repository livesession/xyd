import React, { } from "react";
import { useLocation } from "react-router";

import { UISidebar } from "@xyd-js/ui"
import {
    Icon,
} from "@xyd-js/components/writer";
import { SidebarTabsDropdown } from "@xyd-js/ui";

import { SurfaceTarget } from "../../../src";
import { useAppearance, useSettings, useSidebarGroups } from "../contexts";
import { trailingSlash } from "../utils";
import { useActivePage, useDefaultHeaderItems, useHeaderItems } from "../hooks";

import { Surface } from "./Surfaces";
import { FwSidebarItem, FwSidebarItemElementProps } from "./FwSidebarItem";
import { FooSidebar } from "../lib";
import { FwSidebarNavigationItem } from "./FwSidebarNavigationItem";

export interface FwSidebarProps {
}

export function FwSidebar(props: FwSidebarProps) {
    const location = useLocation()
    const groups = useSidebarGroups()
    const settings = useSettings()
    const defaultHeaderItems = useDefaultHeaderItems()
    const activeHeaderPage = useActivePage()
    const appearance = useAppearance()
    const headerItems = useHeaderItems()

    const pathname = trailingSlash(location.pathname)
    const sidebarDropdownItems = settings.navigation?.sidebarDropdown || []
    const sidebarDropdownElements = sidebarDropdownItems?.length ? sidebarDropdownItems : defaultHeaderItems

    // TODO: active state for footer items?
    const sidebarTopAnchors = settings?.navigation?.anchors?.sidebar?.top?.map(FwSidebarNavigationItem)
    const sidebarFooterAnchors = settings.navigation?.anchors?.sidebar?.bottom?.map(FwSidebarNavigationItem)

    const sidebarRightItems = headerItems?.right?.map(FwSidebarNavigationItem)

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

    // TODO: better API for elements like logo search
    return <FooSidebar
        initialActiveItems={initialActiveItems}
    >
        <UISidebar
            footerItems={sidebarFooterAnchors && sidebarFooterAnchors}
            scrollShadow={appearance?.sidebar?.scrollShadow}
        >
            <Surface target={SurfaceTarget.SidebarTop} />

            {
                sidebarRightItems?.length ? <div data-mobile>
                    {sidebarRightItems}
                </div> : null
            }

            {sidebarTopAnchors}

            <div data-desktop>
                {sidebarDropdownElements?.length ? (
                    <SidebarTabsDropdown
                        options={sidebarDropdownElements.map(item => ({
                            label: item.title ?? "",
                            description: item.description,
                            value: item.page || item.href || "",
                            icon: item.icon ? <Icon name={item.icon} size={18} /> : null
                        }))}
                        value={activeHeaderPage}
                    />
                ) : null}
            </div>

            <div data-mobile>
                {sidebarDropdownElements?.length ? (
                    <SidebarTabsDropdown
                        options={sidebarDropdownElements.map(item => ({
                            label: item.title ?? "",
                            value: item.page || item.href || "",
                            icon: item.icon ? <Icon name={item.icon} size={18} /> : null
                        }))}
                        value={activeHeaderPage}
                    />
                ) : null}
            </div>

            {
                groups?.map((group, index) => <FwSidebarItem
                    key={index + group.group}
                    {...group}
                    groupIndex={index}
                />)
            }
        </UISidebar>
    </FooSidebar>
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
