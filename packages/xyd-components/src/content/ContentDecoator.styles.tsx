import { css } from "@linaria/core";

export default {
    ContentDecoratorHost: css`
        @layer components {
            --space-small: 8px;
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
                    margin: 0;
                }
            }
            
            h2,h3,h4,h5,h6 {
                margin-top: var(--space-xxlarge);
                &[data-kind="muted"] {
                    display: block;
                }
            }
            h4 {
                &[data-kind="muted"] {
                    margin: 4px 0 16px;
                }
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
            xyd-guidecard [part="body"]  {
                color: var(--dark48);
                font-size: var(--xyd-font-size-small);
                line-height: var(--xyd-line-height-medium);

                p {
                    color: var(--dark48);
                    font-size: var(--xyd-font-size-small);
                    line-height: var(--xyd-line-height-medium);
                }
            }
            xyd-guidecard-list xyd-guidecard {
                margin-bottom: 0;
            }
            xyd-tabs [part="buttons"] {
                font-size: var(--xyd-font-size-small);
                line-height: var(--xyd-line-height-small);
            }

            xyd-callout {
                --xyd-font-size-medium: var(--xyd-font-size-small);
            }
        
            xyd-codetabs {
                xyd-code-pre {
                    font-size: var(--xyd-font-size-xsmall);
                    line-height: var(--xyd-line-height-xsmall);
                }
            }
        }
    `
}
