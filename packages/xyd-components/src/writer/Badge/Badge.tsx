import React from "react"

import {$badge} from "./Badge.styles";

export interface BadgeProps {
    children: React.ReactNode;

    size?: "sm"
    kind?: "warning" | "info"
}

export function Badge({
                          children,
                          size = "sm",
                          kind = "warning"
                      }: BadgeProps) {
    return <div className={`
        ${$badge.host}
        
        ${size === "sm" && $badge.host$$sm}
        
        ${kind === "warning" && $badge.host$$warning}
        
        ${kind === "info" && $badge.host$$info}
    `}>
        <span className={$badge.item}>
            {children}
        </span>
    </div>
}