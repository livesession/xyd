import React from "react";
import {tv} from "tailwind-variants";

import {UIAnchor} from "./Anchor";

function styled() {
}

styled.notFound = tv({
    slots: {
        container: "text-center",
        anchor: "text-primary-600 underline decoration-from-font [text-underline-position:from-font]"
    }
})

export interface UINotFoundProps {
    href: string;

    children: React.ReactNode;
}

export function UINotFound({href, children}: UINotFoundProps) {
    const {container, anchor} = styled.notFound()

    return <p className={container()}>
        <UIAnchor
            href={href}
            newWindow
            className={anchor()}
        >
            {children}
        </UIAnchor>
    </p>
}