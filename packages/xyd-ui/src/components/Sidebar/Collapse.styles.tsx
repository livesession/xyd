import { css } from "@linaria/core";

export const CollapseContainer = css`
    transform: translateZ(0);
    overflow: hidden;
    transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1),
                height 300ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: width, height;

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

export const CollapseBase = css`
    opacity: 0;
    transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity;

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

export const CollapseOpen = css`
    opacity: 1;
`;
