import React from "react"

import * as cn from "./Steps.styles";

export interface StepsProps {
    children: React.ReactNode;
}

export function Steps({children}: StepsProps) {
    return <ol className={cn.StepsHost}>
        {children}
    </ol>
}

export interface StepsItemProps {
    children: React.ReactNode;
}

Steps.Item = function StepsItem({children}: StepsItemProps) {
    return <li className={cn.StepsLi}>
        {children}
    </li>
}