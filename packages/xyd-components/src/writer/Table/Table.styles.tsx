import {css} from "@linaria/core";

const colors = {
    primary: "#D1D5DB"
}

export const TableHost = css`
    display: block;
    overflow-x: scroll;

    border-collapse: collapse;
    border-radius: 3px;
`;

export const TableTh = css`
    padding: 0.5rem 1rem;
    margin: 0;

    font-weight: 600;
    border-width: 1px;
    border-color: ${colors.primary};
    background: rgba(234, 238, 242, 0.5);
`;

export const TableTr = css`
    padding: 0;
    margin: 0;
    border-top-width: 1px;
    border-color: ${colors.primary};
`;

export const TableTd = css`
    padding: 0.5rem 1rem;
    margin: 0;

    border-width: 1px;
    border-color: ${colors.primary};
`;


