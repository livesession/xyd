import React from "react"

import * as cn from "./Blockquote.styles";

export interface BlockquoteProps {
    className?: string;
    children: React.ReactNode;
}

export function Blockquote({ className, children }: BlockquoteProps) {
    return <blockquote
        className={`${cn.BlockquoteHost} ${className || ''}`}
    >
        <$SVGQuote />

        <div>
            {children}
        </div>
    </blockquote>
}

function $SVGQuote(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={15}
            height={11}
            viewBox="0 0 15 11"
            xmlns="http://www.w3.org/2000/svg"
            part="quote"
            {...props}
        >
            <path
                d="M15 1.72c-1.96.95-2.94 2.07-2.94 3.36.83.1 1.53.44 2.07 1.02.55.58.82 1.25.82 2.01a2.81 2.81 0 0 1-2.8 2.89c-.9 0-1.68-.36-2.33-1.09a3.78 3.78 0 0 1-1-2.63c0-3.1 1.76-5.53 5.26-7.28L15 1.72zm-8.83 0c-1.97.95-2.96 2.07-2.96 3.36.85.1 1.55.44 2.1 1.02.54.58.82 1.25.82 2.01A2.82 2.82 0 0 1 3.3 11 3 3 0 0 1 .98 9.91 3.8 3.8 0 0 1 0 7.28C0 4.18 1.74 1.75 5.23 0l.94 1.72z"
                fillRule="nonzero"
            />
        </svg>
    )
}