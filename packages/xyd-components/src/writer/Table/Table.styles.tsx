import {css} from "@linaria/core";

export default {
    Host: css`
        @layer defaults {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid var(--xyd-table-border-color);
            border-radius: 8px;
            margin-top: 16px;
            //overflow: hidden;
            
            &[data-kind="secondary"] {
                border: none;
                
                th, td {
                    border: none;
                    border-bottom: 1px solid var(--xyd-table-border-color);
                }
            }
            
            @media (min-width: 1400px) {
                min-width: 640px;
            }
            
            @media (max-width: 1024px) {
                overflow: auto;
                display: block;
            }
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
            //font-weight: var(--xyd-font-weight-medium);
            font-weight: bold;
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
            max-width: 300px;
            overflow: auto;

            @media (max-width: 768px) {
                padding: 0.5rem;
            }

            code {
                &.json {
                    width: 100%;
                    font-family: unset; // TODO: BETTER - cuz issues with displaying json on mobile
                }
                text-align: left;
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
                //text-align: right;
            }
        }
    `
} 

