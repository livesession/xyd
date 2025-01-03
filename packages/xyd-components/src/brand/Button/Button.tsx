import React from "react";
import {css} from "@linaria/core";

const $button = {
    host: css`
        display: inline-block;
        border: 1px solid transparent;
        text-align: center;
        font-weight: 600;
        white-space: nowrap;
        border-radius: 20px;
        padding: 0 20px;
        line-height: 38px;
        font-size: 14px;
        border-color: transparent;
        color: #3c3c43;
        background-color: #f7f7f8;

        transition: color .25s, border-color .25s, background-color .25s;

        &:hover {
            background: #e3e3e6;
        }
    `,

    host$$secondary: css`
        color: #fff;
        background-color: rgb(112, 81, 212);

        &:hover {
            background-color: rgb(95, 59, 211)
        }
    `
}

export interface ButtonProps {
    children: React.ReactNode
    kind?: "secondary"
}

export function Button({children, kind}: ButtonProps) {
    return <button className={`
        ${$button.host}
        ${kind === "secondary" && $button.host$$secondary}
    `}>
        {children}
    </button>
}