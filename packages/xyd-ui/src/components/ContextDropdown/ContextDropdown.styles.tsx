import { css } from "@linaria/core";

export const ContextDropdownHost = css`
    @keyframes xydContextDropdownIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @layer defaults {
        display: inline-flex;

        button[part="context-dropdown-trigger"] {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--dark16);
            border: 1px solid transparent;
            border-radius: var(--xyd-border-radius-large);
            padding: 6px 12px;
            cursor: pointer;
            font: inherit;
            color: var(--dark100);
            transition: background 0.15s, border-color 0.15s;
        }
        button[part="context-dropdown-trigger"]:hover,
        button[part="context-dropdown-trigger"][data-state="open"] {
            background: var(--dark32);
        }
        span[part="context-dropdown-trigger-icon"] {
            display: inline-flex;
            align-items: center;
        }
        span[part="context-dropdown-trigger-label"] {
            font-size: var(--xyd-font-size-small);
            font-weight: var(--xyd-font-weight-semibold);
            white-space: nowrap;
        }
        span[part="context-dropdown-chevron"] {
            display: inline-flex;
            align-items: center;
            color: var(--dark64);
        }
    }
`

// Popover.Content renders in a portal — style via :global on the part.
export const globals = css`
    :global() {
        /* animation ONLY while open — an always-matching animation wedges
           Radix Presence on close (it waits for an animationend that already
           fired), leaving the menu mounted forever. */
        [part="context-dropdown-content"][data-state="open"] {
            animation: xydContextDropdownIn 0.12s ease-out;
        }
        [part="context-dropdown-content"] {
            display: flex;
            flex-direction: column;
            min-width: 280px;
            max-width: 360px;
            background: var(--white);
            border: 1px solid var(--dark16);
            border-radius: var(--xyd-border-radius-large);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
            padding: 8px;
            z-index: 50;

            [part="context-dropdown-item"] {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 10px 12px;
                border: 0;
                border-radius: var(--xyd-border-radius-medium);
                background: transparent;
                cursor: pointer;
                text-align: left;
                text-decoration: none;
                font: inherit;
                color: var(--dark100);
            }
            [part="context-dropdown-item"]:hover,
            [part="context-dropdown-item"][aria-selected="true"] {
                background: var(--dark16);
            }
            [part="context-dropdown-item-icon"] {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                flex-shrink: 0;
                border-radius: var(--xyd-border-radius-medium);
                background: var(--dark16);
            }
            [part="context-dropdown-label-group"] {
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 0;
            }
            [part="context-dropdown-label"] {
                font-size: var(--xyd-font-size-medium);
                font-weight: var(--xyd-font-weight-semibold);
            }
            [part="context-dropdown-description"] {
                font-size: var(--xyd-font-size-small);
                color: var(--dark64);
            }
        }
    }
`
