import {css} from "@linaria/core";

export const CodeHost = css`
    @layer defaults {
        display: inline-block;
        padding: 0 .3em;
        border-radius: 6px;
        margin: 0 3px;
        border: .5px solid var(--xyd-code-border-color);
        background: var(--xyd-code-bgcolor);
        
        & [part="content"] {
            position: relative;
        }
    }
`;