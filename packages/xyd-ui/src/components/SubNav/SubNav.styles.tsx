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
        padding: 0 0.25rem;

        [part="prefix"] {
            color: var(--xyd-subnav-prefix-color);
            font-weight: 600;
            padding-left: 0.50rem;
            padding-right: 1.50rem;
            position: relative;

            &:after {
                background: var(--xyd-subnav-prefix-marker-color);
                border-radius: 1px;
                content: " ";
                height: 0.75rem;
                position: absolute;
                right: 0.50rem;
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
    }
`;

export const SubNavLi = css`
    @layer defaults {
        display: flex;
        height: 100%;

        align-items: center;
        position: relative;

        [data-state="active"] > & {
            font-weight: 600;

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
            display: block;
            height: 100%;
            padding: 0 0.50rem;

            &:hover {
                color: var(--xyd-subnav-item-color--active);
            }
        }
    }
`;
