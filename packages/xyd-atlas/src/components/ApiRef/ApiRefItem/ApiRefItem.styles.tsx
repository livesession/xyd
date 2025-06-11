import { css } from "@linaria/core";

export const ApiRefItemTitleHost = css`
    font-weight: var(--xyd-font-weight-normal);
`;

export const ApiRefItemTitleLink = css`
`;

export const ApiRefItemNavbarHost = css`
    margin-top: 8px;
`;

export const ApiRefItemNavbarContainer = css`
    background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%);
    padding: 8px;
    border: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border);
    border-radius: 8px;
`;

export const ApiRefItemNavbarLabel = css`
    color: var(--XydAtlas-Component-ApiRef-Item__color-navbar);
    margin-right: 4px;
`;

export const ApiRefItemHost = css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 25px;

    &[data-has-examples="true"] {
        atlas-apiref-item-showcase {
            display: grid;
            gap: 100px;
            grid-template-columns: repeat(2, minmax(0, 1fr));

            @media (max-width: 767px) {
                grid-template-columns: 1fr;
            }
        }
    }
`;

export const ApiRefItemGrid = css`
    align-items: normal;
`;

export const ApiRefItemDefinitionsHost = css`
`;

export const ApiRefItemDefinitionsItem = css`
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin-bottom: 25px;

    margin-top: var(--space-xxlarge);

    [part="controls"] {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    > [part="header"] {
        h2, h3, h4, h5, h6 {
            margin: 0;
        }

        border-bottom: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border);

        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 16px;

        > :first-child {
            justify-self: start;
        }

        > :not(:first-child) {
            justify-self: end;
        }
    }
`;

export const ApiRefItemSubtitleHost = css`
    font-weight: var(--xyd-font-weight-semibold);
`;

export const ApiRefItemSubtitleLink = css`
    text-decoration: none;
`;
