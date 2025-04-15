import { css } from "@linaria/core";

export default {
    ContentDecoratorHost: css`
        @layer components {
            xyd-text:not(li xyd-text):not(ul xyd-text):not(xyd-callout xyd-text) {
                margin-top: 1rem;
            }

            xyd-heading {
                display: block;

                h2 {
                    margin-top: 1.5rem;
                }
                h3 {
                    margin-top: 1rem;
                }
            }

            xyd-codetabs, xyd-callout {
                margin: 20px 0;
                display: block;
            }
        }
    `
}
