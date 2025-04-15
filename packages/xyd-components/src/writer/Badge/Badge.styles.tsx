import {css} from "@linaria/core";

export const BadgeHost = css`
    display: inline-flex;
    align-items: center;
    line-height: 1rem;
    font-style: normal;
    font-weight: 500;
    letter-spacing: normal;
    white-space: nowrap;
    text-transform: none;
    
    /* Size variants */
    &[data-size="sm"] {
        font-size: 12px;
        height: 18px;
        padding: 0 6px;
        gap: 3px;
        border-radius: 6px;
    }
    
    /* Kind variants */
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
`;

