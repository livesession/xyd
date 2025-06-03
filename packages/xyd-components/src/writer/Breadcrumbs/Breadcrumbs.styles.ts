import {css} from "@linaria/core";

export const BreadcrumbsHost = css`
    @layer defaults {
        display: flex;
        overflow: hidden;
        margin-top: 0.375rem;
        gap: 0.25rem;
        align-items: center;
        color: var(--xyd-breadcrumbs-color);
        
        [part="icon"] {
            shrink: 0;
            width: 0.875rem;
        }
        
        [part="item"] {
            white-space: nowrap;
            transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 300ms;
        }
        
        [part="item"][data-active="true"] {
            color: var(--xyd-breadcrumbs-color--active);
            font-weight: bold;
        }
    }
`;
