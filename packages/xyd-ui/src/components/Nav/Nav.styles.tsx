import { css } from "@linaria/core";

export const NavHost = css`
    position: sticky;
    top: 0;
    z-index: 20;
    width: 100%;
    background: transparent;
    display: flex;

    [data-part="shadow"] {
        pointer-events: none;
        position: absolute;
        z-index: -1;
        height: 100%;
        width: 100%;
        background-color: var(--xyd-nav-shadow-bgcolor);
    }

    [data-part="nav"] {
        display: flex;
        width: 100%;
        height: var(--xyd-nav-height);
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding-left: calc(max(env(safe-area-inset-left), 16px));
        padding-right: calc(max(env(safe-area-inset-right), 16px));
    }
    &[data-kind="middle"] [data-part="nav"] {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
    }

    [data-part="logo"] {
        display: flex;
        align-items: center;
        margin-right: auto;
    }

    [data-part="list"] {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
`;


export const ItemHost = css`
    font-size: 14px; /* 0.875rem */
    position: relative;
    white-space: nowrap;
    color: var(--xyd-nav-item-color);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        color: var(--xyd-nav-item-color--active);
    }

    &[data-state="active"] {
        font-weight: bold;
        background: var(--xyd-nav-item-bgcolor--active);
        border-radius: 8px;
    }

    [data-part="title1"] {
        position: absolute;
        inset: 0;
        text-align: center;
        align-items: center;
        display: flex;
        justify-content: center;
    }

    [data-part="title2"] {
        visibility: hidden;
        font-weight: 600;
    }
`;

