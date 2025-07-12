import { css } from "@linaria/core";

export const SubNavHost = css`
    @layer defaults {
        align-items: center;
        background-color: var(--xyd-subnav-bgcolor);
        border-radius: 0.50rem;
        display: flex;
        flex-direction: row;

        width: 100%;
        height: var(--xyd-subnav-height);
        margin-top: 3px;
        padding: 0 var(--xyd-padding-large);

        [part="prefix"] {
            color: var(--xyd-subnav-prefix-color);
            font-weight: var(--xyd-font-weight-semibold);
            position: relative;
            padding: 0 var(--xyd-sidebar-item-padding-total);

            &:after {
                background: var(--xyd-subnav-prefix-marker-color);
                border-radius: 1px;
                content: " ";
                height: 12px;
                position: absolute;
                right: 0px;
                top: 50%;
                transform: translateY(-50%);
                width: 2px;
            }
        }

        [part="list"] {
            display: flex;
            flex-direction: row;
            height: 100%;
        }
        [part="list"]:has(:not([part="prefix"])) {
            padding: 0 var(--xyd-sidebar-item-padding-total);
        }
        @media (max-width: 1024px) {
            [part="list"]:has(:not([part="prefix"])) {
                padding: 0 var(--xyd-nav-padding);
            }
        }
    }
`;

export const SubNavItem = css`
    @layer defaults {
        display: flex;
        height: 100%;

        align-items: center;
        position: relative;
        padding-right: var(--xyd-padding-medium);

        [data-state="active"] > & {
            font-weight: var(--xyd-font-weight-semibold);

            a {
                color: var(--xyd-subnav-item-color--active);
            }

            a:after {
                background-color: var(--xyd-subnav-item-color--active-mark);
                border-radius: 1px;
                bottom: 0;
                content: " ";
                height: 2px;
                left: 0;
                position: absolute;
                width: 100%;
            }
        }

        [part="link"] {
            color: var(--xyd-subnav-item-color);
            display: flex;
            height: 100%;
            padding: 0 var(--xyd-padding-small);
            align-items: center;

            &:hover {
                color: var(--xyd-subnav-item-color--active);
            }
        }
    }
`;
