import {css} from "@linaria/core";

export const $breadcrumbs = {
    host: css`
        display: flex;
        overflow: hidden;
        margin-top: 0.375rem;
        gap: 0.25rem;
        align-items: center;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #6B7280;
    `,
    icon: css`
        shrink: 0;
        width: 0.875rem;
    `,
    item: css`
        white-space: nowrap;
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
    `,
    item$$active: css`
        color: #000;
        font-weight: bold;
    `
};
