import {css} from "@linaria/core";

export const LineNumberHost = css`
    @layer defaults {
        display: flex;
        
        [part="line-number"] {
            margin: 0 12px 0px 4px;
            text-align: right;
            user-select: none;
            opacity: 0.5;
        }
    }
`;

export const MarkHost = css`
    @layer defaults {
        display: flex;
        border-left-width: 4px;
        border-color: transparent;
        margin: 4px 0;

        &[data-annotated="true"] {
            border-color: var(--xyd-coder-code-mark-border-color);
            background-color: var(--xyd-coder-code-mark-bgcolor);
        }

        [part="line"] {
            flex: 1 1 0%;
        }
    }
`;

export const BgHost = css`
    @layer defaults {
        &[data-annotated="true"] {
            border-color: var(--xyd-coder-code-mark-border-color);
            background-color: var(--xyd-coder-code-mark-bgcolor);
        }
    }
`

export const CodeHost = css`
    @layer defaults {
        max-height: 400px;
        background: var(--xyd-coder-code-background); // cuz can be overwritten by style - better solution in the future?

        margin: 0;
        padding: 8px 16px;

        border-top: 1px solid var(--xyd-coder-code-border-color);
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;

        white-space: pre-wrap;
        word-break: break-all;

        overflow-y: scroll;

        [data-size="full"] {
            max-height: 100%;   
        }
    }
`;

