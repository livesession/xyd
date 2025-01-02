import React from "react";
import {css} from "@linaria/core";

const $footer = {
    host: css`
        position: relative;
        border-top: 1px solid #f0f0f0;
        padding: 32px;
        background-color: #fff;
    `,
    container: css`
        margin: 0 auto;
        max-width: 1200px;
        text-align: center;
    `,
    textContainer: css`
        line-height: 24px;
        font-size: 14px;
        font-weight: 500;
        color: rgba(60, 60, 67, .78);
    `
}

export interface FooterProps {
    children?: React.ReactNode
}

export function Footer({children}: FooterProps) {
    return <footer className={$footer.host}>
        <div className={$footer.container}>
            <div className={$footer.textContainer}>
                {children}
            </div>
        </div>
    </footer>
}
