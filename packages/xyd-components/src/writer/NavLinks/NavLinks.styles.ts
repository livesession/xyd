import {css} from "@linaria/core";

export const NavLinksHost = css`
    @layer defaults {
        font-weight: var(--xyd-font-weight-semibold);
        display: block;
        padding-top: 8px;
        margin-top: 2rem;
        margin-bottom: 2rem;
        border-top-width: 1px;
        border-color: var(--xyd-navlinks-border-color);

        > div {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 2rem;

            [part="link"] {
                display: flex;
                gap: 8px;
                align-items: center;
                transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                transition-duration: 300ms;
                max-width: 50%;
            }

            [part="icon"] {
                display: inline;
                height: 1.25rem;
                flex-shrink: 0;
            }
        }
    }
`;

