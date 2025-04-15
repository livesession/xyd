import React from "react"
import { Link, useLinkClickHandler } from "react-router"

import * as cn from "./Sidebar.styles";
import { UICollapse } from "./Collapse";

export interface UISidebarProps {
    children: React.ReactNode;
    footerItems?: React.ReactNode;
    className?: string;
}

export function UISidebar({ children, footerItems, className }: UISidebarProps) {
    // TODO: in the future theming api?
    return <div
        data-element="xyd-sidebar"
        className={`${cn.SidebarHost} ${className || ""}`}
    >
        <ul data-part="list">
            {children}
        </ul>
        {
            footerItems && <div data-part="footer">
                <ul>
                    {footerItems}
                </ul>
            </div>
        }
    </div>
}

export interface UISidebarItemProps {
    children: React.ReactNode;
    button?: boolean;
    href?: string;
    active?: boolean;
    activeTheme?: "secondary";
    isParentActive?: boolean;
    onClick?: (v: any) => void
}



UISidebar.Item = function SidebarItem({
    children,
    button,
    href,
    active,
    activeTheme,
    isParentActive,
    onClick
}: UISidebarItemProps) {
    const [firstChild, ...restChilds] = React.Children.toArray(children)

    const ButtonOrAnchor = button ? 'button' : Link

    const handler = useLinkClickHandler(href || "", {
        viewTransition: true,
    })

    return <li
        data-element="xyd-sidebar-item"
        className={cn.ItemHost}
        data-active={active}
        data-parent-active={isParentActive}
        data-theme={activeTheme}
    >
        <ButtonOrAnchor
            data-part="link"
            href={button ? undefined : href}
            onClick={(e) => {
                handler(e)
                onClick?.(e)
            }}
        >
            <div data-part="first-item">
                {firstChild}
            </div>
        </ButtonOrAnchor>
        {restChilds}
    </li>
}

export interface UISidebarItemHeaderProps {
    children: React.ReactNode;
}

UISidebar.ItemHeader = function SidebarItemHeader({ children }: UISidebarItemHeaderProps) {
    return <li data-element="xyd-sidebar-item-header" className={cn.ItemHeaderHost}>
        {children}
    </li>
}

export interface UISidebarSubTreeProps {
    children: React.ReactNode;
    isOpen?: boolean;
}

UISidebar.SubTree = function SidebarSubItem({ children, isOpen }: UISidebarSubTreeProps) {
    return <ul data-element="xyd-sidebar-subtree" className={cn.TreeHost}>
        <UICollapse isOpen={isOpen || false}>
            {children}
        </UICollapse>
    </ul>
}

export interface SidebarFooterItemProps {
    children: React.ReactNode;
    href?: string;
    icon?: React.ReactNode;
    as?: React.ElementType;
}

UISidebar.FooterItem = function SidebarFooterItem({ children, href, icon, as }: SidebarFooterItemProps) {
    const Link = as || $Link;

    return <li
        data-element="xyd-sidebar-footer-item"
        className={cn.FooterItemHost}
    >
        <Link data-part="item" href={href}>
            {icon}
            {children}
        </Link>
    </li>
}


function $Link({ children, ...props }) {
    return <a {...props}>
        {children}
    </a>
}