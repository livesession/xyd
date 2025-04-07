import React from "react"

import * as cn from "./Sidebar.styles";
import {UICollapse} from "./Collapse";

export interface UISidebarProps {
    children: React.ReactNode;
    footerItems?: React.ReactNode;
}

export function UISidebar({children, footerItems}: UISidebarProps) {
    // TODO: in the future theming api?
    return <div className={`
        ${cn.SidebarHost}
        xyd_ui-comp-sidebar
    `}>
        <ul className={cn.SidebarUl}>
            {children}
        </ul>
        {footerItems && <SidebarFooter>
            {footerItems}
        </SidebarFooter>}
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

// TODO: move to ui
function Link({children, ...props}) {
    return <a {...props}>
        {children}
    </a>
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

    return <li
        className={cn.ItemHost}
    >
        <ButtonOrAnchor
            href={button ? undefined : href}
            onClick={button ? onClick : undefined}
            className={cn.ItemLink}
        >
            <div className={`
                ${cn.ItemLinkItem}
                ${active && cn.ItemLinkActive}
                ${isParentActive && cn.ItemLinkParentActive}
                ${active && activeTheme === "secondary" && cn.ItemLinkActiveSecondary}
            `}>
                {firstChild}
            </div>
        </ButtonOrAnchor>
        {restChilds}
    </li>
}

export interface UISidebarItemHeaderProps {
    children: React.ReactNode;
}

UISidebar.ItemHeader = function SidebarItemHeader({children}: UISidebarItemHeaderProps) {
    return <li className={cn.ItemHeaderHost}>
        {children}
    </li>
}

export interface UISidebarSubTreeProps {
    children: React.ReactNode;
    isOpen?: boolean;
}

UISidebar.SubTree = function SidebarSubItem({children, isOpen}: UISidebarSubTreeProps) {
    return <ul className={cn.TreeHost}>
        <UICollapse isOpen={isOpen || false}>
            {children}
        </UICollapse>
    </ul>
}

function SidebarFooter({children}: { children: React.ReactNode }) {
    return <div className={cn.FooterHost}>
        <ul>
            {children}
        </ul>
    </div>
}

export interface SidebarFooterItemProps {
    children: React.ReactNode;
    href?: string;
    icon?: React.ReactNode;
}

UISidebar.FooterItem = function SidebarFooter({children, href, icon}: SidebarFooterItemProps) {
    return <li className={cn.FooterItemHost}>
        <a className={cn.FooterItem} href={href}>
            {icon}
            {children}
        </a>
    </li>
}

