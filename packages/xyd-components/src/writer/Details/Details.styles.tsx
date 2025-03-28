import {css} from "@linaria/core";

export const $details = {
    host: css`
        border-top: 1px solid #ececf1;

        &[open] summary svg[data-icon="true"] { // TODO: bad solution
            transform: rotate(90deg);
        }
    `,
    host$$secondary: css`
        background-color: #f7f7f8;
        border: 1px solid #ececf1;
        border-radius: 8px;
    `,
    summary: css`
        padding: 16px 14px 16px 0;
        font-size: 18px;
        cursor: pointer;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
        transition: color 0.3s;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        list-style: none;

        &:hover {
            color: #565869;
        }
    `,
    summary$$secondary: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 20px 24px;
    `,
    summary$$tertiary: css`
        padding: 10px 24px;
    `,
    summaryDeep: css`
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    `,
    summaryDeep$text: css`
        color: #6e6e80;
        text-transform: uppercase;
        font-size: 12px;
        line-height: 16px;
        letter-spacing: .08em;
        margin-left: 8px;
        font-weight: 700;
    `,
    summaryDeep$text$$tertiary: css`
        text-transform: none;
        
        code {
            background: white;
        }
    `,
    label: css`
        flex: 1 1 auto;
    `,
    label$$tertriary: css`
        padding: 10px;
    `,
    icon: css`
        flex: 0 0 auto;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-right: 6px;
    `,
    content: css`
        padding: 0 24px 20px;
    `,
    content$$secondary: css`
        // TODO: also bad

        code {
            background: white;
        }
    `,
    content$$tertiary: css`
        background: white;
        padding-top: 20px;
    `
}