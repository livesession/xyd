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
            
            p {
                display: block;

                code {
                    font-size: var(--xyd-font-size-small);
                    line-height: var(--xyd-line-height-small);
                }
            }
            
            h2,h3,h4,h5,h6 {
                display: table;
                &[data-kind="muted"] {
                    display: block;
                }
            }
            h1 {
                display: flex;
                align-items: center;
                gap: 10px;
                
                xyd-badge {
                    font-size: var(--xyd-font-size-xsmall);
                    line-height: var(--xyd-line-height-xsmall);
                    letter-spacing: 2px;
                }
            }
            h2 {
                margin-top: var(--space-large);
            }
            h3 {
                margin-top: var(--space-medium);
            }
            
            details summary {
                [part="summary-deep"], [part="summary-deep-label"] {
                    font-size: var(--xyd-font-size-small);
                    line-height: var(--xyd-line-height-small);
                }
                [part="summary-deep-label"] {
                    font-weight: bold;
                }
            }
            
            ul:not(xyd-underlinenav ul), ol:not(xyd-underlinenav ol) {
                margin-top: var(--space-medium);
            }
            
            xyd-codetabs, xyd-callout, xyd-guidecard, xyd-tabs {
                margin: var(--space-large) 0;
            }
            xyd-tabs [part="buttons"] {
                font-size: var(--xyd-font-size-small);
                line-height: var(--xyd-line-height-small);
            }

            xyd-callout {
                --xyd-font-size-medium: var(--xyd-font-size-small);
                --xyd-line-height-medium: var(--xyd-line-height-small);
            }

            xyd-codetabs {
                font-size: var(--xyd-font-size-small);
                line-height: var(--xyd-line-height-small);
            }
        }
    `
}
