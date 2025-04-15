import React from "react";
import * as cn from "./Loader.styles";

export interface LoaderProps {
    size?: "small" | "medium" | "large";
    className?: string;
}

export function Loader({size = "medium", className}: LoaderProps) {
    return (
        <xyd-loader
            data-size={size}
            className={` ${cn.LoaderHost} ${className || ""} `}
        >
            <div part="dots">
                <div part="dot"/>
                <div part="dot"/>
                <div part="dot"/>
            </div>
        </xyd-loader>
    );
} 