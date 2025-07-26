import { css } from "@linaria/core";

export const ExternalArrowHost = css`
    @layer defaults {
        --external-arrow2-size: 7px;

        width: var(--external-arrow2-size);
        height: var(--external-arrow2-size);
        margin-top: calc(var(--external-arrow2-size) * -1);
        margin-left: calc(var(--external-arrow2-size) / 2);

        fill: currentColor;
        color: currentColor;
    }
`;