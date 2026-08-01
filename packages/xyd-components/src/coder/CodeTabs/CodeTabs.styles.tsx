import { css } from "@linaria/core";

export const CodeTabsHost = css`
    display: grid;
`

export const CodeTabsRoot = css`
    @layer defaults {
        overflow: hidden;
        min-width: 0;

        border: 1px solid var(--xyd-codetabs-border-color);
        border-radius: 16px;

        &[data-single="true"] [part="pre"] {
            border: none;
        }

        &[data-nodescription="true"] {
            xyd-codetabs-languages [part="languages-list"] {
                justify-content: flex-start;
            }
        }
    }
`;

export const CodeTabsLanguagesHost = css`
    @layer defaults {
        --codetabs-color: var(--user-codetabs-color, var(--xyd-codetabs-color));
        --codetabs-color--active: var(--user-codetabs-color--active, var(--xyd-codetabs-color--active));
        --codetabs-color--hover: var(--user-codetabs-color--hover, var(--xyd-codetabs-color--hover));

        position: relative;
        display: flex;
        justify-content: space-between;
        flex: 1 1 0%;

        background: var(--user-codetabs-bgcolor, var(--xyd-codetabs-bgcolor));
        
        border-top-right-radius: 10px;
        border-top-left-radius: 10px;
        border-bottom: 0px;

        min-width: 0;

        font-weight: var(--xyd-font-weight-semibold);
        font-size: var(--xyd-font-size-xsmall);

        &[data-single="true"] {
            height: 0;
        }

        [part="description"] {
            display: flex;
            flex: 1;
            align-items: center;
            gap: 4px;

            color: var(--codetabs-color);
            
            margin-left: 4px;
            margin-right: 4px;
        }

        [part="description-item"] {
            display: flex;
            padding-left: 16px;
            padding-right: 16px;
            flex: 1 1 0%;
            gap: 16px;
            border-radius: 4px;
        }

        [part="copy"] {
            display: none;
        }

        [part="languages-list"] {
            display: flex;
            gap: 8px;
            padding: 0 10px;
            overflow: auto;
        }

        [part="language-trigger"] {
            all: unset;

            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 6px;
            padding: 6px;

            color: var(--codetabs-color);
            
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;

            border-bottom: 1px solid transparent;

            &[data-state="active"] {
                color: var(--codetabs-color--active);
                border-bottom-color: var(--codetabs-color--active);
            }
            
            &:hover {
                transition: ease-in 0.1s;
                background: var(--codetabs-color--hover);
            }
        }

        &[data-dropdown="true"] {
            align-items: center;
        }

        [part="language-select-trigger"] {
            all: unset;
            box-sizing: border-box;

            cursor: pointer;

            display: inline-flex;
            align-items: center;
            gap: 6px;

            margin: 6px 10px;
            padding: 4px 8px;
            border-radius: 6px;

            color: var(--codetabs-color--active);

            font-weight: var(--xyd-font-weight-semibold);
            font-size: var(--xyd-font-size-xsmall);

            &:hover {
                transition: ease-in 0.1s;
                background: var(--codetabs-color--hover);
            }
        }

        [part="language-select-value"] {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        [part="language-select-arrow"] {
            display: inline-flex;
            opacity: 0.7;
        }

        [part="copy"] {
            display: flex;
            padding-left: 8px;
            padding-right: 8px;
            align-items: center;
        }
        &[data-single="true"] [part="copy"] {
            position: absolute;
            right: 0;
            top: 5px;
        }
    }
`;

// The language dropdown's popover. Radix portals it out of the (overflow:hidden)
// codetabs container, so these live as standalone classes rather than nested
// under the host — a descendant selector would never reach the portaled node.
export const LanguageSelectContent = css`
    @layer defaults {
        z-index: 60;
        overflow: hidden;

        min-width: var(--radix-select-trigger-width);

        background: var(--user-codetabs-bgcolor, var(--xyd-codetabs-bgcolor, #15181e));
        border: 1px solid var(--xyd-codetabs-border-color);
        border-radius: 10px;
        padding: 4px;

        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
    }
`;

// The language-icon wrapper (icon, optionally + the pretty name). Used in the
// tab row (icon only) and the dropdown (icon + name).
export const LangIcon = css`
    @layer defaults {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        line-height: 1;

        [part="language-name"] {
            white-space: nowrap;
        }
    }
`;

export const LanguageSelectItem = css`
    @layer defaults {
        all: unset;
        box-sizing: border-box;

        cursor: pointer;

        display: flex;
        align-items: center;
        gap: 8px;

        padding: 6px 10px;
        border-radius: 6px;

        color: var(--user-codetabs-color, var(--xyd-codetabs-color));

        font-weight: var(--xyd-font-weight-semibold);
        font-size: var(--xyd-font-size-xsmall);
        white-space: nowrap;

        &[data-state="checked"] {
            color: var(--user-codetabs-color--active, var(--xyd-codetabs-color--active));
        }

        &[data-highlighted] {
            color: var(--user-codetabs-color--active, var(--xyd-codetabs-color--active));
            background: var(--user-codetabs-color--hover, var(--xyd-codetabs-color--hover));
        }
    }
`;



