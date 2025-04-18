import {css} from "@linaria/core";

export const TabsSampleHost = css`
    position: relative;
    max-width: 100%;
`;

export const TabsSampleButtons = css`
    display: flex;
    align-items: center;
`;

export const TabsSampleContent = css`
    margin-top: 16px;
`;

export const TabsArrowHost = css`
    padding: 8px;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

export const TabsArrowIcon = css`
    width: 16px;
    height: 16px;
`;

export const TabsScrollerHost = css`
    overflow-x: auto;
    flex-grow: 1;
`;

export const TabsScrollerContainer = css`
    display: inline-flex;
    gap: 4px;

    border-radius: 8px;
    background-color: #F3F4F6;
    
    padding: 4px;
    margin-left: 4px;
`;

export const TabsButtonHost = css`
    padding: 0.5rem 1rem;

    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    white-space: nowrap;

    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;

    color: #6B7280;

    &:hover {
        color: #111827;
    }

    &[data-state="active"] {
        color: #111827;
        background-color: #ffffff;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
`;

export const TabsButtonActive = css`
    color: #111827;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;