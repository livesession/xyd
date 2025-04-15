import React, {forwardRef} from 'react'
import type {ComponentProps, ReactElement} from 'react'

import * as cn from "./Anchor.styles";

export type AnchorProps = Omit<ComponentProps<'a'>, 'ref'> & {
    newWindow?: boolean
    as?: React.ElementType
}

// TODO: where react-router?

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(function (
    {href = '', children, newWindow, as},
    // ref is used in <NavbarMenu />
    forwardedRef
): ReactElement {
    const Link = as || $Anchor

    if (newWindow) {
        return (
            <Link
                ref={forwardedRef}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={cn.AnchorHost}
            >
                {children}
            </Link>
        )
    }

    if (!href) {
        return (
            <Link
                ref={forwardedRef}
                to={href}
                className={cn.AnchorHost}
            >
                {children}
            </Link>
        )
    }

    return (
        <Link
            ref={forwardedRef}
            to={href}
            className={cn.AnchorHost}
        >
            {children}
        </Link>
    )
})

Anchor.displayName = 'Anchor'

function $Anchor({ children, ...rest }) {
    return <a {...rest}>
        {children}
    </a>
}
