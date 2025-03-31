import React, {useRef} from "react"

import * as cn from "./Heading.styles";

export interface HeadingProps {
    children: React.ReactNode
    size: 1 | 2 | 3 | 4 | 5 | 6
    as?: "div" | "span"
    id?: string
    onClick?: () => void
}

export function Heading({children, size = 1, as, id, onClick}: HeadingProps) {
    let HeadingComponent = as ? as : `h${size}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

    const obRef = useRef<HTMLAnchorElement>(null)

    return <HeadingComponent
        className={`
            ${cn.HeadingHost}
            ${size === 1 && cn.HeadingH1}
            ${size === 2 && cn.HeadingH2}
            ${size === 3 && cn.HeadingH3}
            ${size === 4 && cn.HeadingH4}
            ${size === 5 && cn.HeadingH5}
            ${size === 6 && cn.HeadingH6}
            xyd_comp-comp-heading
        `}
        onClick={onClick}
    >
        {children}

        {id && <Anchor/>}
    </HeadingComponent>
}

function Anchor() {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width={15}
        height={15}
        fill="currentColor"
        viewBox="0 0 24 24"
        className={cn.HeadingLink}
        role="presentation"
    >
        <path
            fillRule="evenodd"
            d="M18.293 5.707a4.657 4.657 0 0 0-6.586 0l-1 1a1 1 0 1 1-1.414-1.414l1-1a6.657 6.657 0 1 1 9.414 9.414l-1 1a1 1 0 0 1-1.414-1.414l1-1a4.657 4.657 0 0 0 0-6.586Zm-2.586 2.586a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414l6-6a1 1 0 0 1 1.414 0Zm-9 1a1 1 0 0 1 0 1.414l-1 1a4.657 4.657 0 0 0 6.586 6.586l1-1a1 1 0 0 1 1.414 1.414l-1 1a6.657 6.657 0 1 1-9.414-9.414l1-1a1 1 0 0 1 1.414 0Z"
            clipRule="evenodd"
        />
    </svg>
}