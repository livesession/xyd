import {css} from "@linaria/core";

export const CodeCopyHost = css`
    @layer defaults {
        all: unset;
    
        backdrop-filter: blur(8px);
        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;
        
        border-radius: 6px;
        padding: 6px;

        &:hover {
            transition: ease-in 0.1s;
            background: var(--xyd-code-copy-color);
        }
    }
`; 