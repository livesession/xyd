import React from "react";
import {UIInternalError} from "./500";

export interface UIRootProps {
    children: JSX.Element | JSX.Element[]

    direction: "rtl" | "ltr"
}

// TODO: move to headless?
export function UIRoot(props: UIRootProps) {
    const direction = props.direction || "ltr"

    // TODO: html tag?
    return <>
        <div>
            {props.children}
        </div>
    </>
}
