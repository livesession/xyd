import React from "react";
import * as cn from "./Loader.styles";

export interface LoaderProps {
    size?: "small" | "medium" | "large";
    className?: string;
}

export function Loader({size = "medium", className}: LoaderProps) {
    return (
        <div
            data-element="xyd-loader"
            data-size={size}
            className={` ${cn.LoaderHost} ${className || ""} `}
        >
            <div data-part="dots">
                <div data-part="dot"/>
                <div data-part="dot"/>
                <div data-part="dot"/>
            </div>
        </div>
    );
} 