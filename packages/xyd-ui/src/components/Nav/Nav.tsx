import React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

import * as cn from "./Nav.styles";

export interface NavProps {
    children: React.ReactNode
    value: string
    onChange?: (value: string) => void
    logo?: React.ReactNode;
    kind?: "middle"
    className?: string;
}

export function Nav({ children, value, onChange, logo, kind, className }: NavProps) {
    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <div
            data-element="xyd-nav"
            className={`${cn.NavHost} ${className || ""}`}
            data-kind={kind}
        >
            <div data-part="shadow" />
            <nav data-part="nav">
                <div data-part="logo">
                    {logo}
                </div>
                <RadixTabs.List asChild>
                    <div data-part="list">
                        {children}
                    </div>
                </RadixTabs.List>
                {kind === "middle" && <div />}
            </nav>
        </div>
    </RadixTabs.Root>
}

export interface NavItemProps {
    children: React.ReactNode;
    href: string;
    value: string;
    as?: React.ElementType;
}

Nav.Item = function NavItem({ children, value, href , as }: NavItemProps) {
    const Link = as || $Link;

    return <RadixTabs.Trigger asChild value={value}>
        <Link
            data-element="xyd-nav-item"
            href={href}
            className={cn.ItemHost}
        >
            <span data-part="title1">{children}</span>
            <span data-part="title2">{children}</span>
        </Link>
    </RadixTabs.Trigger>
};

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}