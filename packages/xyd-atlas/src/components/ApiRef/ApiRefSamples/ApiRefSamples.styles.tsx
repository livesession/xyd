import {css} from "@linaria/core";

export const $container = {
    host: css`
        position: sticky;
        top: 6rem;

        display: flex;
        gap: 32px;
        flex-direction: column;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    `
}

export const $group = {
    host: css`
        gap: 10px;
        display: flex;
        flex-direction: column;
    `
}