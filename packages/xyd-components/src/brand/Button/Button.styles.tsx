import {css} from "@linaria/core";

export const ButtonHost = css`
    display: inline-block;
    border: 1px solid transparent;
    text-align: center;
    white-space: nowrap;
    border-radius: 20px;
    padding: 0 20px;
    border-color: transparent;
    color: #3c3c43;
    background-color: #f7f7f8;

    transition: color .25s, border-color .25s, background-color .25s;

    &:hover {
        background: #e3e3e6;
    }
`;

export const ButtonHostSecondary = css`
    color: #fff;
    background-color: rgb(112, 81, 212);

    &:hover {
        background-color: rgb(95, 59, 211)
    }
`; 