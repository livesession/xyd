import React from "react"
import {ArrowLeftIcon, ArrowRightIcon} from '@radix-ui/react-icons'

import * as cn from "./NavLinks.styles";

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
        <div className={cn.NavLinksHost}>
            {props.prev ? (
                <Anchor
                    href={props.prev.href}
                    title={props.prev.title}
                    className={cn.NavLinksLink}
                >
                    <ArrowLeftIcon className={cn.NavLinksIcon}/>
                    {props.prev.title}
                </Anchor>
            ) : <div/>}
            {props.next && (
                <Anchor
                    href={props.next.href}
                    title={props.next.title}
                    className={cn.NavLinksLink}
                >
                    {props.next.title}
                    <ArrowRightIcon className={cn.NavLinksIcon}/>
                </Anchor>
            )}
        </div>
    )
}
