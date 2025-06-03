import { css } from "@linaria/core";

export const CodeTabsHost = css`
    display: block;
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
        display: flex;
        flex: 1 1 0%;

        background: var(--xyd-codetabs-bgcolor);
        
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
            align-items: center;
            gap: 4px;

            color: var(--xyd-codetabs-color);
            
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
            flex-grow: 1;
            justify-content: end;
            gap: 8px;
            padding: 0 10px;
        }

        [part="language-trigger"] {
            all: unset;

            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 6px;
            padding: 6px;

            color: var(--xyd-codetabs-color);
            
            &[data-state="active"] {
                color: var(--xyd-codetabs-color--active);
                border-bottom: 1px solid var(--xyd-codetabs-color--active);
                border-bottom-left-radius: 0px;
                border-bottom-right-radius: 0px;
            }
            
            &:hover {
                transition: ease-in 0.1s;
                background: var(--xyd-codetabs-color--hover);
            }
        }

        [part="copy"] {
            display: flex;
            padding-left: 8px;
            padding-right: 8px;
            align-items: center;
        }
        &[data-single="true"] [part="copy"] {
            top: 17px;
            position: relative;
            right: 5px;
        }
    }
`;



