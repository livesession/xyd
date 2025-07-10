import { css } from "@linaria/core";

export const NavHost = css`
    @layer defaults {
        position: sticky;
        top: 0;
        z-index: 20;
        width: 100%;
        background: transparent;
        display: flex;

        [role="tablist"] {
            display: flex;
            align-items: center;
        }

        [part="shadow"]::before {
            pointer-events: none;
            position: absolute;
            z-index: -1;
            height: 100%;
            width: 100%;
            background-color: var(--xyd-nav-shadow-bgcolor);
        }

        [part="nav-left"] {
            flex: 1;
        }

        [part="nav"] {
            display: flex;
            width: 100%;
            height: var(--xyd-nav-height);
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            padding: 0 var(--xyd-nav-padding);
        }

        [part="nav-center"] {
            flex: 1;

            [role="tablist"] {
                justify-content: center;
            }
        }

        [part="logo"] {
            display: flex;
            align-items: center;
            margin-right: auto;
            height: 28px;
            width: auto;
        }

        @media (min-width: 1024px) {
            [part="logo"] {
                width: 100%;
            }
        }

        [part="nav-list"] {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: auto;
        }

        @media (max-width: 1024px) {
            [part="nav-list"] {
                display: none;
            }
        }

        [part="nav-right"] {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex: 1;
        }
        @media (max-width: 1024px) {
            [part="nav-right"] {
               width: 100%;
               overflow: auto;
            }

            [role="tablist"] {
                overflow: auto;
            }
        }

        [part="nav-right"] [role="tablist"] {
            display: flex;
        }
    }
`

export const ItemHost = css`
    @layer defaults {
        position: relative;
        white-space: nowrap;
        color: var(--xyd-nav-item-color);
        padding: calc(var(--xyd-nav-padding) / 2) var(--xyd-nav-padding);
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

        [part="nav-item1"] {
            position: absolute;
            inset: 0;
            text-align: center;
            align-items: center;
            display: flex;
            justify-content: center;
        }

        [part="nav-item2"] {
            visibility: hidden;
            font-weight: var(--xyd-font-weight-semibold);
        }
    }
`;

