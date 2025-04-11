import React from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import * as cn from "./SubNav.styles";

export interface SubNavProps {
    children: React.ReactNode
    title: string
    value: string
    onChange?: (value: string) => void
}

export function SubNav({children, title, value, onChange}: SubNavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <nav className={cn.SubNavHost}>
            <div className={cn.SubNavPrefix}>
                {title}
            </div>
            <RadixTabs.List asChild>
                <ul className={cn.SubNavUl}>
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
}

SubNav.Item = function SubNavItem({children, value, href}: SubNavItemProps) {
    return <RadixTabs.Trigger asChild value={value}>
        <li className={cn.SubNavLi}>
            <a href={href} className={cn.SubNavLink}>
                {children}
            </a>
        </li>
    </RadixTabs.Trigger>
}