import { css } from "@linaria/core";

export const CollapseHost = css`
    @layer defaults {
        display: block;
        transform: translateZ(0);
        overflow: hidden;
        transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1),
                    height 300ms cubic-bezier(0.4, 0, 0.2, 1);
        will-change: width, height;

        @media (prefers-reduced-motion: reduce) {
            transition: none;
        }

        [part="child"] {
            opacity: 0;
            transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
            will-change: opacity;

            @media (prefers-reduced-motion: reduce) {
                transition: none;
            }
        }

        &[data-open="true"] [part="child"] {
            opacity: 1;
        }
    }
`;
