import {css} from "@linaria/core";

export const CodeCopyHost = css`
    display: flex;
    align-items: center;
    justify-content: center;

    padding: 8px;

    border-radius: 6px;

    cursor: pointer;

    &:hover {
        background: var(--XydAtlas-Component-Code-Copy__color-background--active);
    }
`; 