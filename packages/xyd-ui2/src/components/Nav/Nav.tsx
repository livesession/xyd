import React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

import {$nav, $list, $item, $logo} from "./Nav.styles";

export interface NavProps {
    children: React.ReactNode
    value: string
    onChange: (value: string) => void
    logo?: React.ReactNode;
    kind?: "middle"
}

export function Nav({children, value, onChange, logo, kind}: NavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <div className={`${$nav.host}`}>
            <div className={$nav.shadow}/>
            <nav className={`
                ${$nav.nav}
                ${kind === "middle" && $nav.nav$$middle}
            `}>
                <div className={$logo.host}>
                    {logo}
                </div>
                <RadixTabs.List asChild>
                    <div className={$list.host}>
                        {children}
                    </div>
                </RadixTabs.List>
                {kind === "middle" && <div/>}
            </nav>
        </div>
    </RadixTabs.Root>
}

export interface NavItemProps {
    children: React.ReactNode;
    href: string;
    value: string;
}

Nav.Item = function NavItem({children, value, href}) {
    return <RadixTabs.Trigger asChild value={value}>
        <a
            href={href}
            className={`${$item.host}`}
        >
            <span className={$item.title1}>{children}</span>
            <span className={$item.title2}>{children}</span>
        </a>
    </RadixTabs.Trigger>
};

