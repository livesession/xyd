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