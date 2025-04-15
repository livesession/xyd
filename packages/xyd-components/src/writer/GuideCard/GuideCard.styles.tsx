import { css } from "@linaria/core";

export const GuideHost = css`
    &[data-kind="secondary"] {
        display: flex;
        position: relative;
        overflow: hidden;
        border: 1px solid var(--xyd-guidecard-border-color--secondary);
        background: var(--xyd-guidecard-bgcolor--secondary);
        border-radius: 8px;
        padding: 24px;
        z-index: 0;
        transition: box-shadow .2s ease-in-out, background-image .2s ease;

        &:hover {
            background: var(--xyd-guidecard-bgcolor--secondary-hover);
        }

        &[data-size="md"] {
            padding: 21px 25px 25px;
        }
    }

    [part="link"] {
        width: 100%;
        height: 100%;
    }

    [part="item"] {
        border-radius: 8px;
        display: flex;

        align-items: flex-start;
        cursor: pointer;
        transition: opacity .15s;

        &:hover {
            [part="pointer"] {
                opacity: 1;
                transform: translate(0);
            }
        }
    }
    &[data-kind="secondary"] [part="item"] {
        width: 100%;
        height: 100%;
    }

    [part="icon"] {
        line-height: 0px;
        font-size: 24px;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--xyd-guidecard-icon-color);
        transition: background .2s ease;
        box-sizing: border-box;
        flex-shrink: 0;
    }

    [part="right"] {
        padding-left: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    [part="title"] {
        display: flex;
        color: var(--xyd-guidecard-title-color);
        align-items: center;
        font-weight: 600;
        transition: color .15s;
    }

    [part="title-body"] {
        font-size: 16px;
        line-height: 20px;
    }
    &[data-size="md"] [part="title-body"] {
        font-size: 18px;
    }

    [part="body"] {
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;

        color: var(--xyd-guidecard-color);
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    &[data-size="md"] [part="body"] {
        font-size: 16px;
    }

    [part="pointer"] {
        opacity: 0;
        transform: translate(-4px);
        display: flex;
        justify-content: center;
        transition: opacity .15s ease-in-out, transform .15s ease-in-out;
    }
`;

export const GuideListHost = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: center;
    gap: 24px;
`;