import {css} from "@linaria/core";

export const HeadingHost = css`
    line-height: 40px;
    font-weight: 600;

    position: relative;
    display: inline-block;
    margin: 0;
    padding: 0 24px 0 0;
    scroll-margin-top: 30px;
    cursor: pointer;

    &:hover {
        svg {
            opacity: 1;
        }
    }
`;

export const HeadingH1 = css`
    font-size: 36px;

    code {
        font-size: 30px;
    }
`;

export const HeadingH2 = css`
    font-size: 30px;

    code {
        font-size: 24px;
    }
`;

export const HeadingH3 = css`
    font-size: 26px;

    code {
        font-size: 22px;
    }
`;

export const HeadingH4 = css`
    font-size: 22px;

    code {
        font-size: 18px;
    }
`;

export const HeadingH5 = css`
    font-size: 18px;

    code {
        font-size: 14px;
    }
`;

export const HeadingH6 = css`
    font-size: 16px;

    code {
        font-size: 12px;
    }
`;

export const HeadingLink = css`
    position: absolute;
    top: 50%;
    right: 0;
    margin-top: -6px;
    opacity: 0;
    color: #7051d4;
    transition: opacity .15s ease;
`;