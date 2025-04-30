import React, {} from "react"

import {Badge} from "@xyd-js/components/writer"
import {UISidebar} from "@xyd-js/ui";

import {useGroup} from "./SidebarGroup";

// TODO: custom hooks for active onclick handler etc?

export interface FwSidebarGroupProps {
    group: string
    
    groupIndex: number
    
    items: FwSidebarItemProps[]
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
            href={item.href}
            items={item.items}
            active={item.active}
        />)}
    </>
}

export interface FwSidebarItemProps {
    title: string | {
        code: string
    }

    href: string

    uniqIndex: number

    items?: FwSidebarItemProps[]

    active?: boolean

    // internal
    readonly level?: number
    readonly groupIndex?: number
    readonly itemIndex?: number
    // internal
}

// TODO: move to @xyd-js/components/content
const components = {
    Frontmatter: {
        // TODO: css
        Title: ({children}) => <div style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: "10px",
        }}>
            {children}
        </div>,
    },
    Badge: ({children, ...rest}) => <Badge {...rest}>
        {children}
    </Badge>
}

function mdxExport(code: string, components: any) {
    const scope = {
        Fragment: React.Fragment,
        jsxs: React.createElement,
        jsx: React.createElement,
        jsxDEV: React.createElement,
        _jsxs: React.createElement,
        _jsx: React.createElement,
        ...components
    }
    const fn = new Function(...Object.keys(scope), `return ${code}`)
    return fn(...Object.values(scope))
}

function FwSidebarItem(props: FwSidebarItemProps) {
    const {active} = useGroup()
    const [isActive, setActive] = active(props)

    let Title: any

    if (typeof props.title === "object" && "code" in props.title) {
        const code = props.title.code

        Title = () => mdxExport(
            code.replace("() => ", ""),
            components
        )
    } else {
        Title = () => props.title
    }

    const nested = !!props.items?.length

    const handleClick = () => {
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

    return <UISidebar.Item
        button={nested}
        href={props.href}
        active={isActiveItem}
        isParentActive={isParentActive}
        onClick={handleClick}
    >
        <Title/>

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
                        />)
                    }
                </>
            </UISidebar.SubTree>
        }
    </UISidebar.Item>
}
