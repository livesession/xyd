import { css } from '@linaria/core'

export default {
    List: css`
        list-style: none;
        margin: 0;
        padding: 0;
    `,
    Item: css`
        margin-bottom: 0.5rem;
        position: relative;
        padding-left: 2em !important;
        padding-inline-start: .375em;

        &::before {
            content: "";
            width: .375em;
            height: .375em;
            position: absolute;
            top: calc(.875em - .1875em);
            left: .5em;
            border-radius: 50%;
            background-color: rgb(80, 84, 83);
        }
    `
}