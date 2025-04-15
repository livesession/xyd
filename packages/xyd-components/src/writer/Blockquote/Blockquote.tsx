import React from "react"

import * as cn from "./Blockquote.styles";

export interface BlockquoteProps {
    className?: string;
    children: React.ReactNode;
}

export function Blockquote({ className, children }: BlockquoteProps) {
    return <xyd-blockquote>
        <blockquote
            className={`${cn.BlockquoteHost} ${className || ''}`}
        >
            {children}
        </blockquote>
    </xyd-blockquote>
}