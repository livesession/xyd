import {css} from "@linaria/core";

export const ApiRefSamplesContainerHost = css`
    /* TODO: in the future do not use xyd */
    
    --local-sidebar-subheader-top: calc(var(--xyd-header-total-height) + var(--theme-nav-height-space, 0px));

    height: fit-content;
    display: flex;
    gap: 32px;
    flex-direction: column;
    position: relative;
    top: var(
        --sidebar-subheader-top, 
        var(--local-sidebar-subheader-top, 12px)
    );

    @media (min-width: 1280px) {
        position: sticky;
    }

    &:first-child {
        margin-top: 0;
    }

    &:last-child {
        margin-bottom: 0;
    }
`;

export const ApiRefSamplesGroupHost = css`
    gap: 10px;
    display: flex;
    flex-direction: column;
`;
// The "run request" play icon in the code toolbar — sits right after CodeCopy
// (inside CodeTabs' [part="copy"] flex row). Mirrors CodeCopy's own styles
// (CodeCopyHost) EXACTLY so the play reads with the same fill/color/weight as the
// copy icon (both are lucide stroke icons inheriting currentColor — no dimming).
export const ApiRefSamplesPlay = css`
    @layer defaults {
        all: unset;

        backdrop-filter: blur(8px);
        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 6px;
        padding: 6px;

        /* Identical to CodeCopyHost: inherit the muted rest colour, brighten to
         * the toolbar ACTIVE colour on hover (no rest-colour override). */
        transition: color ease-in 0.1s, background ease-in 0.1s;

        &:hover {
            color: var(--codetabs-color--active);
            background: var(--xyd-code-copy-color);
        }
    }
`;
