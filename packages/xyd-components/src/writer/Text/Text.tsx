import React from "react"
import * as cn from "./Text.styles";

export type TextFontSizes = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
export type TextKindTypes = "default" | "ghost" | "success" | "warn" | "error" | "primary" | "secondary";
export type TextFontWeights = "normal" | "bold" | "extra-bold";

export interface TextProps {
    size?: TextFontSizes
    kind?: TextKindTypes
    weight?: TextFontWeights
    children?: React.ReactNode
    className?: string
    id?: string
    onClick?: () => void
}

export function Text({
    size = "medium",
    kind = "default",
    weight = "normal",
    children,
    className,
    id,
    onClick
}: TextProps) {
    return (
        <xyd-text
            className={`${cn.TextHost} ${className || ''}`}
            data-size={size}
            data-kind={kind}
            data-weight={weight}
            onClick={onClick}
            id={id}
        >
            {children}
        </xyd-text>
    )
}

