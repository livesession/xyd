import {css} from "@linaria/core";

export const ApiRefSamplesContainerHost = css`
    height: fit-content;
    display: flex;
    gap: 32px;
    flex-direction: column;
    position: relative;
    top: var(--sidebar-top, 12px);

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