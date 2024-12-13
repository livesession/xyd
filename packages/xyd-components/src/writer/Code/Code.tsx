import React from "react"

import {$code} from "./Code.styles";

export interface CodeProps {
    children: React.ReactNode;
}

export function Code({children}: CodeProps) {
    return <code className={$code.host}>
        {children}
    </code>
}