import {css} from "@linaria/core";

export const NavHost = css`
    position: sticky;
    top: 0;
    z-index: 20;
    width: 100%;
    background: transparent;
    display: flex;
`;

export const NavShadow = css`
    pointer-events: none;
    position: absolute;
    z-index: -1;
    height: 100%;
    width: 100%;
    background-color: white;
`;

export const Nav = css`
    display: flex;
    width: 100%;
    height: var(--xyd-navbar-height);
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding-left: calc(max(env(safe-area-inset-left), 16px));
    padding-right: calc(max(env(safe-area-inset-right), 16px));
`;

export const NavMiddle = css`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
`;

export const ListHost = css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

export const ItemHost = css`
    font-size: 14px; /* 0.875rem */
    position: relative;
    white-space: nowrap;
    color: #000;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        color: #1f2937; /* Gray-800 */
    }

    &[data-state="active"] {
        font-weight: bold;
        background: #f9f9f9;
        border-radius: 8px;
    }
`;

export const ItemTitle1 = css`
    position: absolute;
    inset: 0;
    text-align: center;
    align-items: center;
    display: flex;
    justify-content: center;
`;

export const ItemTitle2 = css`
    visibility: hidden;
    font-weight: 600;
`;

export const LogoHost = css`
    display: flex;
    align-items: center;
    margin-right: auto;
`;