import { css } from "@linaria/core";

export const SidebarHost = css`
    @layer defaults {
        background: var(--xyd-sidebar-bgcolor);
    
        height: 100%;
        border-radius: 4px;
        display: flex;
        flex-direction: column;

        [part="list"] {
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
            padding: 8px;
        }

        [part="footer"] {
            padding: 1rem;
            box-shadow: 0 -2px 10px var(--xyd-sidebar-divider-shadow-color);
            border-top: 1px solid var(--xyd-sidebar-divider-color);
        }
    }
`;

export const ItemHost = css`
    @layer defaults {
        color:var(--xyd-sidebar-item-color);

        button {
            width: 100%;
        }
        
        [part="link"] {
            display: flex;
            width: 100%;
            font-weight: 500;
        }

        [part="first-item"] {
            display: flex;
            width: 100%;
            padding: 8px 12px 8px var(--xyd-sidebar-item-padding-left);
            position: relative;
            
            &:has([part="logo"]) {
                display: table-cell;
            }

            &:not(:has([part="logo"])):hover {
                background: var(--xyd-sidebar-item-bgcolor--active-hover);
                color: var( --xyd-sidebar-item-color--active);
                border-radius: 4px;
            }
        }
        [part="first-item" ][data-active="true"] {
            background: var(--xyd-sidebar-item-bgcolor--active);
            border-radius: 4px;
            position: relative;
            font-weight: 600;
            color: var(--xyd-sidebar-item-color--active);
            
            &::before {
                content: "";
                position: absolute;
                background: var(--xyd-sidebar-item-bgcolor--active-mark);
                border-radius: 0 2px 2px 0;
                bottom: 9px;
                top: 9px;
                width: 2px;
                left: 5px;
                border-radius: 10px;
            }
        }
        [part="first-item"][data-parent-active="true"] {
            font-weight: 600;
            background: transparent;
        } 
        &[data-theme="secondary"] [part="first-item"][data-active="true"] {
            background: unset;
            font-weight: 500;
        }

        [part="item-button"] {
            &:has(+ [part="subtree"] xyd-collapse[data-open="true"]) {
                font-weight: bold;
            }
        }
    }
`;

export const TreeHost = css`
    @layer defaults {
        margin-left: 12px;
    }
`;

export const ItemHeaderHost = css`
    @layer defaults {
        padding-left: var(--xyd-sidebar-item-padding-left);
        margin-bottom: 8px;
        margin-top: 24px;
        font-weight: 600;
        letter-spacing: 1px;
        color: var( --xyd-sidebar-item-header-color);
    }
`;

export const FooterItemHost = css`
    @layer defaults {
        display: flex;
        width: 100%;
        padding: 2px;
        color: var(--xyd-sidebar-item-color);

        [part="item"] {
            display: flex;
            align-items: center;
            width: 100%;
            gap: 7px;
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
                font-size: var(--xyd-font-size-large);
                width: 18px;
                height: 18px;
            }
        }
    }
`;

