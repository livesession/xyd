import React from "react"

import * as cn from "./Code.styles";

export interface CodeProps {
    className?: string;
    children: React.ReactNode;
}

export function Code({ className, children }: CodeProps) {
    return <code className={`${cn.CodeHost} ${className || ''}`}>
        <span part="content">
            {children}
        </span>
    </code>
}