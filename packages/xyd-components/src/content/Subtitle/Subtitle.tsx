import React from "react"
import * as cn from "./Subtitle.styles";

export interface SubtitleProps {
    children: React.ReactNode
}

export function Subtitle({children}: SubtitleProps) {
    return <div className={cn.Host}>
        {children}
    </div>
}