import { css } from "@linaria/core";

export const LineNumberHost = css`
    @layer defaults {
        display: flex;
        position: relative;
        
        [part="line-number"] {
            /* margin: 0 12px 0px 4px; */
            width: 25px;
            left: -15px;
            position: absolute;
            margin: 0;
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

        &[data-diff="true"] {
            position: relative;

            &[data-query="-"] {
                border-color: var(--xyd-text-color--error--active);
                background-color: var(--xyd-text-color--error--muted);
            }

            &[data-query="+"] {
                border-color: var(--xyd-text-color--success--active);
                background-color: var(--xyd-text-color--success--muted);
            }

            & > :first-child {
                position: absolute;
                left: 5px;
            }
        }

        [part="line"] {
            flex: 1 1 0%;
        }

        xyd-code-linenumber [part="line"]{
            position: relative;
            left: 25px;
        }
    }
`;

export const MarkInlineHost = css`
    @layer defaults {
        display: inline-block;

        outline: solid 1px var(--xyd-coder-code-mark-border-color);
        background: var(--xyd-coder-code-mark-bgcolor);


        &[data-diff="true"] {
            &[data-query="-"] {
                border-color: var(--xyd-text-color--error--active);
                background-color: var(--xyd-text-color--error--muted);
            }

            &[data-query="+"] {
                border-color: var(--xyd-text-color--success--active);
                background-color: var(--xyd-text-color--success--muted);
            }
        }
    }
`

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
        
        &:not(:has(+ [part="code-description"])) {
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
        }

        white-space: pre-wrap;
        word-break: break-all;

        overflow-y: scroll;

        &[data-size="full"] {
            max-height: 100%;   
        }

        & > div {
        }
    }
`;


export const CodeDescription = css`
    padding: 17px 20px 10px;
    background-color: var(--white);
    border-radius: 0 0 8px 7px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    color: var(--text-primary);

    & > div:first-child {
        display: flex;
        align-items: center;
        padding-top: 5px;
    }

    & > div:last-child {
        display: flex;
        flex-direction: column;
        gap: 4px;

        > span {
            display: flex;
            align-items: center;
        }
    }
`