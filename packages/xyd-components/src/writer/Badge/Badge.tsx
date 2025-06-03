import React from "react"

import * as cn from "./Badge.styles";

export interface BadgeProps {
    /**
     * The class name of the badge.
     */
    className?: string;

    /**
     * The children of the badge.
     */
    children?: React.ReactNode;

    /**
     * The size of the badge.
     */
    size?: "sm"

    /**
     * The kind of the badge.
     */
    kind?: "warning" | "info" | "default"
}

/**
 * Badge component is used to display a badge.
 * 
 * @group Components
 */
export function Badge({
    className,
    children,
    size = "sm",
    kind = "default"
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
