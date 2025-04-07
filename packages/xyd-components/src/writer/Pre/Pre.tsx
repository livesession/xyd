import React from "react"

import * as cn from "./Pre.styles"

export interface PreProps {
    children: React.ReactNode
}

export function Pre({children}: PreProps) {
    return <pre className={cn.PreHost}>
        {children}
    </pre>
}