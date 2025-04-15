import React from "react"

import * as cn from "./Code.styles";

export interface CodeProps {
    className?: string;
    children: React.ReactNode;
}

export function Code({className, children}: CodeProps) {
    return <code 
        data-element="xyd-code"
        className={`${cn.CodeHost} ${className || ''}`}
    >
        <span data-part="content">
            {children}
        </span>
    </code>
}