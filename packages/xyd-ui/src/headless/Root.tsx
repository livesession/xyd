import React from "react";

export interface HRootProps {
    children: JSX.Element | JSX.Element[]

    direction: "rtl" | "ltr"
}

// TODO: move to headless?
export function HRoot(props: HRootProps) {
    const direction = props.direction || "ltr"

    // TODO: html tag?
    return <>
        <div>
            {props.children}
        </div>
    </>
}
