import { css } from "@linaria/core";

export const LocaleSwitcherHost = css`
    @layer defaults {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: var(--xyd-locale-switcher-gap, 6px);
        padding: var(--xyd-locale-switcher-padding, 4px 8px);
        border-radius: var(--xyd-locale-switcher-border-radius, var(--xyd-border-radius-small, 6px));
        color: var(--xyd-locale-switcher-color, inherit);
        font-size: var(--xyd-locale-switcher-font-size, var(--xyd-font-size-small));
        line-height: 1;
        cursor: pointer;
        transition: background-color 120ms ease;

        &:hover {
            background-color: var(--xyd-locale-switcher-bgcolor--hover, var(--xyd-button-ghost-bgcolor--hover, rgba(127, 127, 127, 0.12)));
        }

        select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background: transparent;
            border: none;
            outline: none;
            padding: 0 18px 0 0;
            margin: 0;
            font: inherit;
            color: inherit;
            line-height: 1;
            cursor: pointer;
        }

        [part="label-icon"] {
            flex-shrink: 0;
            width: 16px;
            height: 16px;
        }

        [part="caret"] {
            position: absolute;
            right: var(--xyd-locale-switcher-caret-right, 6px);
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            opacity: 0.7;
            width: 14px;
            height: 14px;
        }
    }
`;
