import React from "react";

import * as cn from "./Code.styles.tsx";
import {Loader} from "../../ui";

export function CodeLoader() {
    return <div className={cn.CodeHost}>
        <Loader/>
    </div>
}