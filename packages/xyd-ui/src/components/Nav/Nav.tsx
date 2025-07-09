import React from "react";
import { Tabs as RadixTabs } from "radix-ui"; // TODO: remove and use separation

import * as cn from "./Nav.styles";

export interface NavProps {
    children: React.ReactNode
    value: string
    onChange?: (value: string) => void
    logo?: React.ReactNode;
    className?: string;
    leftSurface?: React.ReactNode;
    centerSurface?: React.ReactNode;
    rightSurface?: React.ReactNode;
}

export function Nav({ children, value, onChange, logo, className, leftSurface, centerSurface, rightSurface }: NavProps) {
    const defaultList = <RadixTabs.List asChild>
        <div part="nav-list">
            {children}
        </div>
    </RadixTabs.List>

    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <xyd-nav className={`${cn.NavHost} ${className || ""}`} >
            <div part="shadow" />

            <nav part="nav">
                <div part="nav-left">
                    {
                        leftSurface ? leftSurface : <>
                            <div part="logo">
                                {logo}
                            </div>
                            {defaultList}
                        </>
                    }
                </div>

                {centerSurface && <div part="nav-center">{centerSurface}</div>}

                {rightSurface && <div part="nav-right">{rightSurface}</div>}
            </nav>
        </xyd-nav>
    </RadixTabs.Root>
}

interface TabProps {
    children: React.ReactNode
    value: string
    onChange?: (value: string) => void
}

Nav.Tab = function Tab({ children, value, onChange }: TabProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <RadixTabs.List >
            {children}
        </RadixTabs.List>
    </RadixTabs.Root>
}

export interface NavItemProps {
    children: React.ReactNode;
    href?: string;
    value?: string;
    as?: React.ElementType;
}

Nav.Item = function NavItem({ children, value, href, as }: NavItemProps) {
    const Link = as || $Link;

    const links = <>
        <span part="nav-item1">{children}</span>
        <span part="nav-item2">{children}</span>
    </>

    return <RadixTabs.Trigger asChild value={value}>
        <xyd-nav-item className={cn.ItemHost}>
            {
                typeof href === "string" ? <Link href={href}>
                    {links}
                </Link>
                    : links
            }
        </xyd-nav-item>
    </RadixTabs.Trigger>
};

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}