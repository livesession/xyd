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
`;

export const CalloutNeutral = css`
    background-color: #f7f7f8;

    border-color: #ececf1;
`;

export const CalloutIcon = css`
    display: inline-flex;
    margin-right: 14px;
    flex: 0 0 auto;
    align-self: flex-start;

    color: #6e6e80;
    font-size: 20px;
    margin-top: 2px;
`;

export const CalloutMessage = css`
    color: #353740;
    text-align: left;

    flex: 1 1 auto;
`;

export const CalloutMessageBody = css`
    font-size: 14px;
    line-height: 20px;
`;
