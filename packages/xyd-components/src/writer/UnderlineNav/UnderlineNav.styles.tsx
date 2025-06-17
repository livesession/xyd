import { css } from "@linaria/core"

export const UnderlineNavHost = css`
    @layer defaults {
        [part="nav"] {
            align-items: center;
            display: flex;
            height: 42px;
            background-color: var(--xyd-underlinenav-bgcolor);
            border-bottom: 1px solid var(--xyd-underlinenav-border-color);
            z-index: 99;

            &[data-kind="secondary"] {
                border-bottom: none;
                border-radius: 8px;
                padding: 4px;
                background-color: var(--xyd-tabs-bgcolor);
            }
        }

        [part="list"] {
            display: flex;
            gap: 10px;
            height: 100%;
            color: var(--xyd-underlinenav-list-color);
            list-style: none;
            padding: 0;
            white-space: nowrap;

            [data-kind="secondary"] & {
                gap: 4px;
            }
        }

        [part="item"] {
            height: 100%;
            position: relative;

            a, button {
                height: 100%;
            }
            
            &[data-state="active"] {
                a {
                    border-bottom-color: var(--xyd-underlinenav-color--active);
                }

                [data-kind="secondary"] & a {
                    border-bottom-color: transparent;
                    color: var(--xyd-tabs-color--active);
                    background-color: var(--xyd-tabs-bgcolor--active);
                    box-shadow: 0 1px 2px 0 var(--xyd-tabs-shadow-color--active);
                }
            }
            &[data-state="inactive"] {
                a, button {
                    color: unset;
                }
            }
        }

        [part="link"] {
            display: inline-flex;
            border-bottom: 3px solid transparent;
            text-decoration: none;
            height: 100%;
            padding: 10px;
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
                color: var(--xyd-underlinenav-color--active);
            }

            [data-kind="secondary"] & {
                border-bottom: none;
                padding: 5px 16px;
                border-radius: 0.375rem;
                color: var(--xyd-tabs-color);

                &:hover {
                    color: var(--xyd-tabs-color--active);
                }
            }
        }

        [part="content"] {
            position: relative;
            overflow: hidden;

            [data-kind="secondary"] & {
                margin-top: 16px;
            }
        }
    }
`;

export const UnderlineNavContent = css`
    @layer defaults {
        position: relative;
        width: 100%;

        &[data-state="inactive"] {
            display: none;
        }

        /* Only apply animations when parent has data-slide="true" */
        [data-slide="true"] & {
            /* Forward direction (left to right) */
            &[data-direction="forward"][data-state="active"] {
                position: relative;
                animation: fadeInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            &[data-direction="forward"][data-state="inactive"] {
                position: absolute;
                animation: fadeOutToLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Backward direction (right to left) */
            &[data-direction="backward"][data-state="active"] {
                position: relative;
                animation: fadeInFromLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            &[data-direction="backward"][data-state="inactive"] {
                position: absolute;
                animation: fadeOutToRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
        }

        @keyframes fadeInFromRight {
            from {
                opacity: 0;
                transform: translateX(75px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes fadeOutToLeft {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-75px);
            }
        }

        @keyframes fadeInFromLeft {
            from {
                opacity: 0;
                transform: translateX(-75px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes fadeOutToRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(75px);
            }
        }

        [part="child"] {
            padding: 20px;
            transition: all 0.3s ease;
        }
    }
`;
