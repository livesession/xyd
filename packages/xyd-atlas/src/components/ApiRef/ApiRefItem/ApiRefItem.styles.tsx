import {css} from "@linaria/core";

export const ApiRefItemTitleHost = css`
    font-size: 30px;
    font-weight: 400;
`;

export const ApiRefItemTitleLink = css`
`;

export const ApiRefItemNavbarHost = css`
`;

export const ApiRefItemNavbarContainer = css`
    background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%);
    padding: 8px;
    border: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border);
    border-radius: 8px;
    font-size: 13px;
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
`;

export const ApiRefItemGrid = css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: normal;
    gap: 100px;
`;

export const ApiRefItemPropertiesHost = css`
`;

export const ApiRefItemPropertiesItem = css`
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin-bottom: 25px;
`;

export const ApiRefItemSubtitleHost = css`
    font-size: 15px;
    font-weight: 600;
`;

export const ApiRefItemSubtitleLink = css`
    text-decoration: none;
`;

