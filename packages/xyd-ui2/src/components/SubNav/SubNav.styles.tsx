import {css} from "@linaria/core";

export const $subNav = {
    host: css`
        align-items: center;
        background-color: #f6f6f7;
        border-radius: 0.50rem;
        display: flex;
        flex-direction: row;
        
        width: 100%;
        height: 44px;
        margin-top: 3px;
        padding: 0 0.25rem;
    `,
    prefix: css`
        color: #44474a;
        //font: var(--font-sans-font-nav-category-base);
        font-size: 12px;
        font-weight: 600;
        padding-left: 0.50rem;
        padding-right: 1.50rem;
        position: relative;
        text-transform: uppercase;

        &:after {
            background: #d2d5d8;
            border-radius: 1px;
            content: " ";
            height: 0.75rem;
            position: absolute;
            right: 0.50rem;
            top: 50%;
            transform: translateY(-50%);
            width: 2px;
        }
    `,
    ul: css`
        display: flex;
        flex-direction: row;
        height: 100%;
    `,
    li: css`
        display: flex;
        height: 100%;

        align-items: center;
        position: relative;

        &[data-state="active"] {
            a:after {
                background-color: #7051d4;
                border-radius: 1px;
                bottom: 0;
                content: " ";
                height: 2px;
                left: 0;
                position: absolute;
                width: 100%;
            }
        }
    `,
    link: css`
        color: #202223;
        //font: var(--font-sans-font-nav-item-active-base);
        line-height: 2.75rem;
        display: block;
        height: 100%;
        padding: 0 0.50rem;
    `
}