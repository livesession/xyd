import {css} from "@linaria/core";

export const LineNumberHost = css`
    display: flex;
    
    [data-part="line-number"] {
        margin: 0 12px 0px 4px;
        text-align: right;
        user-select: none;
        opacity: 0.5;
    }
`;

export const MarkHost = css`
    display: flex;
    border-left-width: 4px;
    border-color: transparent;
    margin: 4px 0;

    &[data-annotated="true"] {
        border-color: var(--xyd-code-mark-border-color);
        background-color: var(--xyd-code-mark-bgcolor);
    }

    [data-part="line"] {
        flex: 1 1 0%;
    }
`;

export const Bg = css`
    &[data-annotated="true"] {
        border-color: var(--xyd-code-mark-border-color);
        background-color: var(--xyd-code-mark-bgcolor);
    }
`

export const CodeHost = css`
    max-height: 400px;
    background: var(--xyd-code-background) !important; // cuz can be overwritten by style - better solution in the future?

    margin: 0;
    padding: 8px 16px;

    border-top: 1px solid var(--xyd-code-border-color);
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;

    font-size: 12px;
    line-height: 20px;
    white-space: pre-wrap;
    word-break: break-all;

    overflow-y: scroll;

    [data-size="full"] {
        max-height: 100%;   
    }
`;

