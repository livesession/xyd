import React from "react"

import * as cn from "./Steps.styles";

export interface StepsProps {
    children: React.ReactNode;
    className?: string;
}

export function Steps({ children, className }: StepsProps) {
    return <ol
        data-element="xyd-steps"
        className={`${cn.StepsHost} ${className || ""}`}
    >
        {children}
    </ol>
}

export interface StepsItemProps {
    children: React.ReactNode;
    className?: string;
}

Steps.Item = function StepsItem({ children, className }: StepsItemProps) {
    return <li
        data-element="xyd-steps-item"
        className={`${cn.StepsLi} ${className || ""}`}
    >
        {children}
    </li>
}