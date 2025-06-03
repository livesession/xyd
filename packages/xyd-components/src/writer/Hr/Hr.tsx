import React from "react"

import * as cn from "./Hr.styles";

export interface HrProps {
}

export function Hr() {
    return <hr part="hr" className={cn.HrHost}/>
}