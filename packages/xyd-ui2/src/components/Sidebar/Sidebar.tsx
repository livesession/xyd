import React from "react"

import {$sidebar, $item, $separator} from "./Sidebar.styles";

export interface UISidebarProps {
    children: React.ReactNode;
}

export function UISidebar({children}: UISidebarProps) {
    return <div className={$sidebar.host}>
        <ul>
            {children}
        </ul>
    </div>
}

export interface UISidebarItemProps {
    children: React.ReactNode;
}

UISidebar.Item = function SidebarItem({children}: UISidebarItemProps) {
    return <li className={$item.host}>
        <a
            href="#"
            className={$item.link}
        >
            {children}
        </a>
    </li>
}

export interface UISidebarSeparatorProps {
    children: React.ReactNode;
}

UISidebar.Separator = function SidebarSeparator({children}: UISidebarSeparatorProps) {
    return <li>
        {children}
    </li>
}