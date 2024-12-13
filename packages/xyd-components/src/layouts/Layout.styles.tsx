import {css} from "@linaria/core";

const globalPageGutter = '8px';
const globalHeaderHeight = '46px';
const globalHeaderWarningHeight = "0px";

const cubicMove = "cubic-bezier(.65, 0, .35, 1)";
const sidebarWidth = "210px";

export const $layout = {
    host: css`
        width: 100%;
    `,
    header: css`
        display: flex;
        justify-content: space-between;
        align-items: center;

        position: fixed;
        top: ${globalHeaderWarningHeight};
        right: ${globalPageGutter};
        left: ${globalPageGutter};

        height: ${globalHeaderHeight}
    `,
    main: css`
        position: fixed;
        top: calc(${globalHeaderHeight} + ${globalHeaderWarningHeight});
        bottom: ${globalPageGutter};
        left: ${globalPageGutter};
        right: ${globalPageGutter};
    }
    `,
    sidebar: css`
        flex-direction: column;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 101;
        width: ${sidebarWidth};
        border: 0;
        padding: 14px 0 0;
        overflow: visible;
        background: none;
        border-radius: 0;
        opacity: 1;
        visibility: visible;
        transition: opacity .3s ${cubicMove};
    `,
}

export const $page = {
    host: css`
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 201;
        background: #fff;

        //border-radius: 8px;
        //border: 1px solid #ececf1;
        
        overflow: hidden;
        transition: opacity .3s ${cubicMove};

        left: ${sidebarWidth};
    `,
    scroll: css`
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        overflow: auto;
    `,
    container: css`
        padding: 0;
        width: 100%;
        position: relative;
        min-height: 100%;

        max-width: 100%;
        margin: 0 auto;
        font-size: 15px;
        line-height: 24px;
    `,
    articleContainer: css`
        width: 980px;
        padding: 40px 56px;
        max-width: 100%;
        margin: 0 auto;
    `
}

export const $article = {
    host: css`
        display: flex;
        width: 100%;
        align-items: flex-start;;
    `,
    content: css`
        flex: 1 1 0;
        overflow: hidden;
    `,
    nav: css`
        position: sticky;
        top: 50px;
        width: 180px;
        margin-top: 0;
        margin-left: 50px;
        padding-left: 16px;
        flex: none;
    `
}