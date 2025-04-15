import React, { } from "react"

import * as cn from "./Heading.styles";

export interface HeadingProps {
    children: React.ReactNode
    size: 1 | 2 | 3 | 4 | 5 | 6
    as?: "div" | "span"
    id?: string
    kind?: "muted"
    onClick?: () => void
    className?: string
}

export function Heading({ 
    children,
    size = 1,
    as,
    id,
    onClick,
    className,
    kind
}: HeadingProps) {
    let HeadingComponent = as ? as : `h${size}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

    return <xyd-heading>
        <HeadingComponent
            part="heading"
            className={` ${cn.HeadingHost}  ${className || ''}`}
            data-size={size}
            data-kind={kind}
            onClick={onClick}
        >
            {children}

            {id && <$Anchor />}
        </HeadingComponent>
    </xyd-heading>
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