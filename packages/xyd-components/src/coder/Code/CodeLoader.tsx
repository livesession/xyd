import React from "react";

import * as cn from "./Code.styles";
import {Loader} from "../../kit";

export function CodeLoader() {
    return <div className={cn.CodeHost}>
        <Loader/>
    </div>
}