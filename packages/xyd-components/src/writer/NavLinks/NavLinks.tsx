import React from "react"
import {ArrowLeftIcon, ArrowRightIcon} from '@radix-ui/react-icons'

import {$navLinks} from "./NavLinks.styles";

function Anchor({children, ...rest}) {
    return <a {...rest}>
        {children}
    </a>
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
}

export function NavLinks(props: NavLinksProps) {
    return (
        <div className={$navLinks.host}>
            {props.prev ? (
                <Anchor
                    href={props.prev.href}
                    title={props.prev.title}
                    className={$navLinks.link}
                >
                    <ArrowLeftIcon className={$navLinks.icon}/>
                    {props.prev.title}
                </Anchor>
            ) : <div/>}
            {props.next && (
                <Anchor
                    href={props.next.href}
                    title={props.next.title}
                    className={$navLinks.link}
                >
                    {props.next.title}
                    <ArrowRightIcon className={$navLinks.icon}/>
                </Anchor>
            )}
        </div>
    )
}
