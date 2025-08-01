import { css } from "@linaria/core";

export const ProgressBarHost = css`
    @layer defaults {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 50;
        background-color: var(--xyd-progressbar-bgcolor);
        height: 0;
        opacity: 0;
        transition: opacity .1s linear;
        transition-delay: 0s;
        will-change: opacity;

        &[data-active="true"] {
            height: .25rem;
            opacity: 1;
            transition-delay: .3s;
        }

        [part="item"] {
            height: 100%;
            transition: all .5s ease-in-out;
            transition-delay: .1s;
            background-color: var(--xyd-progressbar-bgcolor--active);
        }

        &[data-loading="true"] [part="item"] {
            width: 100%;
        }
    }
`;

