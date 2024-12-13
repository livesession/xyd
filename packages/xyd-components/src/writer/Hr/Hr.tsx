import React from "react"

import {$hr} from "./Hr.styles";

export interface HrProps {
    children: React.ReactNode;
}

export function Hr({children}: HrProps) {
    return <hr className={$hr.host}>
        {children}
    </hr>
}