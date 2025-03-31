import {css} from "@linaria/core";

export const CodeTabsHost = css`
    overflow: hidden;
    min-width: 0;
    //flex: 1 1 0;
    //max-width: 512px;

    border: 1px solid rgb(236, 236, 241);
    border-radius: 16px;
`;

export const CodeTabsPreSingle = css`
    border: none !important; // TODO: bad, find another way - CodeSample another kind?
`;

export const CodeTabsLanguagesHost = css`
    display: flex;
    flex: 1 1 0%;
    //padding: 8px 0px;

    background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%) !important;
    
    border-top-right-radius: 10px;
    border-top-left-radius: 10px;
    border-bottom: 0px;

    min-width: 0;
`;

export const CodeTabsLanguagesHostSingle = css`
    height: 0;
`;

export const CodeTabsLanguagesList = css`
    display: flex;
    flex-grow: 1;
    justify-content: end;
    gap: 8px;
    padding: 0 10px;
`;

export const CodeTabsLanguagesButton = css`
    all: unset;

    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 6px;
    padding: 6px;

    font-size: 14px;
    color: rgb(53, 55, 64);
    
    &[data-state="active"] {
        color: rgb(112, 81, 212);
        border-bottom: 1px solid rgb(112, 81, 212);
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
    }
    
    &:hover {
        transition: ease-in 0.1s;
        background: #e3e3eb;
    }
`;

export const CodeTabsLanguagesDescription = css`
    display: flex;
    align-items: center;
    gap: 4px;

    font-size: 14px;
    color: rgb(53, 55, 64);
    
    margin-left: 4px;
    margin-right: 4px;
`;

export const CodeTabsLanguagesDescriptionItem = css`
    display: flex;
    padding-left: 16px;
    padding-right: 16px;
    flex: 1 1 0%;
    gap: 16px;
    border-radius: 4px;
`;

export const CodeTabsLanguagesCopy = css`
    display: flex;
    padding-left: 8px;
    padding-right: 8px;
    align-items: center;
`;

export const CodeTabsLanguagesCopySingle = css`
    top: 17px;
    position: relative;
    right: 5px;
`;

