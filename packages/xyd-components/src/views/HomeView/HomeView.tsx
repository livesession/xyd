import React from "react"
import * as cn from "./HomeView.styles";

export interface HomeViewProps {
    header: React.ReactNode
    body: React.ReactNode
    footer: React.ReactNode
}

export function HomeView({header, body, footer}: HomeViewProps) {
    return <div className={cn.HomeViewHost}>
        {header}
        {body}
        {footer}
    </div>
}

export interface HomeViewBodyProps {
    children: React.ReactNode
    kind?: "secondary"
}

HomeView.Body = function HomeViewBody({children, kind}: HomeViewBodyProps) {
    return <div className={`
        ${cn.HomeViewBodyHost}
        ${kind === "secondary" ? cn.HomeViewBodyHostSecondary : ""}
    `}>
        <div className={cn.HomeViewBodyContent}>
            {children}
        </div>
    </div>
}


