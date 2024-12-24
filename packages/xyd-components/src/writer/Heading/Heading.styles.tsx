import {css} from "@linaria/core";

export const $heading = {
    host: css`
        line-height: 40px;
        font-weight: 300;
        color: #202123;

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
    `,
    h1: css`
        font-size: 36px;

        code {
            font-size: 30px;
        }
    `,
    h2: css`
        font-size: 30px;

        code {
            font-size: 24px;
        }
    `,
    h3: css`
        font-size: 26px;

        code {
            font-size: 22px;
        }
    `,
    h4: css`
        font-size: 22px;

        code {
            font-size: 18px;
        }
    `,
    h5: css`
        font-size: 18px;

        code {
            font-size: 14px;
        }
    `,
    h6: css`
        font-size: 16px;

        code {
            font-size: 12px;
        }
    `,
    link: css`
        position: absolute;
        top: 50%;
        right: 0;
        margin-top: -6px;
        opacity: 0;
        color: #7051d4;
        transition: opacity .15s ease;
    `

}