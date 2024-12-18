import React from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import {$subNav} from "./SubNav.styles";

export interface SubNavProps {
    children: React.ReactNode
    title: string
    value: string
    onChange: (value: string) => void
}

export function SubNav({children, title, value, onChange}: SubNavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <nav className={$subNav.host}>
            <div className={$subNav.prefix}>
                {title}
            </div>
            <RadixTabs.List asChild>
                <ul className={$subNav.ul}>
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
        <li className={$subNav.li}>
            <a href={href} className={`${$subNav.link}`}>
                {children}
            </a>
        </li>
    </RadixTabs.Trigger>
}