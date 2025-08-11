import { css } from "@linaria/core";

export const globals = css`
    :global() {
        @layer themedecorator {
            xyd-layout-primary[data-layout="page"] {
                [part="page-article-content"] {
                    height: 100%;
                }
            }
            @media (min-width: 1024px) {
                xyd-layout-primary[data-layout="page"] {
                    grid-template-rows: auto 1fr auto;
                    grid-template-columns: 1fr;
                    width: 100%;
                    height: max-content;
                    min-height: 100%;
                    display: grid;
                }
            }
            
            body:has(xyd-layout-primary[data-layout="page"]) {
                height: 100%;
            }
            html:has(body xyd-layout-primary[data-layout="page"]) {
                height: 100%;
            }
            
            [data-color-scheme="dark"] {
                --page-first-slide-special-text-color: var(--xyd-heading-color, #fff);
            }
            @media (prefers-color-scheme: dark) {
                --page-first-slide-special-text-color: var(--xyd-heading-color, #fff);
            }
            @media (prefers-color-scheme: dark) {
                :root:not([data-color-scheme="light"]):not([data-color-scheme="dark"]) {
                    --page-first-slide-special-text-color: var(--xyd-heading-color, #fff);
                }
            }
        }
    }
`

export const PageFirstSlide = css`
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 60px;
    align-items: center;
    max-width: var(--page-first-slide-container-width, var(--page-home-container-width, 1200px));
    margin: 0 auto;
    padding: 50px;
    height: 100%;

    [part="left"] {
        display: flex;
        flex-direction: column;
        gap: 24px;

        h1 {
            --special-text-color: var(--page-first-slide-special-text-color, #353535);
            background-image: linear-gradient(180deg, var(--special-text-color) 0%, 
        color-mix(in oklab, var(--special-text-color) 80%, transparent) 100%);
            background-clip: text;
            -webkit-text-fill-color: transparent;
            -webkit-background-clip: text;
            font-size: var(--xyd-font-size-3xl);
            line-height: var(--xyd-line-height-3xl);
        }
    }

    [part="buttons"] {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 16px;

        [data-button="true"] {
            width: 100%;
        }
    }

    [part="right"] {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;

        img {
            max-width: 100%;
            height: auto;
        }

        pre {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
        }
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 40px;
        padding: 40px 20px;
        min-height: auto;

        [part="left"] {
            order: 1;
            text-align: center;
        }

        [part="right"] {
            order: 2;
            min-height: 300px;
        }

        [part="buttons"] {
            align-items: center;

            [data-button="true"] {
                width: 100%;
                max-width: 300px;
            }
        }
    }

    xyd-codetabs {
        width: 100%;
    }

    @media (max-width: 480px) {
        padding: 20px 16px;
        gap: 32px;
    }
`; 