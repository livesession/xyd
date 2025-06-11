import React from "react"
import {Tabs as RadixTabs} from "radix-ui"; // TODO: remove and use separation

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
        <xyd-subnav className={`${cn.SubNavHost} ${className || ""}`}>
            <div part="prefix">
                {title}
            </div>
            <RadixTabs.List asChild>
                <ul part="list">
                    {children}
                </ul>
            </RadixTabs.List>
        </xyd-subnav>
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
        <xyd-subnav-item>
            <li className={cn.SubNavLi}>
                <Link part="link" href={href}>
                    {children}
                </Link>
            </li>
        </xyd-subnav-item>
    </RadixTabs.Trigger>
}

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}