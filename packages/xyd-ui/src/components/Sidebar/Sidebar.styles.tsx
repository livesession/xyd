import { css } from "@linaria/core";

export const SidebarHost = css`
    background: var(--xyd-sidebar-bgcolor);
    
    height: 100%;
    border-radius: 4px;
    display: flex;
    flex-direction: column;

    [data-part="list"] {
        overflow-y: auto;
        overflow-x: hidden;
        height: 100%;
        padding: 8px;
    }

    [data-part="footer"] {
        padding: 1rem;
        box-shadow: 0 -2px 10px var(--xyd-sidebar-divider-shadow-color);
        border-top: 1px solid var(--xyd-sidebar-divider-color);
    }
`;


export const ItemHost = css`
    color:var(--xyd-sidebar-item-color);
    font-size: 14px;

    [data-part="link"] {
        display: flex;
        width: 100%;
        font-weight: 500;
    }

    [data-part="first-item"] {
        display: flex;
        width: 100%;
        padding: 8px 12px 8px 16px;
        position: relative;
        font-size: 14px;

        &:hover {
            background: var(--xyd-sidebar-item-bgcolor--active-hover);
            color: var( --xyd-sidebar-item-color--active);
            border-radius: 4px;
        }
    }
    &[data-active="true"] [data-part="first-item" ] {
        background: var(--xyd-sidebar-item-bgcolor--active);
        border-radius: 4px;
        position: relative;
        font-weight: 600;
        color: var(--xyd-sidebar-item-color--active);
        
        &::before {
            background: var(--xyd-sidebar-item-bgcolor--active-mark);
            border-radius: 0 2px 2px 0;
            bottom: 7px;
            content: "";
            left: 5px;
            position: absolute;
            top: 7px;
            width: 4px;
            border-radius: 10px;
        }
    }
    &[data-parent-active="true"] [data-part="first-item"] {
        font-weight: 600;
        background: transparent;
    } 
    &[data-active="true"] [data-theme="secondary"] [data-part="first-item"] {
        background: unset;
        font-weight: 500;
    }
`;

export const TreeHost = css`
    margin-left: 12px;
`;

export const ItemHeaderHost = css`
    padding-left: 12px;
    margin-bottom: 8px;
    margin-top: 24px;
    font-size: 13px;
    line-height: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var( --xyd-sidebar-item-header-color);
`;

export const FooterItemHost = css`
    display: flex;
    width: 100%;
    padding: 2px;
    color: var(--xyd-sidebar-item-color);

    [data-part="item"] {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 7px;
        font-size: 14px;
        padding: 4px 8px;

        &:hover {
            background: var(--xyd-sidebar-item-bgcolor--active-hover);
            color: var(--xyd-sidebar-item-color--active);
            border-radius: 4px;

            svg {
                fill: var(--xyd-sidebar-item-color--active);
            }
        }

        svg {
            fill: var(--xyd-sidebar-item-color);
            font-size: 18px;
            width: 18px;
            height: 18px;
        }
    }
`;

