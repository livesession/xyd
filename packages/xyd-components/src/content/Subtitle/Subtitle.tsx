import React from "react"
import {css} from "@linaria/core";

const $subitlte = {
    host: css`
        margin-top: -18px;
        font-size: 18px;
        color: #7051d4;
        font-weight: 300;
    `
}

export interface SubtitleProps {
    children: React.ReactNode
}

export function Subtitle({children}: SubtitleProps) {
    return <div className={$subitlte.host}>
        {children}
    </div>
}