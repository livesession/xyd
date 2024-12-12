import React from "react"
import * as RadixTabs from "@radix-ui/react-tabs";

import {$tabs} from "./Tabs.styles"

export interface TabsProps {
    children: React.ReactNode
    value: string
    onChange: (value: string) => void
}

export function Tabs({children, value, onChange}: TabsProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <nav className={$tabs.host}>
            <RadixTabs.List asChild>
                <ul className={$tabs.ul}>
                    {children}
                </ul>
            </RadixTabs.List>
        </nav>
    </RadixTabs.Root>
}

export interface TabsItemProps {
    children: React.ReactNode
    value: string
    href?: string
}

Tabs.Item = function TabsItem({children, value, href}: TabsItemProps) {
    return <RadixTabs.Trigger asChild value={value}>
        <li className={$tabs.item}>
            <a href={href} className={`${$tabs.itemLink}`}>
                {children}
            </a>
        </li>
    </RadixTabs.Trigger>
}