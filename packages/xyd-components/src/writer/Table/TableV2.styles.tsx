import {css} from "@linaria/core";

const colors = {
    primary: "#D1D5DB",
    gray: {
        50: "#F7F7F8",
        100: "#ECECF1",
        600: "#6E6E80",
        800: "#353740",
        900: "#202123"
    }
}

const TableV2 = {
    Host: css`
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    `,
    Table: css`
        display: table;
        width: 100%;
        min-width: 640px; // Ensures table doesn't get too squished
        border-collapse: separate;
        border-spacing: 0;
        border: 1px solid ${colors.gray[100]};
        border-radius: 8px;
        font-size: 0.875rem;
        line-height: 1.25rem;
        margin-top: 1rem;
        overflow: hidden;
    `,
    Thead: css`
        background: ${colors.gray[50]};
    `,
    Th: css`
        text-align: left;
        font-weight: 500;
        padding: 0.5rem 1rem;
        color: ${colors.gray[800]};
        vertical-align: middle;
        border-bottom: 1px solid ${colors.gray[100]};
        white-space: nowrap;

        &:first-child {
            width: 24rem;
            max-width: 40%;
            border-right: 1px solid ${colors.gray[100]};

            @media (max-width: 768px) {
                width: auto;
                min-width: 12rem;
            }
        }

        &.numeric {
            text-align: right;
            font-weight: 400;
            min-width: 5rem;
            
            @media (max-width: 768px) {
                min-width: 4rem;
            }
        }
    `,
    Tr: css`
        &:not(:last-child) {
            border-bottom: 1px solid ${colors.gray[100]};
        }
    `,
    Td: css`
        padding: 0.5rem 1rem;
        vertical-align: middle;
        border-top: 1px solid ${colors.gray[100]};

        &:first-child {
            border-right: 1px solid ${colors.gray[100]};
        }

        &.numeric {
            text-align: right;
        }

        &.muted {
            color: ${colors.gray[600]};
        }

        @media (max-width: 768px) {
            padding: 0.5rem;
        }
    `,
    Cell: css`
        display: flex;
        align-items: baseline;
        width: 100%;
        gap: 0.5rem;
    `,
    CellContent: css`
        flex: 1;
        text-align: right;
    `,
    ModelCell: css`
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        color: ${colors.gray[900]};
        
        @media (max-width: 768px) {
            font-size: 0.8125rem;
        }
    `
} 

export default {
    TableV2
}