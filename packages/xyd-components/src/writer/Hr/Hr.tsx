import React from "react"

import * as cn from "./Hr.styles";

export interface HrProps {
    children?: React.ReactNode;
}

export function Hr({ children }: HrProps) {
    return <hr part="hr" className={cn.HrHost}>
        {children}
    </hr>
}