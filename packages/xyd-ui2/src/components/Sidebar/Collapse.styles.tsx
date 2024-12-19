import { css } from "@linaria/core";

export const $collapse = {
    container: css`
        transform: translateZ(0);
        overflow: hidden;
        transition: all 300ms ease-in-out;

        //@media (prefers-reduced-motion: reduce) {
        //    transition: none;
        //}
    `,
    base: css`
        opacity: 0;
        transition: opacity 500ms ease-in-out;

        //@media (prefers-reduced-motion: reduce) {
        //    transition: none;
        //}
    `,
    open: css`
        opacity: 1;
    `,
};
