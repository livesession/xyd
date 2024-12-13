import {css} from "@linaria/core";

export const $sample = {
    host: css`
        overflow: hidden;
        min-width: 0;
        //flex: 1 1 0;
        //max-width: 512px;

        border: 1px solid rgb(236, 236, 241);
        border-radius: 16px;
    `,
}

export const $languages = {
    host: css`
        display: flex;
        flex: 1 1 0%;
        //padding: 8px 0px;

        background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%) !important;
        
        border-top-right-radius: 10px;
        border-top-left-radius: 10px;
        border-bottom: 0px;

        min-width: 0;
    `,
    list: css`
        display: flex;
        flex-grow: 1;
        justify-content: end;
        gap: 8px;
        padding: 0 10px;
    `,
    button: css`
        all: unset;

        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 6px;
        padding: 6px;

        font-size: 14px;
        color: rgb(53, 55, 64);
        
        &[data-state="active"] {
            color: rgb(112, 81, 212);
            border-bottom: 1px solid rgb(112, 81, 212);
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
        }
        
        &:hover {
            transition: ease-in 0.1s;
            background: #e3e3eb;
        }
    `,
    description: css`
        display: flex;
        align-items: center;
        gap: 4px;

        font-size: 14px;
        color: rgb(53, 55, 64);
        
        margin-left: 4px;
        margin-right: 4px;
    `,
    description$item: css`
        display: flex;
        padding-left: 16px;
        padding-right: 16px;
        flex: 1 1 0%;
        gap: 16px;
        border-radius: 4px;
    `,
    copy: css`
        display: flex;
        padding-left: 8px;
        padding-right: 8px;
        align-items: center;
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

        font-size: 14px;
        line-height: 20px;
        white-space: pre-wrap;
        word-break: break-all;

        overflow-y: scroll;
    `
}

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