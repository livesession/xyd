import { css } from "@linaria/core";

export const CalloutHost = css`
    @layer defaults {
        display: inline-flex;
        align-items: center;
        position: relative;
        width: 100%;
        min-width: 275px;
        padding: 8px 12px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid var(--xyd-callout-border-color);
        background-color: var(--xyd-callout-bgcolor);
        overflow: auto;
        
        code {
            background: var(--white);
        }
        
        /* Common callout styles */
        &[data-kind] {
            --callout-border-color: color-mix(in srgb, var(--callout-color) 30%, transparent);
            --callout-bgcolor: color-mix(in srgb, var(--callout-color-muted) 10%, transparent);
            border-color: var(--callout-border-color);
            background-color: var(--callout-bgcolor);

            p {
                color: var(--callout-color-active);
            }

            a {
                color: var(--text-primary);
                text-decoration: underline;
                text-decoration-color: var(--callout-color-active);
                text-underline-offset: 4px;
                text-decoration-thickness: 1px;
                font-weight: var(--xyd-font-weight--semibold);

                &:hover {
                    text-decoration-thickness: 2px;
                }
            }

            [part="icon"] {
                svg {
                    color: var(--callout-color-active);
                    fill: var(--callout-color-active);
                }
            }
        }
        
        &[data-kind="tip"] {
            --callout-color: var(--xyd-text-color--success);
            --callout-color-muted: var(--xyd-text-color--success--muted);
            --callout-color-active: var(--xyd-text-color--success--active);
        }
        
        &[data-kind="check"] {
            --callout-color: var(--xyd-text-color--success);
            --callout-color-muted: var(--xyd-text-color--success--muted);
            --callout-color-active: var(--xyd-text-color--success--active);
        }

        &[data-kind="warning"] {
            --callout-color: var(--xyd-text-color--warn);
            --callout-color-muted: var(--xyd-text-color--warn--muted);
            --callout-color-active: var(--xyd-text-color--warn--active);
        }
        
        &[data-kind="note"] {
            --callout-color: var(--xyd-text-color--info);
            --callout-color-muted: var(--xyd-text-color--info--muted);
            --callout-color-active: var(--xyd-text-color--info--active);
        }
        
        &[data-kind="danger"] {
            --callout-color: var(--xyd-text-color--error);
            --callout-color-muted: var(--xyd-text-color--error--muted);
            --callout-color-active: var(--xyd-text-color--error--active);
        }

        [part="icon"] {
            display: inline-flex;
            margin-right: 14px;
            flex: 0 0 auto;
            align-self: flex-start;
            color: var(--xyd-callout-icon-color);
            margin-top: 2px;
        }
        
        [part="message"] {
            color: var(--xyd-callout-message-color);
            text-align: left;
            flex: 1 1 auto;
        }
        
        [part="message-body"] {
        }
        
    }
`;
