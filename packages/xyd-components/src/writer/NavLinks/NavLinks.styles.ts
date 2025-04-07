import {css} from "@linaria/core";
import colors from "@livesession/design-system-colors";

export const NavLinksHost = css`
    display: flex;
    padding-top: 2rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    justify-content: space-between;
    align-items: center;
    border-top-width: 1px;
    border-color: ${colors.dark32};
`;

export const NavLinksLink = css`
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 16px;
    line-height: 1.5;
    font-weight: 600;
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
    max-width: 50%;
`;

export const NavLinksIcon = css`
    display: inline;
    height: 1.25rem;
    flex-shrink: 0;
`;
