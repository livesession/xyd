import {css} from "@linaria/core";

export const TabsSampleHost = css`
    @layer defaults {
        display: block;
        position: relative;
        max-width: 100%;

        [part="buttons"] {
            display: flex;
            align-items: center;
        }

        [part="arrow"] {
            padding: 8px;
            background-color: var(--xyd-tabs-arrow-bgcolor);
            box-shadow: 0 1px 2px 0 var(--xyd-tabs-shadow-color--active);
        }

        [part="arrow-icon"] {
            width: 16px;
            height: 16px;
        }

        [part="scroller"] {
            overflow-x: auto;
            flex-grow: 1;
        }

        [part="scroller-container"] {
            display: inline-flex;
            gap: 4px;

            border-radius: 8px;
            background-color: var(--xyd-tabs-bgcolor);
            
            padding: 4px;
            margin-left: 4px;
        }

        [part="button"] {
            padding: 5px 16px;

            border-radius: 0.375rem;
            white-space: nowrap;

            transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 300ms;

            color: var(--xyd-tabs-color);

            &:hover {
                color: var(--xyd-tabs-color--active);
            }

            &[data-state="active"] {
                color: var(--xyd-tabs-color--active);
                background-color: var(--xyd-tabs-bgcolor--active);
                box-shadow: 0 1px 2px 0 var(--xyd-tabs-shadow-color--active);
            }
        }

        [part="content"] {
            margin-top: 16px;
        }
    }
`;


