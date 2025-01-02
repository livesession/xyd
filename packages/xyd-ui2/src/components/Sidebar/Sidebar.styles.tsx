import {css} from "@linaria/core";

export const $sidebar = {
    host: css`
        background: #f9f9f9;
        height: 100%;
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
    `,
    ul: css`
        overflow-y: auto;
        overflow-x: hidden;
        height: 100%;
        padding: 1rem;

        // TODO: get height of top
        //height: calc(100vh - 54px);
    `
}

export const $footer = {
    host: css`
        padding: 1rem;
        //box-shadow: 0 -2px 10px rgba(0, 0, 0, .06);
        box-shadow: 0 -2px 10px rgba(237, 237, 237, .1);
        //border: 1px solid rgb(227, 227, 235);
        //border-top: 1px solid rgb(227, 227, 235);
        border-top: 1px solid #ededed;
    `,
    item$host: css`
        display: flex;
        width: 100%;
        padding: 2px;
        color: #6e6e80;
    `,
    item: css`
        display: flex;
        align-items: center;
        width: 100%;
        gap: 7px;
        font-size: 14px;
        padding: 4px 8px;

        &:hover {
            background: #ececf1;
            color: #111827;
            border-radius: 4px;

            svg {
                fill: #111827;
            }
        }

        svg {
            fill: #6e6e80;
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
    `
}

export const $item = {
    host: css`
        color: #6e6e80;
        font-size: 14px;
    `,
    link: css`
        display: flex;
        width: 100%;
        padding: 2px;
        font-weight: 500;
    `,
    link$$active: css`
        background: #fff;
        color: #7051d4;
        border-radius: 4px;
    `,
    link$$activeSecondary: css`
        background: unset;
        color: #111827;
        font-weight: 500;
    `,
    link$item: css`
        display: flex;
        width: 100%;
        padding: 4px 8px;

        &:hover {
            background: #ececf1;
            color: #111827;
            border-radius: 4px;
        }
    `
}

export const $tree = {
    host: css`
        margin-left: 8px;
    `,
}

export const $itemHeader = {
    host: css`
        // TODO: calc based on items?
        padding-left: 10px;
        margin-bottom: 6px;
        margin-top: 16px;
        font-size: 12px;
        line-height: 16px;
        font-weight: 600;
        letter-spacing: 1px;
        color: #111827;
    `
}

