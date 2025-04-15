import React from "react"

import * as cn from "./Pre.styles"

export interface PreProps {
    children: React.ReactNode
    className?: string
}

export function Pre({ children, className }: PreProps) {
    return <pre
        data-element="xyd-pre"
        className={`${cn.PreHost} ${className || ""}`}
    >
        {children}
    </pre>
}