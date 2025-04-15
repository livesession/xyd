import React from "react"

import cn from "./List.styles";

export interface ListProps {
    children: React.ReactNode;
}

export function List({ children }: ListProps) {
    return <xyd-list>
        <ul className={cn.List}>
            {children}
        </ul>
    </xyd-list>
}

export function ListOl({ children }: ListProps) {
    return <xyd-list>
        <ol className={cn.List}>
            {children}
        </ol>
    </xyd-list>
}

export interface ListItemProps {
    children: React.ReactNode;
}

function ListItem({ children }: ListItemProps) {
    return <xyd-list-item>
        <li className={cn.Item}>{children}</li>
    </xyd-list-item>
}

List.Item = ListItem;
