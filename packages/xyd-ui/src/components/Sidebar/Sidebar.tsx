import React, { useEffect, useRef } from "react"
import { Link } from "react-router"

import { UICollapse } from "./Collapse";

import * as cn from "./Sidebar.styles";

export interface UISidebarProps {
    children: React.ReactNode;
    footerItems?: React.ReactNode;
    className?: string;
    scrollShadow?: boolean;
}

export function UISidebar({ children, footerItems, className, scrollShadow }: UISidebarProps) {
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
        {scrollShadow && <div part="scroll-shadow" />}

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

    let target = ""
    if (href?.startsWith("http://") || href?.startsWith("https://")) {
        target = "_blank"
    }

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
            target={target}
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
    icon?: React.ReactNode;
}

UISidebar.ItemHeader = function SidebarItemHeader({ children, icon }: UISidebarItemHeaderProps) {
    return <li part="item-header" className={cn.ItemHeaderHost}>
        {icon}
        {children}
    </li>
}


export interface UISidebarItemBody {
    title: React.ReactNode;
    right?: React.ReactNode;
}

UISidebar.ItemBody = function SidebarItemBody({ title, right }: UISidebarItemBody) {
    return <div part="item-title-container">

        <div part="item-title">
            {title}
        </div>

        {right}
    </div>
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

