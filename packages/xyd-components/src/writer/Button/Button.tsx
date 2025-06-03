import React from "react";

import * as cn from "./Button.styles";

export interface ButtonProps {
    children: React.ReactNode;
    kind?: "primary" | "secondary" | "tertiary";
    size?: "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    icon?: React.ReactElement;
    iconPosition?: "left" | "right";
}

export function Button({
    children,
    kind = "primary",
    size = "md",
    className,
    onClick,
    disabled = false,
    icon,
    iconPosition = "left"
}: ButtonProps) {
    return (
        <button
            className={`${cn.ButtonHost} ${className || ''}`}
            data-kind={kind}
            data-size={size}
            data-has-icon={!!icon}
            data-icon-position={iconPosition}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && iconPosition === "left" && (
                <span part="icon" className={cn.ButtonIcon}>
                    {icon}
                </span>
            )}
            <span part="content">
                {children}
            </span>
            {icon && iconPosition === "right" && (
                <span part="icon" className={cn.ButtonIcon}>
                    {icon}
                </span>
            )}
        </button>
    );
}
