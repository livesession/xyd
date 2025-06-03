import {css} from "@linaria/core";

// TODO: in the futre better media queries
const tabletBreakpoint = '1024px';
const mobileBreakpoint = '768px';

export const LayoutPrimaryHost = css`
    @layer defaults {
        width: 100%;
        overflow-x: hidden;
        background: var(--xyd-page-body-bgcolor);
        display: block;

        > [part="header"] {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: fixed;
            top: var(--xyd-header-warning-height);
            right: var(--xyd-page-gutter);
            left: var(--xyd-page-gutter);
            height: var(--xyd-nav-height);
            background: var(--xyd-layout-header-bgcolor);

            @media (max-width: ${mobileBreakpoint}) {
                padding: 0;
            }
        }

        &[data-hide-subheader="true"] > [part="header"] {
            transform: translateY(calc(-1 * var(--xyd-nav-height) - 5px));
        }

        &[data-subheader="true"] > [part="header"] {
            flex-direction: column;
            height: var(--xyd-header-total-height);
            transition: transform 200ms;
        }

        [part="header-content"] {
            display: flex;
            align-items: center;
            width: 100%;
        }

        [part="hamburger-button"] {
            display: none;

            @media (max-width: ${tabletBreakpoint}) {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border: none;
                background: none;
                cursor: pointer;
                padding: 0;
            }
        }

        [part="hamburger-icon"] {
            width: 24px;
            height: 24px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        [part="hamburger-line"] {
            width: 100%;
            height: 2px;
            background: var(--xyd-page-body-color);
            transition: transform 0.3s var(--xyd-cubic-bezier);

            &[data-active="true"] {
                &:first-child {
                    transform: translateY(11px) rotate(45deg);
                }

                &:nth-child(2) {
                    opacity: 0;
                }

                &:last-child {
                    transform: translateY(-11px) rotate(-45deg);
                }
            }
        }

        [part="main"] {
            position: fixed;
            display: flex;
            top: calc(var(--xyd-nav-height) + var(--xyd-header-warning-height));
            bottom: 0;
            left: 0;
            right: 0;
            padding: var(--xyd-page-gutter);
            overflow: hidden;
        }

        &[data-subheader="true"][data-hide-subheader="false"] [part="main"] {
            top: calc(var(--xyd-header-total-height) + var(--xyd-header-warning-height));
        }

        [part="sidebar"] {
            flex: none;
            width: var(--xyd-sidebar-width);
            background: var(--xyd-layout-sidebar-bgcolor);
            display: flex;
            flex-direction: column;
            position: relative;
            height: 100%;

            @media (max-width: ${tabletBreakpoint}) {
                display: none;
            }
        }

        [part="mobile-sidebar"] {
            display: none;

            @media (max-width: ${tabletBreakpoint}) {
                display: flex;
                position: fixed;
                top: 0;
                bottom: 0;
                left: 0;
                width: var(--xyd-sidebar-width--mobile);
                background: var(--xyd-layout-sidebar-bgcolor);
                flex-direction: column;
                z-index: 50;
                transform: translateX(-100%);
                transition: transform .3s var(--xyd-cubic-bezier);
                box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
            }

            &[data-active="true"] {
                @media (max-width: ${tabletBreakpoint}) {
                    transform: translateX(0);
                }
            }
        }

        [part="mobile-sidebar-aside"] {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            height: 100%;
        }

        [part="mobile-sidebar-close-button"] {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            border: none;
            background: none;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        [part="mobile-sidebar-close-icon"] {
            width: 20px;
            height: 20px;
            position: relative;

            &::before,
            &::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                width: 100%;
                height: 2px;
                background: var(--xyd-page-body-color--secondary);
                transform-origin: center;
            }

            &::before {
                transform: rotate(45deg);
            }

            &::after {
                transform: rotate(-45deg);
            }
        }

        [part="mobile-overlay"] {
            display: none;

            @media (max-width: ${tabletBreakpoint}) {
                display: block;
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                background: rgba(0, 0, 0, 0.6);
                transition: opacity .3s;
                opacity: 0;
                pointer-events: none;
                z-index: 40;
                height: 100vh;
            }

            &[data-active="true"] {
                opacity: 1;
                pointer-events: auto;
            }
        }

        [part="page"] {
            position: relative;
            flex: 1;
            background: var(--xyd-page-body-bgcolor);
            overflow: hidden;
            min-width: 0;
            height: 100%;
        }

        [part="page-scroll"] {
            overflow-y: auto;
            height: 100%;
            -webkit-overflow-scrolling: touch;
            padding: 0 48px;

            @media (max-width: ${tabletBreakpoint}) {
                padding: 0 32px;
            }

            @media (max-width: ${mobileBreakpoint}) {
                padding: 0 24px;
            }
        }

        [part="page-container"] {
            max-width: var(--xyd-layout-width-medium);
            margin: 0 auto;
            padding: 0 var(--xyd-page-gutter);
            height: 100%;
        }

        &[data-layout="wide"] [part="page-container"] {
            max-width: var(--xyd-layout-width-large);
        }

        [part="page-article-container"] {
            display: flex;
            gap: 48px;
            padding: 48px 0;
            min-height: 100%;

            @media (max-width: ${tabletBreakpoint}) {
                gap: 32px;
            }

            @media (max-width: ${mobileBreakpoint}) {
                flex-direction: column;
                padding: 24px 0;
                gap: 24px;
            }

        }

        [part="page-article"] {
            flex: 1;
            min-width: 0;
        }

        [part="page-article-content"] {
            width: 100%;
        }

        [part="page-article-nav"] {
            display: flex;
            flex-direction: column;
            gap: 16px;
            flex: none;
            width: var(--xyd-layout-nav-width-medium);
            position: sticky;
            top: 0;
            height: fit-content;
            max-height: 100vh;
            overflow-y: auto;
            padding-right: 24px;
            padding-top: var(--xyd-content-space);

            @media (max-width: ${tabletBreakpoint}) {
                width: var(--xyd-layout-nav-width-small);
                padding-right: 16px;
            }

            @media (max-width: ${mobileBreakpoint}) {
                display: none;
            }
        }
    }
`;

