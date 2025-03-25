import {css} from "@linaria/core";

export const $badge = {
    host: css`
        display: inline-flex;
        align-items: center;
        line-height: 1rem;
        font-style: normal;
        font-weight: 500;
        letter-spacing: normal;
        white-space: nowrap;
        text-transform: none;
    `,
    host$$warning: css`
        color: #434e4e;
        background-color: #ffffe1
    `,
    host$$info: css`
        color: #fff;
        background-color: #1971a8;
    `,
    host$$sm: css`
        font-size: 12px;
        height: 18px;
        padding: 0 6px;
        gap: 3px;
        border-radius: 6px;
    `,

    item: css`
        position: relative;
    `
}