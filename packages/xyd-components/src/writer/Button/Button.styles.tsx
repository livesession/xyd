import { css } from "@linaria/core";

export const ButtonHost = css`
    @layer defaults {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--xyd-button-border-radius, 6px);
        border: 1px solid transparent;
        font-weight: var(--xyd-font-weight-medium);
        transition: all 0.2s ease;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        gap: 8px;

        &[data-size="xs"] {
            height: 24px;
            padding: 0 8px;
            gap: 4px;

            font-size: var(--xyd-font-size-xsmall);
            line-height: var(--xyd-line-height-xsmall);

            p {
                font-size: var(--xyd-font-size-xsmall);
                line-height: var(--xyd-line-height-xsmall);
            }
        }

        &[data-size="sm"] {
            height: 28px;
            padding: 0 12px;
            gap: 6px;

            font-size: var(--xyd-font-size-xsmall);
            line-height: var(--xyd-line-height-xsmall);

            p {
                font-size: var(--xyd-font-size-xsmall);
                line-height: var(--xyd-line-height-xsmall);
            }
        }

        &[data-size="md"] {
            height: 36px;
            padding: 0 16px;
            gap: 8px;

            font-size: var(--xyd-font-size-small);
            line-height: var(--xyd-line-height-small);

            p {
                font-size: var(--xyd-font-size-small);
                line-height: var(--xyd-line-height-small);
            }
        }

        &[data-size="lg"] {
            height: 44px;
            padding: 0 20px;
            gap: 10px;

            font-size: var(--xyd-font-size-medium);
            line-height: var(--xyd-line-height-medium);

            p {
                font-size: var(--xyd-font-size-medium);
                line-height: var(--xyd-line-height-medium);
            }
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

        &[data-theme="ghost"] {
            background-color: unset;
            border: unset;
            padding: 0;

            &:hover {
                background-color: unset;
                border: unset;
                
                svg {
                    color: var(--dark60)
                }
            }

            svg {
                color: var(--dark48)
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
        &:not([data-theme="ghost"]) [part="icon"] svg {
                width: 16px !important;
                height: 16px !important;
        }
    }
`;

