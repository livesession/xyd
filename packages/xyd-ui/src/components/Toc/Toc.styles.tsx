import {css} from '@linaria/core';

export const $toc = {
    host: css`
        position: relative;
        padding-left: 16px;
    `,
    ul: css`
        margin: 0;
        padding: 0;
        list-style: none;
    `,
    li: css`
        position: relative;
        line-height: 1.5;

        margin: 0 0 10px;
        padding: 0;
    `,
    link: css`
        display: inline-block;
        font-size: 14px;
        color: #6e6e80;
        line-height: 1.4;
        text-wrap: pretty;
        transition: color .15s ease;
    `,
    link$$active: css`
        font-weight: 500;
        color: #353740;
    `
}

const cubizEnter = 'cubic-bezier(.19, 1, .22, 1)';

export const $scroller = {
    host: css`
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 2px;

        background-color: #ececf1;
    `,
    scroll: css`
        position: absolute;
        top: 0;
        left: 0;
        width: 2px;
        height: var(--active-track-height); // TODO: this must be dynamic
        transform: translateY(var(--active-track-top)); // TODO: this must be dynamic
        background-color: #353740;
        transition: height .4s ${cubizEnter}, transform .4s ${cubizEnter};
    `
}