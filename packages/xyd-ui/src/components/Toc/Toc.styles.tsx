import {css} from '@linaria/core';

const cubizEnter = 'cubic-bezier(.19, 1, .22, 1)';

export const TocHost = css`
    position: relative;
    padding-left: 16px;
    display: block;

    [part="scroller"] {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 2px;
        background-color: var(--xyd-toc-bgcolor);
    }

    [part="scroll"] {
        position: absolute;
        top: 0;
        left: 0;
        width: 2px;
        height: var(--xyd-toc-active-track-height); // TODO: this must be dynamic
        transform: translateY(var(--xyd-toc-active-track-top)); // TODO: this must be dynamic
        background-color: var(--xyd-toc-scroll-bgcolor);
        transition: height .4s ${cubizEnter}, transform .4s ${cubizEnter};
    }

    [part="list"] {
        margin: 0;
        padding: 0;
        list-style: none;
    }
`;

export const TocLi = css`
    position: relative;
    line-height: 1.5;
    margin: 0 0 12px;
    padding: 0;

    [part="link"] {
        display: inline-block;
        font-size: 14px;
        color: var(--xyd-toc-item-color);
        line-height: 1.4;
        text-wrap: pretty;
        transition: color .15s ease;
    }

    &[data-active="true"] [part="link"] {
        color: var(--xyd-toc-item-color--active);
        font-weight: 600;
    }
`;

