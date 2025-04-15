import { css } from "@linaria/core";

export const CodeTabsHost = css`
    overflow: hidden;
    min-width: 0;

    border: 1px solid var(--xyd-code-tabs-border-color);
    border-radius: 16px;

    &[data-single="true"] [data-part="pre"] {
        border: none;
    }
    
`;

export const CodeTabsLanguagesHost = css`
    display: flex;
    flex: 1 1 0%;

    background: var(--xyd-code-tabs-bgcolor);
    
    border-top-right-radius: 10px;
    border-top-left-radius: 10px;
    border-bottom: 0px;

    min-width: 0;

    &[data-single="true"] {
        height: 0;
    }

    [data-part="description"] {
        display: flex;
        align-items: center;
        gap: 4px;

        font-size: 14px;
        color: var(--xyd-code-tabs-color);
        
        margin-left: 4px;
        margin-right: 4px;
    }

    [data-part="description-item"] {
        display: flex;
        padding-left: 16px;
        padding-right: 16px;
        flex: 1 1 0%;
        gap: 16px;
        border-radius: 4px;
    }

    [data-part="copy"] {
        display: none;
    }

    [data-part="languages-list"] {
        display: flex;
        flex-grow: 1;
        justify-content: end;
        gap: 8px;
        padding: 0 10px;
    }

    [data-part="language-trigger"] {
        all: unset;

        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 6px;
        padding: 6px;

        font-size: 14px;
        color: var(--xyd-code-tabs-color);
        
        &[data-state="active"] {
            color: var(--xyd-code-tabs-color--active);
            border-bottom: 1px solid var(--xyd-code-tabs-color--active);
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
        }
        
        &:hover {
            transition: ease-in 0.1s;
            background: var(--xyd-code-tabs-color--hover);
        }
    }

    [data-part="copy"] {
        display: flex;
        padding-left: 8px;
        padding-right: 8px;
        align-items: center;
    }
    &[data-single="true"] [data-part="copy"] {
        top: 17px;
        position: relative;
        right: 5px;
    }
`;



