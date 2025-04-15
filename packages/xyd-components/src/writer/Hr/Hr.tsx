import React from "react"

import * as cn from "./Hr.styles";

export interface HrProps {
    children: React.ReactNode;
}

export function Hr({children}: HrProps) {
    return <xyd-hr>
        <hr part="hr" className={cn.HrHost}>
            {children}
        </hr>
    </xyd-hr>
}