import {css} from "@linaria/core";

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
