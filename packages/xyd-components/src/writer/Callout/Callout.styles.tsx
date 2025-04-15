import {css} from "@linaria/core";

export const CalloutHost = css`
    display: inline-flex;
    align-items: center;
    position: relative;
    width: 100%;
    min-width: 275px;
    padding: 8px 12px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #ececf1;
    background-color: #f7f7f8;
    
    [part="icon"] {
        display: inline-flex;
        margin-right: 14px;
        flex: 0 0 auto;
        align-self: flex-start;
        color: #6e6e80;
        font-size: 20px;
        margin-top: 2px;
    }
    
    [part="message"] {
        color: #353740;
        text-align: left;
        flex: 1 1 auto;
    }
    
    [part="message-body"] {
        font-size: 14px;
        line-height: 20px;
    }
`;
