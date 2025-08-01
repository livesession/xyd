import { css } from "@linaria/core";

const bulletPx = 24;
const lineWidth = 0.5;

export const StepsHost = css`
    display: block;

    @layer defaults {
        ol {
            padding-left: 0;
            list-style: none;
            counter-reset: ordered-listitem;

            display: flex;
            flex-direction: column;
            gap: 6px;
        }
    

        &[data-kind="secondary"] {
            li {
                margin-bottom: 32px;
            }

            li::before {
                content: "";
                position: absolute;
                border: ${lineWidth}px solid var(--dark32);
                height: 100%;
                top: calc(${bulletPx}px + 6px);
                left: calc(${bulletPx}px / 2 - (${lineWidth}px / 2));
            }
        }
    }
`;

export const StepsItem = css`
    @layer defaults {
        li {
            padding-left: 32px;
            position: relative;
        }

        [part="title"] {
            display: block;
            margin-bottom: 32px;
            font-weight: var(--xyd-font-weight-medium);
        }

        &[data-numeric="true"] {
            li::after {
                position: absolute;
                top: 0;
                left: 0;
                counter-increment: ordered-listitem;
                content: counter(ordered-listitem);

                background: var(--xyd-steps-marker-bgcolor);
                color: var(--xyd-steps-marker-color);
                font-size: var(--xyd-font-size-xsmall);
                line-height: var(--xyd-line-height-medium);
                font-weight: var(--xyd-font-weight-medium);
                text-align: center;
                height: ${bulletPx}px;
                width: ${bulletPx}px;
                border-radius: 12px;
            }
        }

        [part="step"] {
            position: absolute;
            top: 0;
            left: 0;

            background: var(--xyd-steps-marker-bgcolor);
            color: var(--xyd-steps-marker-color);
            font-size: var(--xyd-font-size-xsmall);
            line-height: var(--xyd-line-height-medium);
            font-weight: var(--xyd-font-weight-medium);
            text-align: center;
            height: ${bulletPx}px;
            width: ${bulletPx}px;
            border-radius: 12px;

            svg {
                width: 12px !important; // TODO: remove !important
            }
        }
    }
`;