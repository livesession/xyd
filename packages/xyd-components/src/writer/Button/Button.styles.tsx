import { css } from "@linaria/core";

export const ButtonHost = css`
    @layer defaults {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        border: 1px solid transparent;
        font-weight: var(--xyd-font-weight-medium);
        transition: all 0.2s ease;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        gap: 8px;

        &[data-size="sm"] {
            height: 28px;
            padding: 0 12px;
            font-size: 13px;
            gap: 6px;
        }

        &[data-size="md"] {
            height: 36px;
            padding: 0 16px;
            font-size: 14px;
            gap: 8px;
        }

        &[data-size="lg"] {
            height: 44px;
            padding: 0 20px;
            font-size: 15px;
            gap: 10px;
        }

        &[data-kind="primary"] {
            background-color: var(--xyd-button-primary-bg);
            color: var(--xyd-button-primary-color);
            border-color: var(--xyd-button-primary-border);

            &:hover:not(:disabled) {
                background-color: var(--xyd-button-primary-bg-hover);
                border-color: var(--xyd-button-primary-border-hover);
            }
        }

        &[data-kind="secondary"] {
            background-color: var(--xyd-button-secondary-bg);
            color: var(--xyd-button-secondary-color);
            border-color: var(--xyd-button-secondary-border);

            &:hover:not(:disabled) {
                background-color: var(--xyd-button-secondary-bg-hover);
                border-color: var(--xyd-button-secondary-border-hover);
            }
        }

        &[data-kind="tertiary"] {
            background-color: var(--xyd-button-tertiary-bg);
            color: var(--xyd-button-tertiary-color);
            border-color: var(--xyd-button-tertiary-border);

            &:hover:not(:disabled) {
                background-color: var(--xyd-button-tertiary-bg-hover);
                border-color: var(--xyd-button-tertiary-border-hover);
            }
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        [part="content"] {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        [part="icon"] {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
    }
`;

export const ButtonIcon = css`
    @layer defaults {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
`; 