import {css} from "@linaria/core"

export const UnderlineNavHost = css`
    align-items: center;
    display: flex;

    height: 42px;

    background-color: #fff;
    border-bottom: 1px solid hsl(212, 15%, calc(96% - 12% * 1));

    z-index: 99;
`;

export const UnderlineNavUl = css`
    display: flex;
    gap: 10px;

    height: 100%;
    color: hsl(212, 15%, calc(96% - 12% * 4));

    list-style: none;
    padding: 0;
    white-space: nowrap;
`;

export const UnderlineNavItem = css`
    height: 100%;

    &[data-state="active"] { // TODO: in the future it should not be possible
        a {
            border-bottom-color: rgb(112, 81, 212);
        }
    }
`;

export const UnderlineNavItemLink = css`
    display: inline-flex;
    border-bottom: 3px solid transparent;
    text-decoration: none;

    height: 100%;
    padding: 10px;
`;

export const UnderlineNavItemLinkActive = css`
`;