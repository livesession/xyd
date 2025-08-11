import {css} from "@linaria/core";

export const BlockquoteHost = css`
    @layer defaults {
        border-color: var(--xyd-blockquote-border-color);
        color: var(--xyd-blockquote-color);
        font-style: italic;
        margin: 0;
        display: grid;
        grid: auto / 24px auto;

        [part="quote"] {
            fill: var(--color-primary);
        }
        
        p::after {
            content: "”";
        }
    }
`;