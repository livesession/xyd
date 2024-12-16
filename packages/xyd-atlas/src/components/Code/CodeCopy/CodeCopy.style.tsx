import {css} from "@linaria/core";

export const $copy = {
    host: css`
        all: unset;
        
        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;
        
        border-radius: 6px;
        padding: 6px;

        &:hover {
            transition: ease-in 0.1s;
            background: var(--atlas-comp-code-copy-background--active);
        }
    `
}