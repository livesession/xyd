import React, {forwardRef} from 'react'
import type {ComponentProps, ReactElement} from 'react'

import * as cn from "./Anchor.styles";

export type UIAnchorProps = Omit<ComponentProps<'a'>, 'ref'> & {
    newWindow?: boolean
}

function Link(props: any) {
    return <div>Link</div>
}

export const UIAnchor = forwardRef<HTMLAnchorElement, UIAnchorProps>(function (
    {href = '', children, newWindow},
    // ref is used in <NavbarMenu />
    forwardedRef
): ReactElement {
    if (newWindow) {
        return (
            <Link
                ref={forwardedRef}
                to={href}
                target="_blank"
                rel="noreferrer"
                className={cn.AnchorHost}
            >
                {children}
                <span> (opens in a new tab)</span>
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

UIAnchor.displayName = 'UIAnchor'
