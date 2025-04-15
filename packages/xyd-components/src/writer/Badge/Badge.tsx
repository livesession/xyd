import React from "react"
import * as cn from "./Badge.styles";

export interface BadgeProps {
    className?: string;
    children?: React.ReactNode;

    size?: "sm"
    kind?: "warning" | "info"
}

export function Badge({
                          className,
                          children,
                          size = "sm",
                          kind = "warning"
                      }: BadgeProps) {
    return <xyd-badge
        className={`${cn.BadgeHost} ${className || ''}`}
        data-size={size}
        data-kind={kind}
    >
        <span part="child">
            {children}
        </span>
    </xyd-badge>
}
