import React, {forwardRef} from 'react'
import {Link} from "react-router";
import type {ComponentProps, ReactElement} from 'react'
import {tv} from "tailwind-variants";

function styled() {
}

styled.anchor = tv({
    slots: {
        text: "sr-only select-none"
    }
})

export type HAnchorProps = Omit<ComponentProps<'a'>, 'ref'> & {
    newWindow?: boolean
}

export const HAnchor = forwardRef<HTMLAnchorElement, HAnchorProps>(function (
    {href = '', children, newWindow, ...props},
    // ref is used in <NavbarMenu />
    forwardedRef
): ReactElement {
    const {text} = styled.anchor()

    if (newWindow) {
        return (
            <Link
                ref={forwardedRef}
                to={href}
                target="_blank"
                rel="noreferrer"
                {...props}
            >
                {children}
                <span className={text()}> (opens in a new tab)</span>
            </Link>
        )
    }

    if (!href) {
        return (
            <Link ref={forwardedRef} to={href} {...props}>
                {children}
            </Link>
        )
    }

    return (
        <Link ref={forwardedRef} to={href} {...props}>
            {children}
        </Link>
    )
})

HAnchor.displayName = 'HAnchor'
