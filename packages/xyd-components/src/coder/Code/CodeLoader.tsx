import React from "react";

import {$code} from "./Code.styles.tsx";
import {Loader} from "../../ui";

export function CodeLoader() {
    return <div className={$code.host}>
        <Loader/>
    </div>
}