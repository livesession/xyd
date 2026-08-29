import { css } from "@linaria/core";

export const BreadcrumbsHost = css`
    @layer defaults {
        display: flex;
        overflow: hidden;
        gap: 4px;
        align-items: center;
        color: var(--xyd-breadcrumbs-color);
        
        [part="icon"] {
        }
        
        [part="item"] {
            white-space: nowrap;
            transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 300ms;
        }

        [part="item"] a {
            color: inherit;
            text-decoration: none;
        }

        [part="item"] a:hover {
            color: var(--xyd-breadcrumbs-color--hover, var(--xyd-content-color, currentColor));
            text-decoration: underline;
        }

        [part="item"][data-active="true"] {
        }
    }
`;
