import { css } from "@linaria/core";

export const SearchButtonFullWidth = css`
    [data-desktop]:has(xyd-nav-item xyd-search-button) {
        width: 100%;
    }

    xyd-nav-item:has(xyd-search-button) {
        flex: 1;
    }
`
