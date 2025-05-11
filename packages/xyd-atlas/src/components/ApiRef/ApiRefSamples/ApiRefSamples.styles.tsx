import {css} from "@linaria/core";

export const ApiRefSamplesContainerHost = css`
    height: 100vh;
    position: sticky;
    top: 12px;
    display: flex;
    gap: 32px;
    flex-direction: column;

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