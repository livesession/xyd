import { css } from "@linaria/core";

import ChevronIcon from './chevronIcon.svg';

export const SidebarHost = css`
    @layer defaults {
        background: var(--xyd-sidebar-bgcolor);

        height: 100%;
        border-radius: 4px;
        display: flex;
        flex-direction: column;

        /* appearance.sidebar.groupCase="none" → render group headers as authored */
        &[data-group-case="none"] [part="item-header"] {
            text-transform: none;
            letter-spacing: normal;
        }

        [part="item-group"] {
            & > * {
                padding-bottom: 4px;
            }

            & + [part="item"] {
                margin-top: 24px;
            }
        }

        /* An asToc wrapper that FOLLOWS real content owes it separation. */
        [part="item"] + [part="item-group"][data-astoc="true"],
        [part="item-header"] + [part="item-group"][data-astoc="true"],
        [part="item-group"] + [part="item-group"][data-astoc="true"] {
            margin-top: 24px;
        }

        /* sidebar-as-TOC groups (asToc + indicator enabled): CONSECUTIVE
           groups share ONE wrapper — headers included — so a single
           continuous TOC track line spans them (the right-hand TOC's look).
           The active section paints its own segment of the track (same
           tokens as xyd-toc), replacing the sidebar's built-in active mark. */
        [part="item-group"][data-astoc="true"] {
            position: relative;
            display: block;
            padding-left: 10px;
            /* Separation is owed only to something ABOVE. A leading zero-height
               wrapper means :first-child cannot be relied on here, so the margin
               is applied by adjacency instead — otherwise an asToc page's first
               row sat 24px lower than a heading-less or named-group one, and the
               list visibly jumped when moving between them. */
            margin-top: 0;

            /* the wrapper carries the group separation — the first header's
               own top margin would push the track above it as a stray line */
            [part="item-header"]:first-child {
                margin-top: 0;
            }

            /* ...and separation is only owed to something ABOVE. As the list's
               first child there is nothing to separate from, so the 24px reads
               as a stray top offset — which is why an asToc page's first item
               sat lower than a heading-less or named-group one. */
            &:first-child {
                margin-top: 0;
            }

            /* sidebar filter matched nothing inside → no items, no track */
            &:not(:has(li)) {
                display: none;
            }

            &::before {
                content: "";
                position: absolute;
                top: 4px;
                bottom: 4px;
                left: 0;
                width: 2px;
                border-radius: 2px;
                background-color: var(--xyd-toc-bgcolor);
            }

            [part="item"] {
                position: relative;
            }
            [part="item"]:has(> * > [part="primary-item"][data-active="true"])::before {
                content: "";
                position: absolute;
                top: 2px;
                bottom: 2px;
                left: -10px;
                width: 2px;
                border-radius: 2px;
                background-color: var(--xyd-toc-scroll-bgcolor);
                transition: top .2s ease, bottom .2s ease;
            }
            /* the track replaces the built-in active mark */
            [part="primary-item"][data-active="true"]::before {
                display: none;
            }
        }
        [part="scroll-shadow"]::before {
            background: var(--shadow);
            content: "";
            height: 20px;
            left: 0;
            -webkit-mask-image: linear-gradient(0deg, transparent, #000);
            mask-image: linear-gradient(0deg, transparent, #000);
            opacity: 1;
            pointer-events: none;
            position: absolute;
            right: 10px;
            top: 0;
            transition: opacity .1s ease;
            z-index: 2;
            left: 0;
            right: 0;
        }

        /* Pinned region above the scrollable list — stays visible while the list
           scrolls (flex:none so it doesn't shrink; the list flex-shrinks around it). */
        [part="fixed"] {
            flex: none;
            padding: var(--xyd-sidebar-padding);
        }
        /* collapse when there's no pinned content (no filter / surface / fixed items) */
        [part="fixed"]:empty {
            display: none;
        }

        [part="list"] {
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
            padding: var(--xyd-sidebar-padding);
        }

        /* With a pinned region above, its own bottom padding is the clear space
           over the first row. With no pinned region the list is flush against
           the top of the sidebar and the first row reads as cramped, so the list
           supplies that space itself — 24px, the same separation the sidebar
           already uses between groups. */
        [part="fixed"]:empty + [part="list"] {
            padding-top: 24px;
        }

        /* scroll="sidebar": the WHOLE sidebar scrolls (scrollbar spans its full
           height); the fixed region sticks to the top and items pass beneath it. */
        &[data-scroll="sidebar"] {
            overflow-y: auto;
            overflow-x: hidden;
        }
        &[data-scroll="sidebar"] [part="fixed"] {
            position: sticky;
            top: 0;
            z-index: 2;
            background: var(--xyd-sidebar-bgcolor);
        }
        &[data-scroll="sidebar"] [part="list"] {
            overflow: visible;
            height: auto;
        }

        [part="item-separator"] {
            border-top: 1px solid var(--xyd-sidebar-divider-color);
            margin: 12px 0;
            list-style: none;
        }

        [part="footer"] {
            padding: var(--xyd-sidebar-padding);
            border-top: 1px solid var(--xyd-sidebar-divider-color);

            [part="item"] [part="primary-item"] > svg {
                width: 16px !important;
                height: 16px !important;
            }
        }

        [part="logo"] {
            display: flex;
            align-items: center;
            height: 28px;
            width: auto;

            img {
                height: 28px;
                width: auto;
            }
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

        [part="primary-item"] {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 6px 12px 6px var(--xyd-sidebar-item-padding-left);
            margin-bottom: 4px;
            position: relative;
            
            &[data-ghost="true"] {
                padding: var(--xyd-sidebar-ghost-item-padding);
            }

            &:not([data-ghost="true"]):hover {
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
                white-space: break-spaces;
                text-align: left;
            }
        }
        [part="primary-item" ][data-active="true"] {
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
        [part="primary-item"][data-parent-active="true"] {
            font-weight: var(--xyd-font-weight-semibold);
            background: transparent;
        } 
        &[data-theme="secondary"] [part="primary-item"][data-active="true"] {
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

            /* &:has(+ [part="subtree"] xyd-collapse[data-open="true"]) {
                
                &::after {
                    transform: rotate(0deg);
                }
            } */

            &:has(+ [part="subtree"] > xyd-collapse[data-open="true"]) {
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

        display: flex;
        align-items: center;
        gap: 8px;
    }
`;

