import React from "react"

import cn from "./List.styles";

export interface ListProps {
    children: React.ReactNode;
}

export function List({ children }: ListProps) {
    return <ul className={cn.List}>
        {children}
    </ul>
}

export function ListOl({ children }: ListProps) {
    return <ol className={cn.List}>
        {children}
    </ol>
}

export interface ListItemProps {
    children: React.ReactNode;
}

function ListItem({ children }: ListItemProps) {
    return <li className={cn.Item}>{children}</li>
}

List.Item = ListItem;
