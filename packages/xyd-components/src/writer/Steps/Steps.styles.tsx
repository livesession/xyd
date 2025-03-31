import {css} from "@linaria/core";

export const StepsHost = css`
    padding-left: 0;
    list-style: none;
    counter-reset: ordered-listitem;

    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const StepsLi = css`
    padding-left: 32px;
    position: relative;
    line-height: 1.5;

    &::after {
        position: absolute;
        top: 0;
        left: 0;
        counter-increment: ordered-listitem;
        content: counter(ordered-listitem);

        background: #ececf1;
        color: #353740;
        font-size: 12px;
        line-height: 24px;
        font-weight: 500;
        text-align: center;
        height: 24px;
        width: 24px;
        border-radius: 12px;
    }
`;