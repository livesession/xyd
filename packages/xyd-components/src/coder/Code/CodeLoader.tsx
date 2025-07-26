import React from "react";

import * as cn from "./Code.styles";
import {Loader} from "../../kit";

export function CodeLoader() {
    return <xyd-code-loader className={cn.CodeHost}>
        <Loader/>
    </xyd-code-loader>
}