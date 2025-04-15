import {css} from "@linaria/core";

export const TabsSampleHost = css`
    position: relative;
    max-width: 100%;

    [data-part="buttons"] {
        display: flex;
        align-items: center;
    }

    [data-part="arrow"] {
        padding: 8px;
        background-color: var(--xyd-tabs-arrow-bgcolor);
        box-shadow: 0 1px 2px 0 var(--xyd-tabs-shadow-color--active);
    }

    [data-part="arrow-icon"] {
        width: 16px;
        height: 16px;
    }

    [data-part="scroller"] {
        overflow-x: auto;
        flex-grow: 1;
    }

    [data-part="scroller-container"] {
        display: inline-flex;
        gap: 4px;

        border-radius: 8px;
        background-color: var(--xyd-tabs-bgcolor);
        
        padding: 4px;
        margin-left: 4px;
    }

    [data-part="button"] {
        padding: 0.5rem 1rem;

        border-radius: 0.375rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 500;
        white-space: nowrap;

        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;

        color: var(--xyd-tabs-color);

        &:hover {
            color: var(--xyd-tabs-color--active);
        }

        &[data-state="active"] {
            color: var(--xyd-tabs-color--active);
            background-color: var(--xyd-tabs-bgcolor--active);
            box-shadow: 0 1px 2px 0 var(--xyd-tabs-shadow-color--active);
        }
    }

    [data-part="content"] {
        margin-top: 16px;
    }
`;


