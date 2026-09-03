import React, { useEffect, useState } from "react"

import { Metadata } from "@xyd-js/core";
import { Icon } from "@xyd-js/components/writer";
import { UISidebar } from "@xyd-js/ui";


import { Surface } from "./Surfaces";
import { FwSidebarComponent } from "./FwSidebarComponent";
import { useSidebarAsToc } from "./FwSidebarAsToc";
import { FooSidebarItemProps, useFooSidebar, useSidebarActive } from "../lib";
import { useSidebarFilter } from "../contexts";
import { sidebarItemMatchesQuery } from "../utils";

/** Resolved sidebar-as-TOC behavior flags carried on groups + their items. */
export interface FwSidebarAsTocProps {
    /** TOC-style vertical track line on the group (default true) */
    indicator?: boolean
    /** host-page breadcrumbs follow this group's active section (default true) */
    breadcrumbs?: boolean
}

export interface FwSidebarItemProps {
    group: string

    groupIndex: number

    items: FwSidebarItemElementProps[]

    icon?: string

    /** sidebar-as-TOC group — its items scroll to sections of the host page */
    asToc?: boolean | FwSidebarAsTocProps
}

export function FwSidebarItem(props: FwSidebarItemProps) {
    const { query } = useSidebarFilter()
    const q = query.trim().toLowerCase()

    // Sidebar filter (opt-in): drop a whole group (header + items) when nothing
    // in it matches. No-op when there is no query.
    if (q && !props.items.some(item => sidebarItemMatchesQuery(item, q))) {
        return null
    }

    const icon = props.icon ? <Icon name={props.icon || ""} size={16} /> : null

    // NOTE: sidebar-as-TOC groups are NOT wrapped here — CONSECUTIVE asToc
    // groups must share ONE TOC track line, so the [data-astoc] wrapper is
    // applied a level up, in useSidebarTree (which chunks adjacent groups).
    return <>
        {
            props.group && <UISidebar.ItemHeader icon={icon}>
                {props.group}
            </UISidebar.ItemHeader>
        }

        {props.items.map((item, index) => {
            // A custom-component sidebar item (`{ component: "./path" }`). `fixed`
            // ones are pinned in the fixed region (rendered by FwSidebar), so skip
            // them here; non-fixed ones render inline in tree order.
            if (item.component) {
                if (item.fixed) return null
                return <FwSidebarComponent
                    key={`component-${index}-${item.component}`}
                    component={item.component}
                    props={item.componentProps}
                />
            }

            return <FwSidebarItem.Item
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
                asToc={item.asToc}
            />
        })}
    </>
}

export interface FwSidebarItemElementProps extends FooSidebarItemProps {
    title: string

    group?: false

    href: string

    icon?: string

    sidebarTitle?: string

    items?: FwSidebarItemElementProps[]

    /** nested group configured `expanded: true` — open on first load (see useSidebarTree) */
    expanded?: boolean

    active?: boolean

    url?: string

    pageMeta?: Metadata

    /** Custom-component sidebar item: path resolved via the components registry. */
    component?: string

    /** Pin this item in the sidebar's fixed region (hoisted out of the tree). */
    fixed?: boolean

    /** Props passed to the custom `component`. */
    componentProps?: Record<string, any>

    /** sidebar-as-TOC item — href is `<host>#<section>`; on the host page a
     *  click scrolls to the section instead of navigating. Object form carries
     *  the owning group's resolved behavior flags. */
    asToc?: boolean | FwSidebarAsTocProps
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
    const asTocSidebar = useSidebarAsToc()
    const { query } = useSidebarFilter()
    const [isActive, setActive] = active(props)

    const q = query.trim().toLowerCase()

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

    // Sidebar filter (opt-in): hide items whose subtree has no title match, and
    // force-expand a group that contains a match so the hit is visible. No-op
    // when there is no query.
    const forceExpand = !!q && nested && (props.items || []).some(item => sidebarItemMatchesQuery(item, q))
    if (q && !sidebarItemMatchesQuery(props, q)) {
        return null
    }

    function handleClick(e: React.MouseEvent) {
        // sidebar-as-TOC item on its host page: scroll to the section instead
        // of navigating (the provider preventDefaults; off-host it lets the
        // link navigate to <host>#<section>).
        if (props.asToc && asTocSidebar.enabled) {
            asTocSidebar.onItemClick(e, props.href)
        }

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
                        sidebarTitle={item.sidebarTitle}
                        href={item.href}
                        items={item.items}
                        active={active(item)[0]}
                        icon={item.icon}
                        url={item.url}
                        pageMeta={item.pageMeta}
                        asToc={item.asToc}
                    />)
                }
            </>
        }
        {
            props.group !== false && props.items?.length && <UISidebar.SubTree isOpen={isActive || forceExpand}>
                {(renderChildren || forceExpand) && <>
                    {
                        props.items?.map((item, index) => <FwSidebarItem
                            uniqIndex={item.uniqIndex}
                            group={item.group}
                            groupIndex={props.groupIndex}
                            level={(props.level || 0) + 1}
                            itemIndex={index}
                            key={index + item.href}
                            title={item.title}
                            sidebarTitle={item.sidebarTitle}
                            href={item.href}
                            items={item.items}
                            active={active(item)[0]}
                            icon={item.icon}
                            url={item.url}
                            pageMeta={item.pageMeta}
                            asToc={item.asToc}
                        />)
                    }
                </>}
            </UISidebar.SubTree>
        }
    </UISidebar.Item>
}

