import {css} from "@linaria/core";

export const $ul = {
    host: css`
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        gap: 16px;

        padding: 0;
        margin: 0;

        list-style: none;

        border: none;
    `,
}

export const $li = {
    host: css`
        margin: 0;
        padding: 0;

        &:first-child {
            padding-top: 0;
        }

        &:last-child {
            padding-bottom: 0;
        }
    `,
}

export const $description = {
    host: css`
        font-size: 14px;
        line-height: 22px;
        color: var(--XydAtlas-Component-ApiRef-Properties__color-description);
    `
}

export const $dl = {
    host: css`
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 10px;

        margin: 8px 0;

        dd {
            margin-inline-start: 0px;
        }
    `,
}

export const $propNameCode = {
    host: css`
        display: inline-flex;

        padding: 4px 0;

        font-weight: 600;
        font-size: 13px;
        color: var(--XydAtlas-Component-ApiRef-Properties__color-propName);
    `,
}

export const $propTypeCode = {
    host: css`
        display: inline-flex;

        padding: 4px 0;

        border-radius: 4px;

        font-size: 10px;
        color: var(--XydAtlas-Component-ApiRef-Properties__color-propType);
    `,
    link: css`
        color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
        text-decoration: underline;
        
        &:hover {
            text-decoration: none;
            color: var(--XydAtlas-Sys-Color-Primary--hover);
        }
    `
}

export const $subProps = {
    host: css`
        padding: 8px;
        border-style: none;
        display: none;
    `,
    host$$expanded: css`
        display: unset;
    `,
    box: css`
    `,
    ul: css`
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        gap: 16px;

        padding: 0;
        margin: 0;

        list-style: none;

        border: none;
        border-left: 1px solid var(--XydAtlas-Component-ApiRef-Properties__color-border);
    `,
    li: css`
        padding: 0 16px;
    `,
}

export const $propToggle = {
    host: css`
        display: flex;
        align-items: center;
        padding: 0;
        margin-top: 16px;

        background: none;
        outline: inherit;
        border: none;

        cursor: pointer;
        color: inherit;

        font-size: 13px;

        svg {
            font-size: 13px;
        }

        &:hover {
            svg {
                transition: all ease-in .1s;
                color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
            }
        }
    `,
    link: css`
        text-decoration: none;
        cursor: pointer;
        margin-left: 4px;

        &:hover {
            transition: all ease-in .1s;
            color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
        }
    `
}