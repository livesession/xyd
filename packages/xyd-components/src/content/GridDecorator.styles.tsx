import { css } from "@linaria/core";

export default {
    GridDecoratorHost: css`
        @layer components {
            display: grid;
            gap: 1rem;
            width: 100%;

            /* First level ul - 1fr */
            > ul {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1rem;
                width: 100%;
            }

            /* Nested ul - 2fr */
            ul ul {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
                width: 100%;
            }

            @media (max-width: 768px) {
                > ul {
                    gap: 0;
                }
                ul ul {
                    grid-template-columns: 1fr;
                }
            }

            ul, ol, li {
                &::before {
                    content: none;
                }
            }

            ul, ol {
                display: grid;
                margin: 0;
                padding: 0 !important;
                list-style: none;
            }

            li {
                margin-left: 0 !important;
                padding-left: 0 !important;
            }
        }
    `
}
