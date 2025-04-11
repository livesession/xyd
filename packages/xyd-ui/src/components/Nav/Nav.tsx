import React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

import * as cn from "./Nav.styles";

export interface NavProps {
    children: React.ReactNode
    value: string
    onChange?: (value: string) => void
    logo?: React.ReactNode;
    kind?: "middle"
}

export function Nav({children, value, onChange, logo, kind}: NavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <div className={cn.NavHost}>
            <div className={cn.NavShadow}/>
            <nav className={`
                ${cn.Nav}
                ${kind === "middle" && cn.NavMiddle}
            `}>
                <div className={`
                    ${cn.LogoHost}
                    xyd_ui-comp-nav-logo
                `}>
                    {logo}
                </div>
                <RadixTabs.List asChild>
                    <div className={cn.ListHost}>
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
            className={cn.ItemHost}
        >
            <span className={cn.ItemTitle1}>{children}</span>
            <span className={cn.ItemTitle2}>{children}</span>
        </a>
    </RadixTabs.Trigger>
};

