import React from "react"
import * as cn from "./Content.styles";

export interface ContentProps {
    children: React.ReactNode
}

export function Content({children}: ContentProps) {
    return <div className={cn.ContentHost}>
        {children}
    </div>
}

