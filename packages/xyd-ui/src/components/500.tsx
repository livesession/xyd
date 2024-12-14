import React from "react";
import {tv} from "tailwind-variants";

import {UIAnchor} from "./Anchor";

function styled() {
}

styled.internalError = tv({
    slots: {
        container: "text-center",
        anchor: "text-primary-600 underline decoration-from-font [text-underline-position:from-font]"
    }
})

export interface UIInternalErrorProps {
    href: string;

    children: React.ReactNode;
}

export function UIInternalError({href, children}: UIInternalErrorProps) {
    const {container, anchor} = styled.internalError()

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