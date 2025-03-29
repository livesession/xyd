import React from "react"
import {css} from "@linaria/core";

const cn = {
    Host: css`
        margin-top: -18px;
        font-size: 18px;
        color: #6e6e80;
        font-weight: 300;
    `
}

export interface SubtitleProps {
    children: React.ReactNode
}

export function Subtitle({children}: SubtitleProps) {
    return <div className={cn.Host}>
        {children}
    </div>
}