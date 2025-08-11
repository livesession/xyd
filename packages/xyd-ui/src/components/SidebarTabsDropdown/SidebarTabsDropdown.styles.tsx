import { css } from "@linaria/core";

const triggerPaddingX = 16;

export const globals = css`
    :global() {
        html[data-color-primary="true"] {
            [part="dropdown-icon"] svg {
                fill: var(--color-primary) !important;  // TODO: fix important
                color: var(--color-primary) !important; // TODO: fix important
            }
            [part="chevron-check"] svg {
                color: var(--color-primary);
            }
        }
    }
`

export const DropdownHost = css`
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-4px);
        }
    }

    @layer defaults {
        display: block;
        padding: var(--xyd-sidebar-ghost-item-padding);

        button[part="dropdown-trigger"] {
            display: flex;
            align-items: center;
            width: 100%;
            background: var(--white);
            border: 1px solid var(--dark32);
            border-radius: var(--xyd-border-radius-large);
            padding: 12px ${triggerPaddingX}px;
            gap: 12px;
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s;
            font: inherit;
            min-height: 52px;
        }
        button[part="dropdown-trigger"]:hover,
        button[part="dropdown-trigger"][data-state="open"] {
            border-color: var(--dark32);
            background: var(--dark16);
        }
        span[part="dropdown-icon"] {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--dark32);
            border-radius: var(--xyd-border-radius-medium);
        }
        span[part="dropdown-label-group"] {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
            text-align: left;
        }
        span[part="dropdown-label"] {
            font-weight: var(--xyd-font-weight-semibold);
            color: var(--dark100);
            font-size: var(--xyd-font-size-small);
            line-height: var(--xyd-line-height-small);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }
        span[part="dropdown-description"] {
            font-size: var(--xyd-font-size-xsmall);
            line-height: var(--xyd-line-height-xsmall);
            color: var(--dark60);
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        span[part="dropdown-chevron"] {
            margin-left: 12px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.1s ease;
        }
        button[part="dropdown-trigger"] span[part="dropdown-chevron"] {
            transform: rotate(90deg);
        }
        button[part="dropdown-trigger"][data-state="open"] span[part="dropdown-chevron"] {
            transform: rotate(270deg);
        }
        [part="dropdown-list"] {
            background: var(--white);
            border-radius: var(--xyd-border-radius-large);
            padding: 8px;
            /* min-width: 260px; */
            /* width:  */
            width: var(--radix-popover-trigger-width);
            border: 1px solid var(--dark32);
            margin-top: 4px;
            z-index: 999;

            opacity: 0;
            pointer-events: none;
            transform: translateY(-4px);
            animation-duration: 150ms;
            animation-timing-function: ease-out;
            animation-fill-mode: both;

            &[data-state="open"] {
                opacity: 1;
                pointer-events: auto;
                animation-name: fadeIn;
                transform: translateY(0);
            }

            &[data-state="closed"] {
                opacity: 0;
                pointer-events: none;
                animation-name: fadeOut;
                transform: translateY(-4px);
            }
        }

        [part="dropdown-listitem"] {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px ${triggerPaddingX}px;
            cursor: pointer;
            background: none;
            border: none;
            width: 100%;
            font: inherit;
            transition: background 0.15s;
            border-radius: 10px;

            &:hover {
                background: var(--dark16);
            }
        }
    }
`;

