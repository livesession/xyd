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
    floatRightSurface?: React.ReactNode;
    appearance?: {
        separator?: "right"
    }
}

export function Nav(props: NavProps) {
    const {
        children,
        value,
        onChange,
        logo,
        className,
        leftSurface,
        centerSurface,
        rightSurface,
        floatRightSurface,
        appearance,
    } = props

    const defaultList = <RadixTabs.List asChild>
        <div part="nav-list">
            {children}
        </div>
    </RadixTabs.List>

    return <RadixTabs.Root asChild value={value} onValueChange={onChange}>
        <xyd-nav
            className={`${cn.NavHost} ${className || ""}`}
            data-appearance-separator={appearance?.separator || undefined}
        >
            <div part="shadow" />

            <nav part="nav">
                <div part="nav-left">
                    {
                        leftSurface ? leftSurface : <>
                            {logo && <div part="logo">
                                <$NavItem>
                                    {logo}
                                </$NavItem>
                            </div>}
                            {defaultList}
                        </>
                    }
                </div>

                {centerSurface && <div part="nav-center">{centerSurface}</div>}

                {rightSurface && <div part="nav-right">{rightSurface}</div>}
                {floatRightSurface && <div part="nav-float-right">{floatRightSurface}</div>}
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

Nav.Item = function NavItem(props: NavItemProps) {
    return <RadixTabs.Trigger asChild value={props.value}>
        <$NavItem {...props} />
    </RadixTabs.Trigger>
};

function $NavItem({ children, href, as }: Omit<NavItemProps, "value">) {
    const Link = as || $Link;

    // const links = <>
    //     <span part="nav-item1">{children}</span>
    //     <span part="nav-item2">{children}</span>
    // </>
    const links = children;

    return <xyd-nav-item className={cn.ItemHost}>
        {
            typeof href === "string" ? <Link href={href}>
                {links}
            </Link>
                : links
        }
    </xyd-nav-item>
}

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}
