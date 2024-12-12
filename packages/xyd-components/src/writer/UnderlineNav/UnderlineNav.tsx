import React from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import {$nav} from "./UnderlineNav.styles"

export interface TabsProps {
    children: React.ReactNode
    value: string
    onChange: (value: string) => void
}

export function UnderlineNav({children, value, onChange}: TabsProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <nav className={$nav.host}>
            <RadixTabs.List asChild>
                <ul className={$nav.ul}>
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
        <li className={$nav.item}>
            <a href={href} className={`${$nav.itemLink}`}>
                {children}
            </a>
        </li>
    </RadixTabs.Trigger>
}