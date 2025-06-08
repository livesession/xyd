import { css } from "@linaria/core"

export const UpdateHost = css`
    @layer defaults {
        gap: 24px;
        flex-direction: row;
        padding-top: 32px;
        padding-bottom: 32px;
        align-items: flex-start;
        width: 100%;
        display: flex;
        position: relative;

        [part="meta"] {
            width: 160px;
            position: sticky;
            justify-content: flex-start;
            align-items: flex-start;
            flex-direction: column;
            flex-shrink: 0;
            display: flex;
            gap: 10px;
        }

        [part="content-container"] {
            padding-left: 2px;
            padding-right: 2px;
            overflow: hidden;
            flex: 1 1 0%;
            max-width: 100%;
        }
    }
`;