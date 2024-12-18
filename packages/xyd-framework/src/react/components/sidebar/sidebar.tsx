import React, {useContext, useState} from "react"

import {UIFile, UIFolder, UISeparator} from "@xyd/ui";

import {useGroup} from "./sidebar-group";
import {UIContext} from "../../contexts/ui";

// TODO: custom hooks for active onclick handler etc?

export interface FwSidebarGroupProps {
    group: string

    items: FwSidebarItemProps[]
}

export function FwSidebarGroup(props: FwSidebarGroupProps) {
    return <>
        <UISeparator>
            {props.group}
        </UISeparator>

        {props.items.map((item, index) => <FwSidebarItem
            key={index + item.href}
            title={item.title}
            href={item.href}
            items={item.items}
            active={item.active}
            level={0}
        />)}
    </>
}

export interface FwSidebarItemProps {
    title: string

    href: string

    items?: FwSidebarItemProps[]

    active?: boolean

    // internal
    readonly level?: number
    // internal
}

function FwSidebarItem(props: FwSidebarItemProps) {
    const {active, onClick} = useGroup()
    const [isActive, setActive] = active(props)

    const uiContext = useContext(UIContext)

    if (props.items?.length) {
        return <UIFolder
            title={props.title}
            asButton
            active={props.active}
            isOpen={isActive}
            onClick={setActive}
        >
            <>
                {
                    props.items?.map((item, index) => <FwSidebarItem
                        key={index + item.href}
                        title={item.title}
                        href={item.href}
                        items={item.items}
                        active={item.active}
                        level={(props.level || 0) + 1}
                    />)
                }
            </>
        </UIFolder>
    }

    const activeLink = props.active || uiContext?.href === props.href

    return <UIFile
        title={props.title}
        href={props.href}
        active={activeLink}
        onClick={onClick ? (e) => onClick(e, props) : undefined}
    />
}
