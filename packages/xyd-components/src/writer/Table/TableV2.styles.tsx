import {css} from "@linaria/core";


export default {
    Host: css`
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;

        [data-part="table"] {
            display: table;
            width: 100%;
            min-width: 640px; // Ensures table doesn't get too squished
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--xyd-table-border-color);
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.25rem;
            margin-top: 1rem;
            overflow: hidden;
        }
    `,
    Thead: css`
        background: var(--xyd-table-bgcolor);
    `,
    Tbody: css`
        
    `,
    Th: css`
        text-align: left;
        font-weight: 500;
        padding: 0.5rem 1rem;
        white-space: nowrap;
        vertical-align: middle;
        color: var(--xyd-table-color);
        border-bottom: 1px solid var(--xyd-table-border-color);
        border-right: 1px solid var(--xyd-table-border-color);
    `,
    Tr: css`
        &:not(:last-child) {
            border-bottom: 1px solid var(--xyd-table-border-color);
        }
    `,
    Td: css`
        padding: 0.5rem 1rem;
        vertical-align: middle;
        border-top: 1px solid var(--xyd-table-border-color);
        border-right: 1px solid var(--xyd-table-border-color);

        @media (max-width: 768px) {
            padding: 0.5rem;
        }
    `,
    Cell: css`
        display: flex;
        align-items: baseline;
        width: 100%;
        gap: 0.5rem;

        [data-part="content"] {
            flex: 1;
            text-align: right;
        }
    `
} 

