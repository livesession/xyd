import {css} from "@linaria/core";
import colors from "@livesession/design-system-colors"

export const GuideHost = css``;

export const GuideHostSecondary = css`
    //flex-grow: 1;
    //width: 100%;
    display: flex;
    position: relative;
    overflow: hidden;
    border: 1px solid ${colors.dark16};
    background: ${colors.dark8};
    border-radius: 8px;
    padding: 24px;
    z-index: 0;
    transition: box-shadow .2s ease-in-out, background-image .2s ease;

    &:hover {
        background: ${colors.white};
    }
`;

export const GuideHostSecondaryMd = css`
    padding: 21px 25px 25px;
`;

export const GuideLink = css`
    width: 100%;
    height: 100%;
`;

export const GuideItem = css`
    border-radius: 8px;
    display: flex;

    align-items: flex-start;
    cursor: pointer;
    transition: opacity .15s;

    &:hover {
        [data-pointer="true"] {
            opacity: 1;
            transform: translate(0);
        }
    }
`;

export const GuideItemSecondary = css`
    width: 100%;
    height: 100%;
`;

export const GuideIcon = css`
    line-height: 0px;
    font-size: 24px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #000;
    transition: background .2s ease;
    box-sizing: border-box;
    flex-shrink: 0;
`;

export const GuideRight = css`
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const GuideTitle = css`
    display: flex;
    color: #000;
    font-weight: 600;
    align-items: center;
    transition: color .15s;
`;

export const GuideTitleBody = css`
    font-size: 16px;
    line-height: 20px;
`;

export const GuideTitleBodyMd = css`
    font-size: 18px;
`;

export const GuideBody = css`
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;

    color: ${colors.dark80};
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const GuideBodyMd = css`
    font-size: 16px;
`;

export const GuidePointer = css`
    opacity: 0;
    transform: translate(-4px);
    display: flex;
    justify-content: center;
    transition: opacity .15s ease-in-out, transform .15s ease-in-out;
`;

export const GuideListHost = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: center;
    gap: 24px;
`;