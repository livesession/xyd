import React from "react";
import { Link, To } from "react-router";

import { Anchor } from "@xyd-js/components/writer";

import { isExternal } from "../utils";

// TODO: in the future different place?
export function FwLink({ children, ...rest }) {
    let to: To = ""
    let external = false

    if (rest.href) {
        try {
            new URL(rest.href)
            to = rest.href
            // Check if it's an external link
            external = isExternal(rest.href)
        } catch (error) {
            if (rest.href.startsWith("/")) {
                const url = new URL(`https://example.com${rest.href}`)
                to = {
                    pathname: url.pathname,
                    search: url.search,
                    hash: url.hash,
                }
            } else {
                return <Anchor as="button">
                    {children}
                </Anchor>

                return <Anchor as="button" onClick={() => { // TODO: !!! in the future we should use react-router but it rerenders tha page !!!
                    const url = new URL(window.location.href)
                    const currentParams = url.searchParams

                    // Update parameters from the new params
                    new URLSearchParams(rest.href).forEach((value, key) => {
                        currentParams.set(key, value)
                    })

                    url.search = currentParams.toString()
                    history.replaceState(null, '', url)
                }}>
                    {children}
                </Anchor>
            }
        }
    }

    return <Anchor
        as={$Link}
        {...rest}
        // @ts-ignore TODO: fix type for `to`
        to={to}
        target={external ? "_blank" : rest.target}
    >
        {children}
    </Anchor>
}


function $Link(props: any) {
    return <Link
        {...props}
    >
        {props.children}
    </Link>
}
