import React from "react"
import {css} from "@linaria/core";

const $homeView = {
    host: css`
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    `,
}

export interface HomeViewProps {
    header: React.ReactNode
    body: React.ReactNode
    footer: React.ReactNode
}

export function HomeView({header, body, footer}: HomeViewProps) {
    return <div className={$homeView.host}>
        {header}
        {body}
        {footer}
    </div>
}

const $body = {
    host: css`
        background: radial-gradient(circle, hsl(0 0% 9% / .3) 1px, transparent 1px);
        backdrop-filter: sepia(10%);
        background-size: 30px 30px;
        padding: 60px;
        flex: 1;
    `,
    host$$secondary: css`
        background: repeating-linear-gradient(to right, hsl(0 0% 9% / .1), hsl(0 0% 9% / .1) 1px, transparent 1px, transparent 50px), repeating-linear-gradient(to bottom, hsl(0 0% 9% / .1), hsl(0 0% 9% / .1) 1px, transparent 1px, transparent 50px);
    `,
    body: css`
        width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 80px;
    `
}

export interface HomeViewBodyProps {
    children: React.ReactNode
    kind?: "secondary"
}

HomeView.Body = function HomeViewBody({children, kind}: HomeViewBodyProps) {
    return <div className={`
        ${$body.host}
        ${kind === "secondary" ? $body.host$$secondary : ""}
    `}>
        <div className={`
            ${$body.body}
        `}>
            {children}
        </div>
    </div>
}


