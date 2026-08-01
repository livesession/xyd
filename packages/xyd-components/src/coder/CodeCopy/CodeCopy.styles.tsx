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

        /* Keep the inherited (muted) icon colour at rest; brighten to the
         * toolbar's ACTIVE colour on hover so the icon itself reacts, not just
         * the background. (Don't set a rest colour — in dark-code themes
         * --codetabs-color is white, which would make the icon look always-on.) */
        transition: color ease-in 0.1s, background ease-in 0.1s;

        &:hover {
            color: var(--codetabs-color--active);
            background: var(--xyd-code-copy-color);
        }
    }
`;