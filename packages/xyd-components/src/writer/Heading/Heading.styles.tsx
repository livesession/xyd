import { css } from "@linaria/core";

export const HeadingHost = css`
    @layer defaults {
        color: var(--xyd-heading-color);
        line-height: var(--xyd-line-height-xlarge);
        font-weight: 600;

        position: relative;
        display: inline-block;
        margin: 0;
        padding: 0 24px 0 0;
        scroll-margin-top: 30px;
        cursor: default;

        &[id] {
            cursor: pointer;
        }

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
            font-size: var(--xyd-font-size-2xl);
            line-height: var(--xyd-line-height-2xl);
        }

        &[data-size="2"] {
            font-size: var(--xyd-font-size-xxlarge);
            line-height: var(--xyd-line-height-xxlarge);
        }

        &[data-size="3"] {
            font-size: var(--xyd-font-size-xlarge);
            line-height: var(--xyd-line-height-xlarge);
        }

        &[data-size="4"] {
            font-size: var(--xyd-font-size-large);
            line-height: var(--xyd-line-height-large);
        }

        &[data-size="5"] {
            font-size: var(--xyd-font-size-medium);
            line-height: var(--xyd-line-height-medium);
        }

        &[data-size="6"] {
            font-size: var(--xyd-font-size-small);
            line-height: var(--xyd-line-height-small);
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

