import { renderToStaticMarkup } from 'react-dom/server';
import { css } from "@linaria/core";
import ChevronIcon from './chevronIcon.svg';

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
            font-weight: var(--xyd-font-weight-medium);
        }

        [part="first-item"] {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 6px 12px 6px var(--xyd-sidebar-item-padding-left);
            margin-bottom: 4px;
            position: relative;
            
            &[data-anchor="true"] {
                padding: 6px 12px 12px var(--xyd-sidebar-item-padding-left);
            }

            &:not([data-anchor="true"]):hover {
                background: var(--xyd-sidebar-item-bgcolor--active-hover);
                color: var( --xyd-sidebar-item-color--active);
                border-radius: 4px;
            }

            [part="item-title-container"] {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            [part="item-title"] {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
        [part="first-item" ][data-active="true"] {
            background: var(--xyd-sidebar-item-bgcolor--active);
            border-radius: 4px;
            position: relative;
            font-weight: var(--xyd-font-weight-semibold);
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
            font-weight: var(--xyd-font-weight-semibold);
            background: transparent;
        } 
        &[data-theme="secondary"] [part="first-item"][data-active="true"] {
            background: unset;
            font-weight: var(--xyd-font-weight-medium);
        }

        [part="item-button"] {
            &:has(+ [part="subtree"] xyd-collapse) {
                position: relative;

                &::after {
                    content: "";
                    position: absolute;
                    right: 8px;
                    top: 0;
                    bottom: 0;
                    width: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--xyd-sidebar-item-color);
                    // TODO: IN THE FUTURE IN THE COMPONENTS BUT CURRENTLY IT DOES ITEM DOES NOT HAVE ENOUGH STATE KNOWLEDGE
                    -webkit-mask-image: url(${ChevronIcon});
                    mask-image: url(${ChevronIcon});
                    -webkit-mask-size: contain;
                    mask-size: contain;
                    -webkit-mask-repeat: no-repeat;
                    mask-repeat: no-repeat;
                    -webkit-mask-position: center;
                    mask-position: center;
                    transition: transform 0.2s ease, background-color 0.2s ease;
                    transform: rotate(-90deg);
                }

                &:hover::after {
                    background-color: var(--xyd-sidebar-item-color--active);
                }
            }

            &:has(+ [part="subtree"] xyd-collapse[data-open="true"]) {
                font-weight: bold;
                
                &::after {
                    transform: rotate(0deg);
                }
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
        font-size: var(--xyd-font-size-xsmall);
        font-weight: var(--xyd-font-weight-extrabold);
        text-transform: uppercase;
        letter-spacing: 0.25px;
        color: var( --xyd-sidebar-item-header-color);
        padding-left: var(--xyd-sidebar-item-padding-left);
        margin-bottom: 8px;
        margin-top: 24px;
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

