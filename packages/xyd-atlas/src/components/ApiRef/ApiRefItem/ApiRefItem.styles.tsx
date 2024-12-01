import {css} from "@linaria/core";

export const $title = {
    host: css`
        font-size: 30px;
        font-weight: 400;
    `,
    link: css`
    `,
}

export const $navbar = {
    host: css`
    `,
    container: css`
        background: linear-gradient(45deg, rgb(247, 247, 248) 0%, rgb(247, 247, 248) 100%);

        padding: 8px;

        border: 1px solid rgb(236, 236, 241);
        border-radius: 8px;
        
        font-size: 13px;
    `,
    label: css`
        color: #6e6e80;
        
        margin-right: 4px;
    `,
}

export const $refItem = {
    host: css`
        display: flex;
        flex-direction: column;
        gap: 16px;

        padding-bottom: 25px;
    `,
    grid: css`
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: flex-start;
        gap: 100px;
    `,
}

export const $properties = {
    host: css`

    `,
    item: css`
        display: flex;
        flex-direction: column;
        gap: 25px;

        margin-bottom: 25px;
    `,
}

export const $subtitle = {
    host: css`
        font-size: 15px;
        font-weight: 600;
    `,
    link: css`
        text-decoration: none;
    `,
}

