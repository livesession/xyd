import {css} from "@linaria/core";

export const $nav = {
    host: css`
        position: sticky;
        top: 0;
        z-index: 20;
        width: 100%;
        background: transparent;
        display: flex;
    `,
    shadow: css`
        pointer-events: none;
        position: absolute;
        z-index: -1;
        height: 100%;
        width: 100%;
        background-color: white;
    `,
    nav: css`
        display: flex;
        width: 100%;
        height: var(--xyd-navbar-height);
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding-left: calc(max(env(safe-area-inset-left), 16px));
        padding-right: calc(max(env(safe-area-inset-right), 16px));
    `,
    nav$$middle: css`
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
    `
};

export const $list = {
    host: css`
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
    `,
}

export const $item = {
    host: css`
        font-size: 14px; /* 0.875rem */
        position: relative;
        white-space: nowrap;
        color: #4b5563; /* Gray-600 */

        &:hover {
            color: #1f2937; /* Gray-800 */
        }

        &[data-state="active"] {
            font-weight: bold;
        }
    `,
    title1: css`
        position: absolute;
        inset: 0;
        text-align: center;
    `,
    title2: css`
        visibility: hidden;
        font-weight: 500;
    `,
};

export const $logo = {
    host: css`
        display: flex;
        align-items: center;
        margin-right: auto;
    `
}