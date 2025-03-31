import React, {forwardRef} from 'react'
import type {ComponentProps, ReactElement} from 'react'
import * as cn from "./Anchor.styles";

export type AnchorProps = Omit<ComponentProps<'a'>, 'ref'> & {
    newWindow?: boolean
}

// TODO: where react-router?

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(function (
    {href = '', children, newWindow},
    // ref is used in <NavbarMenu />
    forwardedRef
): ReactElement {
    if (newWindow) {
        return (
            <a
                ref={forwardedRef}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={cn.AnchorHost}
            >
                {children}
            </a>
        )
    }

    if (!href) {
        return (
            <a
                ref={forwardedRef}
                href={href}
                className={cn.AnchorHost}
            >
                {children}
            </a>
        )
    }

    return (
        <a
            ref={forwardedRef}
            href={href}
            className={cn.AnchorHost}
        >
            {children}
        </a>
    )
})

Anchor.displayName = 'Anchor'
