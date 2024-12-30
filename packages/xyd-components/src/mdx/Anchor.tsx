import React, {forwardRef} from 'react'
import type {ComponentProps, ReactElement} from 'react'

import {css} from "@linaria/core";

const $anchor = {
    host: css`
        color: #7051d4;
    `,
};

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
                to={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={$anchor.host}
            >
                {children}
            </a>
        )
    }

    if (!href) {
        return (
            <a
                ref={forwardedRef}
                to={href}
                href={href}
                className={$anchor.host}
            >
                {children}
            </a>
        )
    }

    return (
        <a
            ref={forwardedRef}
            to={href}
            href={href}
            className={$anchor.host}
        >
            {children}
        </a>
    )
})

Anchor.displayName = 'Anchor'
