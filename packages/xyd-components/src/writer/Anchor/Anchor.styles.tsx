import {css} from "@linaria/core";

export const AnchorHost = css`
    @layer defaults {
        &:has(code) {
            --xyd-anchor-color: var(--color-text);
            --xyd-anchor-color--hover: var(--color-text);

            code {
                text-decoration: underline;
            }

            &:hover {
                code {
                    text-decoration-thickness: 2px;
                }
            }
        }

        color: var(--xyd-anchor-color);
        text-decoration: var(--xyd-anchor-text-decoration, none);
        text-underline-offset: var(--xyd-anchor-text-underline-offset, 0.15em);

        &:hover {
            color: var(--xyd-anchor-color--hover);
        }
    }
`; 