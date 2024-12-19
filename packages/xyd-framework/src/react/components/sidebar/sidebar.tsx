import React, {useContext} from "react"

import {UISidebar} from "@xyd/ui2";

import {useGroup} from "./sidebar-group";
import {UIContext} from "../../contexts/ui";

// TODO: custom hooks for active onclick handler etc?

export interface FwSidebarGroupProps {
    group: string

    items: FwSidebarItemProps[]
}

export function FwSidebarItemGroup(props: FwSidebarGroupProps) {
    return <>
        <UISidebar.ItemHeader>
            {props.group}
        </UISidebar.ItemHeader>

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

    const activeLink = props.active || uiContext?.href === props.href

    return <UISidebar.Item
        button={!!props.items?.length}
        href={props.href}
        active={activeLink}
        onClick={setActive}
    >
        {props.title}
        {
            props.items?.length && <UISidebar.SubTree isOpen={isActive}>
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
            </UISidebar.SubTree>
        }
    </UISidebar.Item>

    // if (props.items?.length) {
    //     return <UIFolder
    //         title={props.title}
    //         asButton
    //         active={props.active}
    //         isOpen={isActive}
    //         onClick={setActive}
    //     >
    //         <>
    //             {
    //                 props.items?.map((item, index) => <FwSidebarItem
    //                     key={index + item.href}
    //                     title={item.title}
    //                     href={item.href}
    //                     items={item.items}
    //                     active={item.active}
    //                     level={(props.level || 0) + 1}
    //                 />)
    //             }
    //         </>
    //     </UISidebar.SubTree>
    // }
    //
    // const activeLink = props.active || uiContext?.href === props.href
    //
    // return <UISidebar.Item
    //     title={props.title}
    //     href={props.href}
    //     active={activeLink}
    //     onClick={onClick ? (e) => onClick(e, props) : undefined}
    // />
}
