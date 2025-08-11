import React, { } from "react"

import * as cn from "./Heading.styles";
import { Badge } from "../../../writer";

/**
 * Props for the Heading component
 * @interface HeadingProps
 */
export interface HeadingProps {
    /** Content to be rendered inside the heading */
    children: React.ReactNode

    /** The size of the heading (1-6, corresponding to h1-h6) */
    size: 1 | 2 | 3 | 4 | 5 | 6

    /** Optional HTML element to render as (div or span) */
    as?: "div" | "span"

    /** Optional ID for the heading element */
    id?: string

    /** Optional visual style variant */
    kind?: "muted"

    /** Optional click handler */
    onClick?: () => void

    /** Optional additional CSS class name */
    className?: string

    /** Optional active state */
    active?: boolean

    /** Optional label for the heading */
    label?: string

    /** Optional subtitle for the heading */
    subtitle?: string

    /** Optional to hide the anchor icon */
    noanchor?: boolean

    /** Optional ref for the heading element */
    ref?: React.RefObject<HTMLHeadingElement>

    style?: React.CSSProperties
}

/**
 * A flexible heading component that can render as any heading level (h1-h6) or as a div/span
 * 
 * @category Component
 */
export function Heading(props: HeadingProps) {
    const {
        children,
        size = 1,
        as,
        id,
        onClick,
        className,
        kind,
        active,
        label,
        subtitle,
        noanchor,
        ref,
        style,
    } = props
    let HeadingComponent = as ? as : `h${size}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

    return <>
        <HeadingComponent
            style={style || undefined}
            className={` ${cn.HeadingHost}  ${className || ''}`}
            data-size={size}
            data-kind={kind}
            data-has-label={String(label ? "true" : "false")}
            data-noanchor={String(noanchor || "false")}
            data-active={String(active || "false")}
            onClick={noanchor ? undefined : onClick}
            id={id}
            ref={ref}
        >
            {children}

            {label && <Badge size="sm">{label}</Badge>}

            {id && !noanchor && <$Anchor />}
        </HeadingComponent>

        {
            subtitle ? <Heading
                {...props}
                size={4}
                kind="muted"
                subtitle={undefined} 
                label={undefined}
            >
                {subtitle}
            </Heading> : null
        }
    </>
}

function $Anchor() {
    return <svg
        part="icon"
        xmlns="http://www.w3.org/2000/svg"
        width={15}
        height={15}
        fill="currentColor"
        viewBox="0 0 24 24"
        role="presentation"
    >
        <path
            fillRule="evenodd"
            d="M18.293 5.707a4.657 4.657 0 0 0-6.586 0l-1 1a1 1 0 1 1-1.414-1.414l1-1a6.657 6.657 0 1 1 9.414 9.414l-1 1a1 1 0 0 1-1.414-1.414l1-1a4.657 4.657 0 0 0 0-6.586Zm-2.586 2.586a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414l6-6a1 1 0 0 1 1.414 0Zm-9 1a1 1 0 0 1 0 1.414l-1 1a4.657 4.657 0 0 0 6.586 6.586l1-1a1 1 0 0 1 1.414 1.414l-1 1a6.657 6.657 0 1 1-9.414-9.414l1-1a1 1 0 0 1 1.414 0Z"
            clipRule="evenodd"
        />
    </svg>
}