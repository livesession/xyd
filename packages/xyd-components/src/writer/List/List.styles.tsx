import { css } from '@linaria/core'

export default {
    List: css`
        @layer defaults {
            list-style: none;
            margin: 0;
            padding: 0;

            ol& {
                list-style-type: decimal;
                padding-inline-start: 1.625em;
            }
        }
    `,
    Item: css`
        @layer defaults {
            ul & {
                margin-bottom: 0.5rem;
                position: relative;
                padding-inline-start: .375em;
                padding-left: 2em !important;
            }

            /*  TODO: IN THE FUTURE BETTER SOLUTION IS NEEDED */
            xyd-grid-decorator ul & {
                padding-left: 0 !important;
            }

            ul &::before {
                content: "";
                width: .375em;
                height: .375em;
                position: absolute;
                top: 0.5em;
                left: .5em;
                border-radius: 50%;
                background-color: var(--xyd-list-item-bgcolor);
            }

            ol &::marker {
                padding-inline-start: .375em;
                color: var(--xyd-list-marker-color);
            }
        }
    `
}