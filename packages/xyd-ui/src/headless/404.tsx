import React from "react";
import {tv} from "tailwind-variants";

import {HAnchor} from "./Anchor";

function styled() {
}

styled.notFound = tv({
    slots: {
        container: "text-center",
        anchor: "text-primary-600 underline decoration-from-font [text-underline-position:from-font]"
    }
})

export interface HNotFoundProps {
    href: string;

    children: React.ReactNode;
}

export function HNotFound({href, children}: HNotFoundProps) {
    const {container, anchor} = styled.notFound()

    return <p className={container()}>
        <HAnchor
            href={href}
            newWindow
            className={anchor()}
        >
            {children}
        </HAnchor>
    </p>
}