import { css } from "@linaria/core";

export const NavHost = css`
    @layer defaults {
        position: sticky;
        top: 0;
        z-index: 20;
        width: 100%;
        background: transparent;
        display: flex;

        [part="shadow"] {
            pointer-events: none;
            position: absolute;
            z-index: -1;
            height: 100%;
            width: 100%;
            background-color: var(--xyd-nav-shadow-bgcolor);
        }

        [part="nav"] {
            display: flex;
            width: 100%;
            height: var(--xyd-nav-height);
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            padding-left: calc(max(env(safe-area-inset-left), var(--xyd-padding-default)));
            padding-right: calc(max(env(safe-area-inset-right), var(--xyd-padding-default)));
        }
        &[data-kind="middle"] [part="nav"] {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: center;
        }

        @media (max-width: 1024px) {
            &[data-kind="middle"] [part="nav"] {
                display: flex;
            }
        }

        [part="logo"] {
            display: flex;
            align-items: center;
            margin-right: auto;
        }

        @media (min-width: 1024px) {
            [part="logo"] {
                width: 100%;
            }
        }

        [part="list"] {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: auto;
        }

        @media (max-width: 1024px) {
            [part="list"] {
                display: none;
            }
        }

        [part="right"] {
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }
        @media (max-width: 1024px) {
            [part="right"] {
               width: 100%;
               overflow: auto;

               [role="tablist"] {
                overflow: auto;
               }
            }
        }

        [part="right"] > [role="tablist"] {
            display: flex;
        }
    }
`;


export const ItemHost = css`
    @layer defaults {
        position: relative;
        white-space: nowrap;
        color: var(--xyd-nav-item-color);
        padding: calc(var(--xyd-padding-default) / 2) var(--xyd-padding-default);
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

        [part="title1"] {
            position: absolute;
            inset: 0;
            text-align: center;
            align-items: center;
            display: flex;
            justify-content: center;
        }

        [part="title2"] {
            visibility: hidden;
            font-weight: var(--xyd-font-weight-semibold);
        }
    }
`;

