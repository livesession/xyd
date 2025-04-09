import {css} from "@linaria/core";
import colors from "@livesession/design-system-colors"

export const SidebarHost = css`
    background: ${colors.dark8};
    height: 100%;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
`;

export const SidebarUl = css`
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding: 8px;

    // TODO: get height of top
    //height: calc(100vh - 54px);
`;

export const FooterHost = css`
    padding: 1rem;
    //box-shadow: 0 -2px 10px rgba(0, 0, 0, .06);
    box-shadow: 0 -2px 10px rgba(237, 237, 237, .1);
    //border: 1px solid rgb(227, 227, 235);
    //border-top: 1px solid rgb(227, 227, 235);
    border-top: 1px solid #ededed;
`;

export const FooterItemHost = css`
    display: flex;
    width: 100%;
    padding: 2px;
    color: #6e6e80;
`;

export const FooterItem = css`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 7px;
    font-size: 14px;
    padding: 4px 8px;

    &:hover {
        background: #ececf1;
        color: #111827;
        border-radius: 4px;

        svg {
            fill: #111827;
        }
    }

    svg {
        fill: #6e6e80;
        font-size: 18px;
        width: 18px;
        height: 18px;
    }
`;

export const ItemHost = css`
    color: #6e6e80;
    font-size: 14px;
`;

export const ItemLink = css`
    display: flex;
    width: 100%;
    font-weight: 500;
`;

export const ItemLinkActive = css`
    background: ${colors.dark16};
    border-radius: 4px;
    position: relative;
    font-weight: 600;
    color: ${colors.dark100};
    
    &::before {
        background: #7051d4;
        border-radius: 0 2px 2px 0;
        bottom: 7px;
        content: "";
        left: 5px;
        position: absolute;
        top: 7px;
        width: 4px;
        border-radius: 10px;
    }
`;

export const ItemLinkParentActive = css`
    font-weight: 600;
    background: transparent;
`;

export const ItemLinkActiveSecondary = css`
    background: unset;
    font-weight: 500;
`;

export const ItemLinkItem = css`
    display: flex;
    width: 100%;
    padding: 8px 12px 8px 16px;
    position: relative;
    font-size: 14px;

    &:hover {
        background: #ececf1;
        color: #111827;
        border-radius: 4px;
    }
`;

export const TreeHost = css`
    margin-left: 12px;
`;

export const ItemHeaderHost = css`
    // TODO: calc based on items?
    padding-left: 12px;
    margin-bottom: 8px;
    margin-top: 24px;
    font-size: 13px;
    line-height: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #111827;
    /* text-transform: uppercase; */
`;

