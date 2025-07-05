import { css } from "@linaria/core";

export const DropdownHost = css`
    @layer defaults {
        display: block;
        padding: var(--xyd-sidebar-anchor-item-padding);

        xyd-sidebar-tabs-dropdown {
            display: block;
            width: 100%;
        }
        button[part="dropdown-trigger"] {
            display: flex;
            align-items: center;
            width: 100%;
            background: var(--white);
            border: 1px solid var(--dark32);
            border-radius: 16px;
            padding: 12px 16px;
            gap: 12px;
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s;
            font: inherit;
        }
        button[part="dropdown-trigger"]:hover,
        button[part="dropdown-trigger"][data-state="open"] {
            border-color: var(--dark32);
            background: var(--dark16);
        }
        span[part="dropdown-icon"] {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
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
            color: var(--dark64);
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
            border-radius: 16px;
            padding: 8px 8px;
            /* min-width: 260px; */
            /* width:  */
            width: var(--radix-popover-trigger-width);
            border: 1px solid var(--dark32);
            margin-top: 4px;
            z-index: 999;
        }
        [part="dropdown-listitem"] {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            cursor: pointer;
            background: none;
            border: none;
            width: 100%;
            font: inherit;
            transition: background 0.15s;
            border-radius: 10px;
        }
        [part="dropdown-listitem"]:hover {
            background: var(--dark16);
        }
    }
`;

