import React from "react"

import * as cn from "./Blockquote.styles";

export interface BlockquoteProps {
    children: React.ReactNode;
}

export function Blockquote({children}: BlockquoteProps) {
    return <blockquote className={cn.BlockquoteHost}>
        {children}
    </blockquote>
}