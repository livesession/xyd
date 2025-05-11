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
            padding-left: calc(max(env(safe-area-inset-left), 16px));
            padding-right: calc(max(env(safe-area-inset-right), 16px));
        }
        &[data-kind="middle"] [part="nav"] {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: center;
        }

        [part="logo"] {
            display: flex;
            align-items: center;
            margin-right: auto;
            width: 100%;
        }

        [part="list"] {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        [part="right"] {
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }
    }
`;


export const ItemHost = css`
    @layer defaults {
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
            font-weight: 600;
        }
    }
`;

