import {css} from "@linaria/core";

export const $navLinks = {
    host: css`
        display: flex;
        padding-top: 2rem;
        margin-top: 2rem;
        margin-bottom: 2rem;
        justify-content: space-between;
        align-items: center;
        border-top-width: 1px;
        border-color: #ececf1;
    `,
    link: css`
        display: flex;
        padding-top: 1rem;
        padding-bottom: 1rem;
        gap: 0.25rem;
        align-items: center;
        font-size: 1rem;
        line-height: 1.5rem;
        font-weight: 500;
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
        max-width: 50%;
    `,
    icon: css`
        display: inline;
        height: 1.25rem;
        flex-shrink: 0;
    `,
};
