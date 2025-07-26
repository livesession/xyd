import {css} from "@linaria/core";

export const BadgeHost = css`
    @layer defaults {
        display: inline-flex;
        align-items: center;
        
        /* Size variants */
        &[data-size="xs"] {
            height: 15px;
            padding: 6px;
            gap: 3px;
            border-radius: 6px;
            font-size: var(--xyd-font-size-xsmall);
        }

        &[data-size="sm"] {
            height: 18px;
            padding: 10px;
            gap: 3px;
            border-radius: 6px;
            font-size: var(--xyd-font-size-xsmall);
        }
        
        /* Kind variants */
        &[data-kind="default"] {
            color: var(--xyd-badge-color--default);
            background-color: var(--xyd-badge-bgcolor--default);
        }
        &[data-kind="warning"] {
            color: var(--xyd-badge-color--warning);
            background-color: var(--xyd-badge-bgcolor--warning);
        }
        &[data-kind="info"] {
            color: var(--xyd-badge-color--info);
            background-color: var(--xyd-badge-bgcolor--info);
        }

        [part="child"] {
            position: relative;
        }
    }
`;

