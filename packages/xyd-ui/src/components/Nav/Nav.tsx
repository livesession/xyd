import React from "react";
import { Tabs as RadixTabs } from "radix-ui"; // TODO: remove and use separation

import * as cn from "./Nav.styles";

export interface NavProps {
    children: React.ReactNode
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
        logo,
        className,
        leftSurface,
        centerSurface,
        rightSurface,
        floatRightSurface,
        appearance,
    } = props

    const defaultList = <div part="nav-list">
        {children}
    </div>

    return <>
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
                                {logo}
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
    </>
}

interface TabsProps {
    children: React.ReactNode
    value: string
    onChange?: (value: string) => void
}

Nav.Tabs = function TabTabs({ children, value, onChange }: TabsProps) {
    return <RadixTabs.Root value={value} onValueChange={onChange}>
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
        <Nav.ItemRaw {...props} />
    </RadixTabs.Trigger>
};

Nav.ItemRaw = function NavItemRaw({ children, href, as, ...rest }: Omit<NavItemProps, "value">) {
    const Link = as || $Link;

    if (href) {
        return <Link href={href}>
            <xyd-nav-item className={cn.ItemHost} {...rest}>
                {children}
            </xyd-nav-item>
        </Link>

    }

    return <xyd-nav-item className={cn.ItemHost} {...rest}>
        {children}
    </xyd-nav-item>
}

function $Link({ children, ...props }) {
    return <a {...props}>{children}</a>
}
