import {css} from "@linaria/core";

export const CodeSampleHost = css`
    flex: 1 1 0;
    overflow: hidden;
    min-width: 0;
    max-width: 512px;

    border: 1px solid var(--XydAtlas-Component-Code-Sample__color-border);
    border-radius: 16px;
`;

export const CodeSampleLanguagesHost = css`
    display: flex;
    flex: 1 1 0%;
    padding: 8px 0px;

    background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%) !important;

    border-top-right-radius: 10px;
    border-top-left-radius: 10px;
    border-bottom: 0px;

    min-width: 0;
`;

export const CodeSampleLanguagesList = css`
    display: flex;
    flex-grow: 1;
    justify-content: end;
    gap: 8px;
    padding: 0 10px;
`;

export const CodeSampleLanguagesButton = css`
    all: unset;

    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 6px;
    padding: 6px;

    color: var(--XydAtlas-Component-Code-Sample__color);

    &[data-state="active"] {
        color: var(--XydAtlas-Component-Code-Sample__color--active);
        border-bottom: 1px solid var(--XydAtlas-Component-Code-Sample__color--active);
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
    }

    &:hover {
        transition: ease-in 0.1s;
        background: var(--XydAtlas-Component-Code-Sample__color-background);
    }
`;

export const CodeSampleLanguagesDescription = css`
    display: flex;
    align-items: center;
    gap: 4px;

    color: var(--XydAtlas-Component-Code-Sample__color);

    margin-left: 4px;
    margin-right: 4px;
`;

export const CodeSampleLanguagesDescriptionItem = css`
    display: flex;
    padding-left: 16px;
    padding-right: 16px;
    flex: 1 1 0%;
    gap: 16px;
    border-radius: 4px;
`;

export const CodeSampleLanguagesCopy = css`
    display: flex;
    padding-left: 8px;
    padding-right: 8px;
    align-items: center;
`;

export const CodeSampleCodeHost = css`
    max-height: 400px;
    background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%) !important;

    margin: 0;
    padding: 8px 16px;

    border-top: 1px solid var(--XydAtlas-Component-Code-Sample__color-border);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;

    white-space: pre-wrap;
    word-break: break-all;

    overflow-y: scroll;
`;

export const CodeSampleMarkHost = css`
    display: flex;
    border-left-width: 4px;
    border-color: transparent;
    margin: 4px 0;
`;

export const CodeSampleMarkLine = css`
    flex: 1 1 0%;
`;

export const CodeSampleMarkAnnotated = css`
    border-color: var(--XydAtlas-Component-Code-Sample__color-markBorder--active);
    background-color: var(--XydAtlas-Component-Code-Sample__color-markBackground--active);
`;

export const CodeSampleLineNumberHost = css`
    margin: 0 4px;
    //text-align: right;
    user-select: none;
    opacity: 0.5;
`;