import {css} from "@linaria/core";

const globalPageGutter = '8px';
export const globalHeaderHeight = '50px';
const globalHeaderWarningHeight = "0px";
const contentTopSpace = "12px";

const globalHeaderHeightWithSub = '94px';

const cubicMove = "cubic-bezier(.65, 0, .35, 1)";
const sidebarWidth = "250px";

const tabletBreakpoint = '1024px';
const mobileBreakpoint = '768px';

// TODO: better solution - design tokens
export const globals = css`
    :global() {
        :root {
            --xyd-navbar-height: ${globalHeaderHeight};
            --xyd-global-page-gutter: ${globalPageGutter};
            --xyd-sidebar-width: ${sidebarWidth};
        }
    }
`;

export const LayoutPrimaryHost = css`
    width: 100%;
    overflow-x: hidden;
    background: #fff;
`;

export const LayoutPrimaryHeader = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    top: ${globalHeaderWarningHeight};
    right: ${globalPageGutter};
    left: ${globalPageGutter};
    height: ${globalHeaderHeight};
    z-index: 20;
    background: #fff;

    @media (max-width: 768px) {
        padding: 0;
    }
`;

export const LayoutPrimaryHeaderContent = css`
    display: flex;
    align-items: center;
    width: 100%;
`;

export const LayoutPrimaryHeaderSub = css`
    flex-direction: column;
    height: ${globalHeaderHeightWithSub};
    transition: transform 200ms;
`;

export const LayoutPrimaryHeaderHideMain = css`
    transform: translateY(calc(-${globalHeaderHeight} + 3px));
`;

export const LayoutPrimaryHamburgerButton = css`
    display: none;

    @media (max-width: 768px) {
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
`;

export const LayoutPrimaryHamburgerIcon = css`
    width: 24px;
    height: 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const LayoutPrimaryHamburgerLine = css`
    width: 100%;
    height: 2px;
    background: #000;
    transition: transform 0.3s ${cubicMove};
`;

export const LayoutPrimaryHamburgerLineOpen = css`
    &:first-child {
        transform: translateY(11px) rotate(45deg);
    }
    &:nth-child(2) {
        opacity: 0;
    }
    &:last-child {
        transform: translateY(-11px) rotate(-45deg);
    }
`;

export const LayoutPrimaryMain = css`
    position: fixed;
    display: flex;
    top: calc(${globalHeaderHeight} + ${globalHeaderWarningHeight});
    bottom: 0;
    left: 0;
    right: 0;
    padding: ${globalPageGutter};
    overflow: hidden;

    @media (max-width: ${tabletBreakpoint}) {
        padding-top: calc(${globalHeaderHeight} + ${globalHeaderWarningHeight} + ${globalPageGutter});
    }
`;

export const LayoutPrimaryMainSub = css`
    top: calc(${globalHeaderHeightWithSub} + ${globalHeaderWarningHeight});

    @media (max-width: ${tabletBreakpoint}) {
        padding-top: calc(${globalHeaderHeightWithSub} + ${globalHeaderWarningHeight} + ${globalPageGutter});
    }
`;

export const LayoutPrimaryStaticSidebar = css`
    flex: none;
    width: ${sidebarWidth};
    background: #fff;
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;
    
    @media (max-width: ${tabletBreakpoint}) {
        display: none;
    }
`;

export const LayoutPrimaryMobileSidebar = css`
    display: none;

    @media (max-width: ${tabletBreakpoint}) {
        display: flex;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: ${sidebarWidth};
        background: #fff;
        flex-direction: column;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform .3s ${cubicMove};
        box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
    }
`;

export const LayoutPrimaryMobileSidebarOpen = css`
    @media (max-width: ${tabletBreakpoint}) {
        transform: translateX(0);
    }
`;

export const LayoutPrimarySidebarContent = css`
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    height: 100%;
`;

export const LayoutPrimaryCloseButton = css`
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
`;

export const LayoutPrimarySearchInput = css`
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #eaeaea;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #666;
    }
`;

export const LayoutPrimaryCloseIcon = css`
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
        background: #666;
        transform-origin: center;
    }

    &::before {
        transform: rotate(45deg);
    }

    &::after {
        transform: rotate(-45deg);
    }
`;

export const LayoutPrimaryOverlay = css`
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
`;

export const LayoutPrimaryOverlayVisible = css`
    opacity: 1;
    pointer-events: auto;
`;

export const LayoutPrimaryPageHost = css`
    position: relative;
    flex: 1;
    background: #fff;
    overflow: hidden;
    min-width: 0;
    height: 100%;
`;

export const LayoutPrimaryPageScroll = css`
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
`;

export const LayoutPrimaryPageContainer = css`
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 ${globalPageGutter};
`;

export const LayoutPrimaryPageContainerLarge = css`
    max-width: 1200px;
`;

export const LayoutPrimaryPageArticleContainer = css`
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
`;

export const LayoutPrimaryArticleHost = css`
    flex: 1;
    min-width: 0;
`;

export const LayoutPrimaryArticleContent = css`
    width: 100%;
`;

export const LayoutPrimaryArticleNav = css`
    flex: none;
    width: 256px;
    position: sticky;
    top: 0;
    height: fit-content;
    max-height: 100vh;
    overflow-y: auto;
    padding-right: 24px;
    padding-top: ${contentTopSpace};

    @media (max-width: ${tabletBreakpoint}) {
        width: 200px;
        padding-right: 16px;
    }

    @media (max-width: ${mobileBreakpoint}) {
        width: 100%;
        position: static;
        max-height: none;
        padding-right: 0;
    }
`;