import { css } from "@linaria/core";

export default {
    ContentDecoratorHost: css`
        @layer components {
            --space-medium: 16px;
            --space-large: 20px;
            --space-xlarge: 24px;
            --space-xxlarge: 32px;

            font-size: var(--xyd-font-size-medium);
            line-height: var(--xyd-line-height-medium);

            p:not(li p):not(ul p):not(xyd-callout p):not(xyd-codetabs p):not(xyd-guidecard p) {
                margin-top: var(--space-medium);
            }
            
            h1,h2,h3,h4,h5,h6 {
                &[data-kind="muted"] {
                    display: block;
                }
            }
            h2 {
                margin-top: var(--space-large);
            }
            h3 {
                margin-top: var(--space-medium);
            }
            
            ul:not(xyd-underlinenav ul), ol:not(xyd-underlinenav ol) {
                margin-top: var(--space-medium);
            }
            
            xyd-codetabs, xyd-callout, xyd-guidecard {
                margin: var(--space-large) 0;
            }

            xyd-callout {
                --xyd-font-size-medium: var(--xyd-font-size-small);
                --xyd-line-height-medium: var(--xyd-line-height-small);
            }
        }
    `
}
