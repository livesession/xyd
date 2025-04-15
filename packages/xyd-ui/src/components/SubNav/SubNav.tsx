import React from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import * as cn from "./SubNav.styles";

export interface SubNavProps {
    children: React.ReactNode
    title: string
    value: string
    onChange?: (value: string) => void
    className?: string
}

export function SubNav({ children, title, value, onChange, className }: SubNavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <nav
            data-element="xyd-subnav"
            className={`${cn.SubNavHost} ${className || ""}`}
        >
            <div data-part="prefix">
                {title}
            </div>
            <RadixTabs.List asChild>
                <ul data-part="list">
                    {children}
                </ul>
            </RadixTabs.List>
        </nav>
    </RadixTabs.Root>
}

export interface SubNavItemProps {
    children: React.ReactNode
    value: string
    href?: string
    as?: React.ElementType
}

SubNav.Item = function SubNavItem({ children, value, href, as }: SubNavItemProps) {
    const Link = as || $Link;

    return <RadixTabs.Trigger asChild value={value}>
        <li data-element="xyd-subnav-item" className={cn.SubNavLi}>
            <Link data-part="link" href={href}>
                {children}
            </Link>
        </li>
    </RadixTabs.Trigger>
}

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}