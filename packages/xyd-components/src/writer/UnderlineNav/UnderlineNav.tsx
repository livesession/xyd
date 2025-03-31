import React from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import * as cn from "./UnderlineNav.styles"

export interface TabsProps {
    children: React.ReactNode
    value: string
    onChange: (value: string) => void
}

export function UnderlineNav({children, value, onChange}: TabsProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <nav className={cn.UnderlineNavHost}>
            <RadixTabs.List asChild>
                <ul className={cn.UnderlineNavUl}>
                    {children}
                </ul>
            </RadixTabs.List>
        </nav>
    </RadixTabs.Root>
}

export interface UnderlineNavItemProps {
    children: React.ReactNode
    value: string
    href?: string
}

UnderlineNav.Item = function UnderlineNavItem({children, value, href}: UnderlineNavItemProps) {
    return <RadixTabs.Trigger asChild value={value}>
        <li className={cn.UnderlineNavItem}>
            <a href={href} className={`${cn.UnderlineNavItemLink}`}>
                {children}
            </a>
        </li>
    </RadixTabs.Trigger>
}