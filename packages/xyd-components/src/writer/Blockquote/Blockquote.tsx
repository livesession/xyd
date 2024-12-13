import React from "react"

import {$blockquote} from "./Blockquote.styles";

export interface BlockquoteProps {
    children: React.ReactNode;
}

export function Blockquote({children}: BlockquoteProps) {
    return <blockquote className={$blockquote.host}>
        {children}
    </blockquote>
}