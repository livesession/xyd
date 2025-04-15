import React from "react"

import * as cn from "./Steps.styles";

export interface StepsProps {
    children: React.ReactNode;
    className?: string;
}

export function Steps({ children, className }: StepsProps) {
    return <xyd-steps>
        <ol className={`${cn.StepsHost} ${className || ""}`}>
            {children}
        </ol>
    </xyd-steps>
}

export interface StepsItemProps {
    children: React.ReactNode;
    className?: string;
}

Steps.Item = function StepsItem({ children, className }: StepsItemProps) {
    return <xyd-steps-item>
        <li className={`${cn.StepsLi} ${className || ""}`}>
            {children}
        </li>
    </xyd-steps-item>
}