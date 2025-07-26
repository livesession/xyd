import React from "react";

import {Icon} from "../Icon/Icon"

import * as cn from "./Button.styles";

export interface ButtonProps {
    children?: React.ReactNode;
    kind?: "primary" | "secondary" | "tertiary" | undefined
    theme?: "ghost";
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    icon?: React.ReactElement | string;
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

    if (href && !disabled) {
        hrefProps = {
            href,
            target: outsideLink(href) ? "_blank" : undefined,
        }
    }

    if (theme === "ghost") {
        kind = undefined as any
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
            aria-disabled={disabled ? "true" : undefined}
            {...hrefProps}
        >
            {icon && iconPosition === "left" && (
                <span part="icon">
                    {typeof icon === "string" ? <Icon name={icon} /> : icon}
                </span>
            )}
            {
                children ? <span part="content">
                    {children}
                </span> : null
            }
            {icon && iconPosition === "right" && (
                <span part="icon">
                    {typeof icon === "string" ? <Icon name={icon} /> : icon}
                </span>
            )}
        </Component>
    );
}

function outsideLink(href: string) {
    return href.startsWith("http") || href.startsWith("//")
}