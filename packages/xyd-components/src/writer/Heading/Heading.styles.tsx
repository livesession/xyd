import { css } from "@linaria/core";

export const HeadingHost = css`
    @layer defaults {
        color: var(--xyd-heading-color);
        line-height: 40px;
        font-weight: 600;

        position: relative;
        display: inline-block;
        margin: 0;
        padding: 0 24px 0 0;
        scroll-margin-top: 30px;
        cursor: pointer;

        &:hover {
            svg {
                opacity: 1;
            }
        }

        &[data-kind="muted"] {
            color: var(--xyd-heading-color--muted);
            cursor: default;
        }

        &[data-size="1"] {
            font-size: 36px;

            code {
                font-size: 30px;
            }
        }

        &[data-size="2"] {
            font-size: 30px;

            code {
                font-size: 24px;
            }
        }

        &[data-size="3"] {
            font-size: 26px;

            code {
                font-size: 22px;
            }
        }

        &[data-size="4"] {
            font-size: 22px;

            code {
                font-size: 18px;
            }
        }

        &[data-size="5"] {
            font-size: 18px;

            code {
                font-size: 14px;
            }
        }

        &[data-size="6"] {
            font-size: 16px;

            code {
                font-size: 12px;
            }
        }

        [part="icon"] {
            position: absolute;
            top: 50%;
            right: 0;
            margin-top: -6px;
            opacity: 0;
            color: var(--xyd-heading-icon-color);
            transition: opacity .15s ease;
        }
    }
`;

