import React from "react";
import {tv} from "tailwind-variants";

import {HAnchor} from "./Anchor";

function styled() {
}

styled.internalErro = tv({
    slots: {
        container: "text-center",
        anchor: "text-primary-600 underline decoration-from-font [text-underline-position:from-font]"
    }
})

export interface HInternalErrorProps {
    href: string;

    children: React.ReactNode;
}

export function HInternalError({href, children}: HInternalErrorProps) {
    const {container, anchor} = styled.internalErro()

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