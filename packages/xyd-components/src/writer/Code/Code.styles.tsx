import {css} from "@linaria/core";

export const CodeHost = css`
    display: inline-block;
    padding: 0 .3em;
    border-radius: 6px;
    margin: 0 3px;
    border: .5px solid #ececf1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.6em;
    background: linear-gradient(45deg, #f7f7f8 0%, rgba(247, 247, 248, 1) 100%);
    
    & [part="content"] {
        position: relative;
    }
`;