import React from "react";
import * as cn from "./Button.styles";

export interface ButtonProps {
    children: React.ReactNode
    kind?: "secondary"
}

export function Button({children, kind}: ButtonProps) {
    return <button className={`
        ${cn.ButtonHost}
        ${kind === "secondary" && cn.ButtonHostSecondary}
    `}>
        {children}
    </button>
}