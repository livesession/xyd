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
    return <xyd-sidebar
        className={`${cn.SidebarHost} ${className || ""}`}
    >
        <ul part="list">
            {children}
        </ul>
        {
            footerItems && <div part="footer">
                <ul>
                    {footerItems}
                </ul>
            </div>
        }
    </xyd-sidebar>
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
    })

    return <xyd-sidebar-item>
        <li
            className={cn.ItemHost}
            data-theme={activeTheme}
        >
            <ButtonOrAnchor
                part="link"
                href={button ? undefined : href}
                onClick={(e) => {
                    handler(e)
                    onClick?.(e)
                }}
            >
                <div
                    data-parent-active={isParentActive}
                    data-active={active}
                    part="first-item"
                >
                    {firstChild}
                </div>
            </ButtonOrAnchor>
            {restChilds}
        </li>
    </xyd-sidebar-item>
}

export interface UISidebarItemHeaderProps {
    children: React.ReactNode;
}

UISidebar.ItemHeader = function SidebarItemHeader({ children }: UISidebarItemHeaderProps) {
    return <xyd-sidebar-item-header>
        <li className={cn.ItemHeaderHost}>
            {children}
        </li>
    </xyd-sidebar-item-header>
}

export interface UISidebarSubTreeProps {
    children: React.ReactNode;
    isOpen?: boolean;
}

UISidebar.SubTree = function SidebarSubItem({ children, isOpen }: UISidebarSubTreeProps) {
    return <xyd-sidebar-subtree>
        <ul className={cn.TreeHost}>
            <UICollapse isOpen={isOpen || false}>
                {children}
            </UICollapse>
        </ul>
    </xyd-sidebar-subtree>
}

export interface SidebarFooterItemProps {
    children: React.ReactNode;
    href?: string;
    icon?: React.ReactNode;
    as?: React.ElementType;
}

UISidebar.FooterItem = function SidebarFooterItem({ children, href, icon, as }: SidebarFooterItemProps) {
    const Link = as || $Link;

    return <xyd-sidebar-footer-item>
        <li className={cn.FooterItemHost}>
            <Link part="item" href={href}>
                {icon}
                {children}
            </Link>
        </li>
    </xyd-sidebar-footer-item>
}

function $Link({ children, ...props }) {
    return <a {...props}>
        {children}
    </a>
}