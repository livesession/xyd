import {css} from "@linaria/core";

const globalPageGutter = '8px';
export const globalHeaderHeight = '46px';
const globalHeaderWarningHeight = "0px";
const contentTopSpace = "12px";

const globalHeaderHeightWithSub = '90px';

const cubicMove = "cubic-bezier(.65, 0, .35, 1)";
const sidebarWidth = "300px";

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

export const $layout = {
    host: css`
        width: 100%;
        overflow-x: hidden;
        background: #fff;
    `,
    header: css`
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
    `,
    primaryHeaderContent: css`
        display: flex;
        align-items: center;
        width: 100%;
    `,
    header$$sub: css`
        flex-direction: column;
        height: ${globalHeaderHeightWithSub};
        transition: transform 200ms;
    `,
    header$$hideMain: css`
        transform: translateY(calc(-${globalHeaderHeight} + 3px));
    `,
    hamburgerButton: css`
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
    `,
    hamburgerIcon: css`
        width: 24px;
        height: 24px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    `,
    hamburgerLine: css`
        width: 100%;
        height: 2px;
        background: #000;
        transition: transform 0.3s ${cubicMove};
    `,
    hamburgerLine$$open: css`
        &:first-child {
            transform: translateY(11px) rotate(45deg);
        }
        &:nth-child(2) {
            opacity: 0;
        }
        &:last-child {
            transform: translateY(-11px) rotate(-45deg);
        }
    `,
    main: css`
        position: fixed;
        display: flex;
        top: calc(${globalHeaderHeight} + ${globalHeaderWarningHeight});
        bottom: ${globalPageGutter};
        left: ${globalPageGutter};
        right: ${globalPageGutter};
        margin-top: ${globalPageGutter};
    `,
    main$$sub: css`
        top: calc(${globalHeaderHeightWithSub} + ${globalHeaderWarningHeight});
        transition: top 200ms;
    `,
    staticSidebar: css`
        flex: none;
        width: ${sidebarWidth};
        background: #fff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        
        @media (max-width: 768px) {
            display: none;
        }
    `,
    mobileSidebar: css`
        display: none;

        @media (max-width: 768px) {
            display: flex;
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: ${sidebarWidth};
            background: #fff;
            flex-direction: column;
            overflow: hidden;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform .3s ${cubicMove};
            box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
        }
    `,
    mobileSidebar$$open: css`
        transform: translateX(0);
    `,
    sidebarContent: css`
        flex: 1;
        overflow-y: auto;
    `,
    closeButton: css`
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
    `,
    searchInput: css`
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
    `,
    closeIcon: css`
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
    `,
    overlay: css`
        display: none;

        @media (max-width: 768px) {
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
        }
    `,
    overlay$$visible: css`
        opacity: 1;
        pointer-events: auto;
    `
}

export const $page = {
    host: css`
        position: relative;
        top: ${contentTopSpace};
        flex: 1;
        background: #fff;
        overflow: hidden;
        min-width: 0;
    `,
    scroll: css`
        overflow-y: auto;
        height: 100%;
        -webkit-overflow-scrolling: touch;
        padding: 0 48px;

        @media (max-width: 1024px) {
            padding: 0 32px;
        }

        @media (max-width: 768px) {
            padding: 0 24px;
        }
    `,
    container: css`
        padding: 40px 0;
        width: 100%;
        max-width: 965px;
        margin: 0 auto;
        font-size: 15px;
        line-height: 24px;

        @media (max-width: 768px) {
            padding: 24px 0;
        }
    `,
    container$$large: css`
        max-width: 1200px;
    `,
    articleContainer: css`
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
    `,
}

export const $article = {
    host: css`
        display: flex;
        gap: 64px;
        width: 100%;
        align-items: flex-start;
        box-sizing: border-box;

        @media (max-width: 1024px) {
            gap: 48px;
        }

        @media (max-width: 768px) {
            flex-direction: column;
            gap: 32px;
        }
    `,
    content: css`
        flex: 1;
        min-width: 0;
        max-width: 100%;
    `,
    nav: css`
        position: sticky;
        top: 24px;
        width: 200px;
        min-width: 200px;
        flex: none;
        padding-left: 24px;

        @media (max-width: 1024px) {
            display: none;
            width: 180px;
            min-width: 180px;
            padding-left: 16px;
        }

        @media (max-width: 768px) {
            display: block;
            position: static;
            width: 100%;
            min-width: 100%;
            padding-left: 0;
            padding-top: 24px;
            border-top: 1px solid #eaeaea;
        }
    `
}