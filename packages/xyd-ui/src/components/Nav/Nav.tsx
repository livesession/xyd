import React from "react";
import {Tabs as RadixTabs} from "radix-ui"; // TODO: remove and use separation

import * as cn from "./Nav.styles";

export interface NavProps {
    children: React.ReactNode
    value: string
    onChange?: (value: string) => void
    logo?: React.ReactNode;
    kind?: "middle"
    className?: string;
    rightSurface?: React.ReactNode;
}

export function Nav({ children, value, onChange, logo, kind, className, rightSurface }: NavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <xyd-nav
            className={`${cn.NavHost} ${className || ""}`}
            data-kind={kind}
        >
            <div part="shadow" />
            <nav part="nav">
                <div part="logo">
                    {logo}
                </div>
                <RadixTabs.List asChild>
                    <div part="list">
                        {children}
                    </div>
                </RadixTabs.List>
                {(kind === "middle" || rightSurface) && <div part="right">{rightSurface}</div>}
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
    href: string;
    value: string;
    as?: React.ElementType;
}

Nav.Item = function NavItem({ children, value, href, as }: NavItemProps) {
    const Link = as || $Link;

    return <RadixTabs.Trigger asChild value={value}>
        <xyd-nav-item className={cn.ItemHost}>
            <Link href={href}>
                <span part="title1">{children}</span>
                <span part="title2">{children}</span>
            </Link>
        </xyd-nav-item>
    </RadixTabs.Trigger>
};

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}