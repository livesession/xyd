import React from "react"

import * as cn from "./Blockquote.styles";

export interface BlockquoteProps {
    className?: string;
    children: React.ReactNode;
}

export function Blockquote({className, children}: BlockquoteProps) {
    return <blockquote 
        data-element="xyd-blockquote"
        className={`${cn.BlockquoteHost} ${className || ''}`}
    >
        {children}
    </blockquote>
}