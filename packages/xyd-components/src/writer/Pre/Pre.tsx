import React from "react"

import {$pre} from "./Pre.styles"

export interface PreProps {
    children: React.ReactNode
}

export function Pre({children}: PreProps) {
    return <pre className={$pre.host}>
        {children}
    </pre>
}