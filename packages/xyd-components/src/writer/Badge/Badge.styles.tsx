import {css} from "@linaria/core";

export const BadgeHost = css`
    display: inline-flex;
    align-items: center;
    line-height: 1rem;
    font-style: normal;
    font-weight: 500;
    letter-spacing: normal;
    white-space: nowrap;
    text-transform: none;
`;

export const BadgeHostWarning = css`
    color: #434e4e;
    background-color: #ffffe1
`;

export const BadgeHostInfo = css`
    color: #fff;
    background-color: #1971a8;
`;

export const BadgeHostSm = css`
    font-size: 12px;
    height: 18px;
    padding: 0 6px;
    gap: 3px;
    border-radius: 6px;
`;

export const BadgeItem = css`
    position: relative;
`;