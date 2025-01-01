import React, {} from "react"

import {Badge} from "@xyd/components/writer"
import {UISidebar} from "@xyd/ui2";

import {useGroup} from "./sidebar-group";

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
    title: string | {
        code: string
    }

    href: string

    items?: FwSidebarItemProps[]

    active?: boolean

    // internal
    readonly level?: number
    // internal
}

// TODO: move to @xyd/components/content
const components = {
    Frontmatter: {
        // TODO: css
        Title: ({children}) => <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: "10px",
        }}>
            {children}
        </div>,
    },
    Badge: ({children}) => <Badge>
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
    const {active, onClick} = useGroup()
    const [isActive, setActive] = active(props)

    let Title: any

    if (typeof props.title === "object" && "code" in props.title) {
        const code = props.title.code

        Title = () => mdxExport(
            // TODO: in the future better mechanism + support props + better components (provider?) - similar to codehik
            code.replace("() => ", ""),
            components
        )
    } else {
        Title = () => props.title
    }

    return <UISidebar.Item
        button={!!props.items?.length}
        href={props.href}
        active={isActive}
        onClick={() => {
            setActive()
        }}
    >
        <Title/>

        {
            props.items?.length && <UISidebar.SubTree isOpen={isActive}>
                <>
                    {
                        props.items?.map((item, index) => <FwSidebarItem
                            key={index + item.href}
                            title={item.title}
                            href={item.href}
                            items={item.items}
                            active={active(item)[0]}
                            level={(props.level || 0) + 1}
                        />)
                    }
                </>
            </UISidebar.SubTree>
        }
    </UISidebar.Item>
}
