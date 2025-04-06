import {css} from "@linaria/core";

const globalPageGutter = '8px';
export const globalHeaderHeight = '40px';
const globalHeaderWarningHeight = "0px";
const contentTopSpace = "12px";

const globalHeaderHeightWithSub = '94px';

const cubicMove = "cubic-bezier(.65, 0, .35, 1)";
const sidebarWidth = "210px";

// TODO: better solution - design tokens
export const globals = css`
    :global() {
        :root {
            --xyd-navbar-height: ${globalHeaderHeight};
            --xyd-global-page-gutter: ${globalPageGutter};
        }
    }
`;

export const LayoutHost = css`
    width: 100%;
`;

export const LayoutHeader = css`
    display: flex;
    justify-content: space-between;
    align-items: center;

    position: fixed;
    top: ${globalHeaderWarningHeight};
    right: ${globalPageGutter};
    left: ${globalPageGutter};

    height: ${globalHeaderHeight};
`;

export const LayoutHeaderSub = css`
    flex-direction: column;
    height: ${globalHeaderHeightWithSub};
    transition: transform 200ms;
`;

export const LayoutHeaderHideMain = css`
    transform: translateY(calc(-${globalHeaderHeight} + 3px));
`;

export const LayoutMain = css`
    position: fixed;
    top: calc(${globalHeaderHeight} + ${globalHeaderWarningHeight});
    bottom: ${globalPageGutter};
    left: ${globalPageGutter};
    right: ${globalPageGutter};
}`;

export const LayoutMainSub = css`
    top: calc(${globalHeaderHeightWithSub} + ${globalHeaderWarningHeight});
    transition: top 200ms;
`;

export const LayoutSidebar = css`
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 101;
    width: ${sidebarWidth};
    border: 0;
    padding: ${contentTopSpace} 0 0;
    overflow: visible;
    background: none;
    border-radius: 0;
    opacity: 1;
    visibility: visible;
    transition: opacity .3s ${cubicMove};
`;

export const PageHost = css`
    position: absolute;
    top: ${contentTopSpace};
    right: 0;
    bottom: 0;
    z-index: 201;
    background: #fff;

    //border-radius: 8px;
    //border: 1px solid #ececf1;

    overflow: hidden;
    transition: opacity .3s ${cubicMove};

    left: ${sidebarWidth};
`;

export const PageScroll = css`
    //position: absolute;
    //top: 0;
    //right: 0;
    //bottom: 0;
    //left: 0;
    //overflow: auto;

    overflow: scroll;
    height: 100%;
`;

export const PageContainer = css`
    padding: 0;
    width: 100%;
    //position: relative; TODO: unset if during client render?
    min-height: 100%;

    max-width: 100%;
    margin: 0 auto;
    font-size: 15px;
    line-height: 24px;
`;

export const PageArticleContainer = css`
    width: 980px;
    padding: 40px 56px;
    padding-top: 20px;
    max-width: 100%;
    margin: 0 auto;
`;

export const PageArticleContainerFullWidth = css`
    width: 1200px;
`;

export const ArticleHost = css`
    display: flex;
    gap: 30px;
    width: 100%;
    align-items: flex-start;;
`;

export const ArticleContent = css`
    flex: 1 1 0;
    overflow: hidden;
`;

export const ArticleNav = css`
    position: sticky;
    top: 30px;
    width: 180px;
    margin-top: 0;
    margin-left: 50px;
    padding-left: 16px;
    flex: none;
`;