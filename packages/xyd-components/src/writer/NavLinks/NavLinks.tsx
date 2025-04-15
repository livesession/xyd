import React from "react"
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons'

import * as cn from "./NavLinks.styles";

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
        <div
            data-element="xyd-navlinks"
            className={`${cn.NavLinksHost} ${props.className || ""}`}
        >
            {props.prev ? (
                <Link
                    href={props.prev.href}
                    title={props.prev.title}
                    data-part="link"
                >
                    <ArrowLeftIcon data-part="icon" />
                    {props.prev.title}
                </Link>
            ) : <div />}
            {props.next && (
                <Link
                    href={props.next.href}
                    title={props.next.title}
                    data-part="link"
                >
                    {props.next.title}
                    <ArrowRightIcon data-part="icon" />
                </Link>
            )}
        </div>
    )
}


function $Anchor({ children, ...rest }) {
    return <a {...rest}>
        {children}
    </a>
}
