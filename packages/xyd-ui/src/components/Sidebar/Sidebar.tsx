import React, { useEffect, useRef } from "react"
import { Link } from "react-router"

import * as cn from "./Sidebar.styles";
import { UICollapse } from "./Collapse";

export interface UISidebarProps {
    children: React.ReactNode;
    footerItems?: React.ReactNode;
    className?: string;
}
[]
export function UISidebar({ children, footerItems, className }: UISidebarProps) {
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        // TODO: in the future better solution to match with hydration
        if (listRef.current) {
            const activeElement = listRef.current.querySelector('[data-active="true"]');
            if (activeElement) {
                const containerHeight = listRef.current.clientHeight;
                const elementTop = activeElement.getBoundingClientRect().top;
                const elementHeight = activeElement.clientHeight;
                const scrollTop = listRef.current.scrollTop;
                
                // Calculate the position to center the element
                const targetScroll = scrollTop + elementTop - (containerHeight / 2) + (elementHeight / 2);
                
                listRef.current.scrollTo({
                    top: targetScroll,
                    behavior: 'auto'
                });
            }
        }
    }, []);

    // TODO: in the future theming api?
    return <xyd-sidebar
        className={`${cn.SidebarHost} ${className || ""}`}
    >
        <ul part="list" ref={listRef}>
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
    anchor?: boolean;
    icon?: React.ReactNode;
    onClick?: (v: any) => void
}


UISidebar.Item = function SidebarItem({
    children,
    button,
    href,
    active,
    activeTheme,
    isParentActive,
    anchor,
    icon,
    onClick,
}: UISidebarItemProps) {
    const [firstChild, ...restChilds] = React.Children.toArray(children)

    const ButtonOrAnchor = button ? 'button' : Link

    let h = href?.endsWith("/") ? href.slice(0, -1) : href
    return <li
        part="item"
        className={cn.ItemHost}
        data-theme={activeTheme}
        data-anchor={anchor ? String(anchor) : undefined}
    >
        <ButtonOrAnchor
            part={`item-${button ? "button" : "link"}`}
            href={button ? undefined : h}
            to={h}
            onClick={onClick}
        >
            <div
                part="first-item"
                data-parent-active={isParentActive}
                data-active={active}
                data-anchor={anchor ? String(anchor) : undefined}
            >
                <>
                    {icon}

                    {firstChild}
                </>
            </div>
        </ButtonOrAnchor>
        {restChilds}
    </li>
}

export interface UISidebarItemHeaderProps {
    children: React.ReactNode;
}

UISidebar.ItemHeader = function SidebarItemHeader({ children }: UISidebarItemHeaderProps) {
    return <li part="item-header" className={cn.ItemHeaderHost}>
        {children}
    </li>
}

export interface UISidebarSubTreeProps {
    children: React.ReactNode;
    isOpen?: boolean;
}

UISidebar.SubTree = function SidebarSubItem({ children, isOpen }: UISidebarSubTreeProps) {
    return <ul part="subtree" className={cn.TreeHost}>
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

    return <li part="footer-item" className={cn.FooterItemHost}>
        <Link part="footer-link" href={href}>
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