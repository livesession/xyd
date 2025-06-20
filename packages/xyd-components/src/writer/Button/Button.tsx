import React from "react";

import * as cn from "./Button.styles";

export interface ButtonProps {
    children?: React.ReactNode;
    kind?: "primary" | "secondary" | "tertiary" | undefined
    theme?: "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    icon?: React.ReactElement;
    iconPosition?: "left" | "right";
    href?: string;
}

export function Button({
    children,
    kind = "primary",
    theme,
    size = "md",
    className,
    onClick,
    disabled = false,
    icon,
    iconPosition = "left",
    href
}: ButtonProps) {
    let Component = href ? "a" : "button"

    let hrefProps = {}

    if (href) {
        hrefProps = {
            href,
            target: "_blank",
        }
    }

    if (theme === "ghost") {
        kind = undefined
    }

    return (
        <Component
            className={`${cn.ButtonHost} ${className || ''}`}
            data-button={true}
            data-kind={kind}
            data-size={size}
            data-theme={theme}
            data-has-icon={!!icon}
            data-icon-position={iconPosition}
            onClick={onClick}
            disabled={disabled}
            {...hrefProps}
        >
            {icon && iconPosition === "left" && (
                <span part="icon" className={cn.ButtonIcon}>
                    {icon}
                </span>
            )}
            {
                children ? <span part="content">
                    {children}
                </span> : null
            }
            {icon && iconPosition === "right" && (
                <span part="icon" className={cn.ButtonIcon}>
                    {icon}
                </span>
            )}
        </Component>
    );
}
