import { css } from "@linaria/core";

export const DetailsHost = css`
    border-top: 1px solid var(--xyd-details-border-color);
    
    &[data-kind="secondary"], &[data-kind="tertiary"] {
        background-color:  var(--xyd-details-bgcolor--secondary);
        border: 1px solid var(--xyd-details-border-color);
        border-radius: 8px;
    }

    &[open] [part="summary"] svg[data-icon="true"] { 
        transform: rotate(90deg);
    }

    [part="summary"] {
        padding: 16px 14px 16px 0;
        font-size: 18px;
        cursor: pointer;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
        transition: color 0.3s;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        list-style: none;

        &:hover {
            color: var(--xyd-details-summary-color--active);
        }
    }

    &[data-kind="tertiary"] [part="summary"]{
        padding: 10px 24px;
    }
    &[data-kind="secondary"],
    &[data-kind="tertiary"] {
        [part="summary"] {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding: 20px 24px;
        }
    }

    [part="summary-deep"] {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    [part="summary-deep-text"] {
        color: var(--xyd-details-summary-color);
        text-transform: none;
        font-size: 12px;
        line-height: 16px;
        letter-spacing: .08em;
        margin-left: 8px;
        font-weight: 700;

        code {
            background: var(--xyd-details-summary-code-bgcolor);
        }
    }

    [part="summary-deep-label"] {
        flex: 1 1 auto;
    }

    // TODO: after migration to web-components should be removed cuz 'part="content"' can be also in another element as child
    xyd-details > & > [part="content"] { 
        padding: 0 24px 20px;
    }
    xyd-details > &[data-kind="tertiary"] > [part="content"] {
        background-color: var(--xyd-details-content-bgcolor);
        padding-top: 20px;

        code {
            background: var(--xyd-details-content-bgcolor);
        }
    }

    [part="icon"] {
        flex: 0 0 auto;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-right: 6px;
    }
`;

