import {css} from "@linaria/core";

export const $mark = {
    host: css`
        display: flex;
        border-left-width: 4px;
        border-color: transparent;
        margin: 4px 0;
    `,
    line: css`
        flex: 1 1 0%;
    `,
    $$annotated: css`
        border-color: #60A5FA;
        background-color: #EEF2FF;
    `
}

export const $lineNumber = {
    host: css`
        margin: 0 4px;
        //text-align: right;
        user-select: none;
        opacity: 0.5;
    `
}

export const $code = {
    host: css`
        max-height: 400px;
        background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%) !important;

        margin: 0;
        padding: 8px 16px;

        border-top: 1px solid rgb(236, 236, 241);
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;

        font-size: 12px;
        line-height: 20px;
        white-space: pre-wrap;
        word-break: break-all;

        overflow-y: scroll;
    `,
    host$$full: css`
        max-height: 100%;   
    `
}