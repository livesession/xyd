import {css} from "@linaria/core";

export const CodeSampleButtonsHost = css`
    position: relative;
    max-width: 100%;
`;

export const CodeSampleButtonsContainer = css`
    display: flex;
    align-items: center;
    border-radius: 8px;
    background-color: var(--XydAtlas-Component-Code-SampleButtons__color-containerBackground);
`;

export const CodeSampleButtonsArrowHost = css`
    padding: 8px;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

export const CodeSampleButtonsArrowIcon = css`
    width: 16px;
    height: 16px;
`;

export const CodeSampleButtonsScrollerHost = css`
    overflow-x: auto;
    flex-grow: 1;
`;

export const CodeSampleButtonsScrollerContainer = css`
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    margin-left: 4px;
`;

export const CodeSampleButtonsButtonHost = css`
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    white-space: nowrap;
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
    color: var(--XydAtlas-Component-Code-SampleButtons__color);
    
    &:hover {
        color: var(--XydAtlas-Component-Code-SampleButtons__color--active);
    }
`;

export const CodeSampleButtonsButtonActive = css`
    color: var(--XydAtlas-Component-Code-SampleButtons__color--active);
    background-color: var(--XydAtlas-Component-Code-SampleButtons__color-background--active);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;