import {css} from "@linaria/core";

export const $sidebar = {
    host: css`
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1rem;
        border-radius: 0.5rem;
        // TODO: get height of top
        //height: calc(100vh - 54px);
        height: 100%;
        background: #f9f9f9;
    `
}

export const $item = {
    host: css``,
    link: css``
}

export const $separator = {
    host: css``
}