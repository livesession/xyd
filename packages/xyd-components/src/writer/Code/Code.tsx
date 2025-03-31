import React from "react"

import * as cn from "./Code.styles";

export interface CodeProps {
    children: React.ReactNode;
}

export function Code({children}: CodeProps) {
    return <code className={cn.CodeHost}>
        {children}
    </code>
}