import { css } from "@linaria/core";

export const TextHost = css`
    @layer defaults {
        display: inline-block;
        margin: 0;

        &[data-size="xsmall"] { 
            font-size: var(--xyd-font-size-xsmall);
            line-height: var(--xyd-line-height-xsmall);
        }
        &[data-size="small"] { 
            font-size: var(--xyd-font-size-small);
            line-height: var(--xyd-line-height-small);
        }
        &[data-size="medium"] { 
            font-size: var(--xyd-font-size-medium);
            line-height: var(--xyd-line-height-medium);
        }
        &[data-size="large"] { 
            font-size: var(--xyd-font-size-large);
            line-height: var(--xyd-line-height-large);
        }
        &[data-size="xlarge"] { 
            font-size: var(--xyd-font-size-xlarge);
            line-height: var(--xyd-line-height-xlarge);
        }
        &[data-size="xxlarge"] { 
            font-size: var(--xyd-font-size-xxlarge);
            line-height: var(--xyd-line-height-xxlarge);
        }

        &[data-kind="default"] { 
            color: var(--xyd-text-color--default);
        }
        &[data-kind="ghost"] { 
            color: var(--xyd-text-color--ghost);
        }
        &[data-kind="success"] { 
            color: var(--xyd-text-color--success);
        }
        &[data-kind="warn"] { 
            color: var(--xyd-text-color--warn);
        }
        &[data-kind="error"] { 
            color: var(--xyd-text-color--error);
        }
        &[data-kind="primary"] { 
            color: var(--xyd-text-color--primary);
        }
        &[data-kind="secondary"] { 
            color: var(--xyd-text-color--secondary);
        }

        &[data-weight="normal"] { 
            font-weight: var(--xyd-font-weight-normal);
        }
        &[data-weight="bold"] { 
            font-weight: var(--xyd-font-weight-medium);
        }
        &[data-weight="extra-bold"] { 
            font-weight: var(--xyd-font-weight-semibold);
        }
    }
`;

