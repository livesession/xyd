import {css} from '@linaria/core';

const cubizEnter = 'cubic-bezier(.19, 1, .22, 1)';
const mobileBreakpoint = '768px';

export const TocHost = css`
    @layer defaults {
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
    }
`;

export const TocLi = css`
    @layer defaults {
        position: relative;
        margin: 0 0 12px;
        padding: 0;

        [part="link"] {
            display: inline-block;
            color: var(--xyd-toc-item-color);
            text-wrap: pretty;
            transition: color .15s ease;
            padding-left: 0;

            &:hover {
                color: var(--xyd-toc-item-color--active);
            }
        }

        &[data-active="true"] [part="link"] {
            color: var(--xyd-toc-item-color--active);
            font-weight: var(--xyd-font-weight-semibold);
        }

        &[data-depth="1"] [part="link"] {
            padding-left: 16px;
        }

        &[data-depth="2"] [part="link"] {
            padding-left: 32px;
        }

        &[data-depth="3"] [part="link"] {
            padding-left: 48px;
        }

        &[data-depth="4"] [part="link"] {
            padding-left: 64px;
        }
        
        &[data-depth="5"] [part="link"] {
            padding-left: 80px;
        }
    }
`;

