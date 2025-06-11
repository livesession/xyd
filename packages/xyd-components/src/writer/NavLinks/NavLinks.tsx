import React from "react"

import * as cn from "./NavLinks.styles";

function ArrowRightIcon() {
    return <div>
        TODO
    </div>
}

function ArrowLeftIcon() {
    return <div>
        TODO
    </div>
}

export interface NavLinksProps {
    prev?: {
        title: string
        href: string
    }
    next?: {
        title: string
        href: string
    }

    as?: React.ElementType

    className?: string
}

export function NavLinks(
    props: NavLinksProps
) {
    const Link = props.as || $Anchor

    return (
        <xyd-navlinks
            className={`${cn.NavLinksHost} ${props.className || ""}`}
        >
            {props.prev ? (
                <Link
                    href={props.prev.href}
                    title={props.prev.title}
                    part="link"
                >
                    <ArrowLeftIcon part="icon" />
                    {props.prev.title}
                </Link>
            ) : <div />}
            {props.next && (
                <Link
                    href={props.next.href}
                    title={props.next.title}
                    part="link"
                >
                    {props.next.title}
                    <ArrowRightIcon part="icon" />
                </Link>
            )}
        </xyd-navlinks>
    )
}


function $Anchor({ children, ...rest }) {
    return <a {...rest}>
        {children}
    </a>
}
