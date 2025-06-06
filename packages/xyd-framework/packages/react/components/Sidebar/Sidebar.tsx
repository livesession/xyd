import React, { } from "react"

import { UISidebar } from "@xyd-js/ui";

import { useGroup } from "./SidebarGroup";
import { useIconComponent } from "../../contexts";
import { Icon } from "@xyd-js/components/writer";

// TODO: custom hooks for active onclick handler etc?

export interface FwSidebarGroupProps {
    group: string

    groupIndex: number

    items: FwSidebarItemProps[]

    icon?: string
}

export function FwSidebarItemGroup(props: FwSidebarGroupProps) {
    return <>
        <UISidebar.ItemHeader>
            {props.group}
        </UISidebar.ItemHeader>

        {props.items.map((item, index) => <FwSidebarItem
            uniqIndex={item.uniqIndex}
            groupIndex={props.groupIndex}
            level={0}
            itemIndex={index}
            key={index + item.href}
            title={item.title}
            sidebarTitle={item.sidebarTitle}
            href={item.href}
            items={item.items}
            active={item.active}
            icon={item.icon}
        />)}
    </>
}

export interface FwSidebarItemProps {
    title: string

    href: string

    uniqIndex: number

    icon?: string

    sidebarTitle?: string

    items?: FwSidebarItemProps[]

    active?: boolean

    // internal
    readonly level?: number
    readonly groupIndex?: number
    readonly itemIndex?: number
    // internal
}

function FwSidebarItem(props: FwSidebarItemProps) {
    const { active } = useGroup()
    const [isActive, setActive] = active(props)

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

    // An item should only be considered active if it's the final target (has href)
    const isActiveItem = !!(isActive && props.href)
    // Only mark as parent active if it's a parent of an active item with href
    const isParentActive = hasActiveChild

    const IconComponent = useIconComponent() || Icon
    const icon = <IconComponent name={props.icon || ""} width={16} />

    return <UISidebar.Item
        button={nested}
        href={props.href}
        active={isActiveItem}
        isParentActive={isParentActive}
        onClick={handleClick}
        icon={icon}
    >
        {title}

        {
            props.items?.length && <UISidebar.SubTree isOpen={isActive}>
                <>
                    {
                        props.items?.map((item, index) => <FwSidebarItem
                            uniqIndex={item.uniqIndex}
                            groupIndex={props.groupIndex}
                            level={(props.level || 0) + 1}
                            itemIndex={index}
                            key={index + item.href}
                            title={item.title}
                            href={item.href}
                            items={item.items}
                            active={active(item)[0]}
                            icon={item.icon}
                        />)
                    }
                </>
            </UISidebar.SubTree>
        }
    </UISidebar.Item>
}
