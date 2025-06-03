import {css} from "@linaria/core";


export default {
    Host: css`
        @layer defaults {
            display: table;
            width: 100%;
            min-width: 640px; // Ensures table doesn't get too squished
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--xyd-table-border-color);
            border-radius: 8px;
            margin-top: 1rem;
            overflow: hidden;
        }
    `,
    Thead: css`
        @layer defaults {
            background: var(--xyd-table-bgcolor);
        }
    `,
    Tbody: css`
        
    `,
    Th: css`
        @layer defaults {
            text-align: left;
            font-weight: var(--xyd-font-weight-medium);
            padding: 0.5rem 1rem;
            white-space: nowrap;
            vertical-align: middle;
            color: var(--xyd-table-color);
            border-bottom: 1px solid var(--xyd-table-border-color);
            border-right: 1px solid var(--xyd-table-border-color);
        }
    `,
    Tr: css`
        @layer defaults {
            &:not(:last-child) {
                border-bottom: 1px solid var(--xyd-table-border-color);
            }
        }
    `,
    Td: css`
        @layer defaults {
            padding: 0.5rem 1rem;
            vertical-align: middle;
            border-top: 1px solid var(--xyd-table-border-color);
            border-right: 1px solid var(--xyd-table-border-color);

            @media (max-width: 768px) {
                padding: 0.5rem;
            }
        }
    `,
    Cell: css`
        @layer defaults {
            display: flex;
            align-items: baseline;
            width: 100%;
            gap: 0.5rem;

            [part="child"] {
                flex: 1;
                text-align: right;
            }
        }
    `
} 

