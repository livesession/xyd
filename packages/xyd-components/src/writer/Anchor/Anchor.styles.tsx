import {css} from "@linaria/core";

export const AnchorHost = css`
    @layer defaults {
        color: var(--xyd-anchor-color);

        &:hover {
            color: var(--xyd-anchor-color--hover);
        }
    }
`; 