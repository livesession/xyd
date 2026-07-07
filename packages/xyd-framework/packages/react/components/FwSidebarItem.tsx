import React, { useEffect, useState } from "react"

import { Metadata } from "@xyd-js/core";
import { Icon } from "@xyd-js/components/writer";
import { UISidebar } from "@xyd-js/ui";


import { Surface } from "./Surfaces";
import { FooSidebarItemProps, useFooSidebar, useSidebarActive } from "../lib";

export interface FwSidebarItemProps {
    group: string

    groupIndex: number

    items: FwSidebarItemElementProps[]

    icon?: string
}

export function FwSidebarItem(props: FwSidebarItemProps) {
    const icon = props.icon ? <Icon name={props.icon || ""} size={16} /> : null

    return <>
        {
            props.group && <UISidebar.ItemHeader icon={icon}>
                {props.group}
            </UISidebar.ItemHeader>
        }

        {props.items.map((item, index) => <FwSidebarItem.Item
            uniqIndex={item.uniqIndex}
            group={item.group}
            groupIndex={props.groupIndex}
            level={0}
            itemIndex={index}
            key={index + item.href}
            title={item.title}
            sidebarTitle={item.sidebarTitle}
            url={item.url}
            pageMeta={item.pageMeta}
            href={item.href}
            items={item.items}
            active={item.active}
            icon={item.icon}
        />)}
    </>
}

export interface FwSidebarItemElementProps extends FooSidebarItemProps {
    title: string

    group?: false

    href: string

    icon?: string

    sidebarTitle?: string

    items?: FwSidebarItemElementProps[]

    active?: boolean

    url?: string

    pageMeta?: Metadata
}

// Whether an injected active href lives anywhere under these items (drives a
// parent group's active highlight in scroll-spy mode).
function containsHref(items: FwSidebarItemElementProps[] | undefined, href: string): boolean {
    if (!items) return false
    return items.some(
        (item) => item.href === href || item.url === href || containsHref(item.items, href),
    )
}

FwSidebarItem.Item = function FwSidebarItem(props: FwSidebarItemElementProps) {
    const { active } = useFooSidebar()
    const { activeHref } = useSidebarActive()
    const [isActive, setActive] = active(props)

    // Mount the subtree while open, AND briefly while it closes so UICollapse can
    // animate the collapse (it measures the children's height — if they've
    // already unmounted it snaps shut). Then unmount, so a collapsed group
    // doesn't retain its whole subtree (the lazy-mount perf win).
    const [renderChildren, setRenderChildren] = useState(isActive)
    useEffect(() => {
        if (isActive) {
            setRenderChildren(true)
            return
        }
        const timeout = setTimeout(() => setRenderChildren(false), 320)
        return () => clearTimeout(timeout)
    }, [isActive])

    const title = props.sidebarTitle || props.title || ""
    const nested = !!props.items?.length

    function handleClick() {
        if (!nested) {
            return
        }

        setActive()
    }

    // Determine if this is a parent of the active item with href
    const hasActiveChild = props.items?.some(item => {
        const [itemActive] = active(item)
        return (itemActive && item.href) || item.items?.some(subItem => {
            const [subItemActive] = active(subItem)
            return subItemActive && subItem.href
        })
    })

    // An item is active if it's the final target (has href). A scroll-spy host
    // (the API editor) can inject an active href to drive it directly — a single
    // active item that follows the scroll — instead of the route-based Map.
    const isActiveItem = activeHref != null
        ? (props.href === activeHref || props.url === activeHref)
        : !!(isActive && props.href)
    // A parent highlights when it contains the active item.
    const isParentActive = activeHref != null
        ? containsHref(props.items, activeHref)
        : hasActiveChild

    const icon = props.icon ? <Icon name={props.icon} size={16} /> : null

    return <UISidebar.Item
        button={nested}
        href={props.url || props.href}
        active={isActiveItem}
        isParentActive={isParentActive}
        onClick={handleClick}
        icon={icon}
        group={props.group}
    >
        <div part="item-title-container">
            <Surface
                target="sidebar.item.left"
                props={{
                    active: isActiveItem,
                    pageMeta: props.pageMeta,
                }}
            />
            <div part="item-title">
                {title}
            </div>

            {props.url && <Icon.ExternalArrow />}

            <Surface
                target="sidebar.item.right"
                props={{
                    active: isActiveItem,
                    pageMeta: props.pageMeta,
                }}
            />
        </div>

        {
            props.group === false && props.items?.length && <>
                {
                    props.items?.map((item, index) => <FwSidebarItem
                        uniqIndex={item.uniqIndex}
                        group={item.group}
                        groupIndex={props.groupIndex}
                        level={(props.level || 0) + 1}
                        itemIndex={index}
                        key={index + item.href}
                        title={item.title}
                        href={item.href}
                        items={item.items}
                        active={active(item)[0]}
                        icon={item.icon}
                        pageMeta={item.pageMeta}
                    />)
                }
            </>
        }
        {
            props.group !== false && props.items?.length && <UISidebar.SubTree isOpen={isActive}>
                {renderChildren && <>
                    {
                        props.items?.map((item, index) => <FwSidebarItem
                            uniqIndex={item.uniqIndex}
                            group={item.group}
                            groupIndex={props.groupIndex}
                            level={(props.level || 0) + 1}
                            itemIndex={index}
                            key={index + item.href}
                            title={item.title}
                            href={item.href}
                            items={item.items}
                            active={active(item)[0]}
                            icon={item.icon}
                            pageMeta={item.pageMeta}
                        />)
                    }
                </>}
            </UISidebar.SubTree>
        }
    </UISidebar.Item>
}

