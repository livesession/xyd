import { css } from "@linaria/core";

export const ApiRefItemTitleHost = css`
    font-weight: var(--xyd-font-weight-normal);
`;

export const ApiRefItemTitleLink = css`
`;

export const ApiRefItemNavbarHost = css`
    margin: 20px 0px;
`;

export const ApiRefItemNavbarContainer = css`
    background: linear-gradient(45deg, var(--XydAtlas-Component-ApiRef-Item__background-navbar) 0%, var(--XydAtlas-Component-ApiRef-Item__background-navbar) 100%);
    padding: 8px;
    border: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border);
    border-radius: 8px;
    display: flex;
    gap: 4px;
    overflow: scroll;
`;

export const ApiRefItemNavbarLabel = css`
    color: var(--XydAtlas-Component-ApiRef-Item__color-navbar);
    margin-right: 4px;
`;

export const ApiRefItemNavbarSubtitle = css`
    display: flex;
    letter-spacing: 1px;
    white-space: nowrap;
    text-overflow: ellipsis;
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

            @media (max-width: 768px) {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }
    }
`;

export const ApiRefItemGrid = css`
    align-items: normal;

    @media (max-width: 1280px) {
        xyd-grid-decorator {
            --cols: 1;
        }
    }
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

export const DefinitionBody = css`
    display: flex;
    flex-direction: column;
    gap: 15px;
`