import React from "react"

import {$steps} from "./Steps.styles";

export interface StepsProps {
    children: React.ReactNode;
}

export function Steps({children}: StepsProps) {
    return <ol className={$steps.host}>
        {children}
    </ol>

}

export interface StepsItemProps {
    children: React.ReactNode;
}

Steps.Item = function StepsItem({children}: StepsItemProps) {
    return <li className={$steps.li}>
        {children}
    </li>
}