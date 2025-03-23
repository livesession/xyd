import React from "react"
import {css} from "@linaria/core";

const $content = {
    host: css`
        display: flex;
        flex-direction: column;
        //align-items: center;
        gap: 24px;
    `
}

export interface ContentProps {
    children: React.ReactNode
}

export function Content({children}: ContentProps) {
    return <div className={$content.host}>
        {children}
    </div>
}