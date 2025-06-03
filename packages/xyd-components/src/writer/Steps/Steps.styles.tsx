import {css} from "@linaria/core";

export const StepsHost = css`
    @layer defaults {
        padding-left: 0;
        list-style: none;
        counter-reset: ordered-listitem;

        display: flex;
        flex-direction: column;
        gap: 6px;
    }
`;

export const StepsLi = css`
    @layer defaults {
        padding-left: 32px;
        position: relative;

        &::after {
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
            height: 24px;
            width: 24px;
            border-radius: 12px;
        }
    }
`;