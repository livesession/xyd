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
                padding-left: 2em !important;
                padding-inline-start: .375em;
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