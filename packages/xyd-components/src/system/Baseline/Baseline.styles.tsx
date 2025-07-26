
import { css } from "@linaria/core";

import checkUrl from "./check.svg"
import bunUrl from "./bun.svg"
import logoUrl from "./logo.svg"
import pnpmUrl from "./pnpm.svg"
import nodeUrl from "./node.svg"
import npmUrl from "./npm.svg"

export const BaselineHost = css`
    --baseline-logo-bun: url(${bunUrl});
    --baseline-logo-node: url(${nodeUrl});
    --baseline-logo-npm: url(${npmUrl});

    --baseline-high-bg: #e6f4ea;
    --baseline-high-engine-bg: #ceead6;
    --baseline-high-img: url(${logoUrl});
    --baseline-high-check: #099949;

    --baseline-bg: var(--baseline-high-bg);
    --baseline-engine-bg: var(--baseline-high-engine-bg);
    --baseline-img: var(--baseline-high-img);
    --baseline-check: var(--baseline-high-check);

    --baseline-cross: var(--baseline-limited-cross);
    --feedback-link-icon: var(--icon-primary);
    background: var(--baseline-bg);
    border-radius: .25rem;
    margin: 1rem 0;
    padding-left: 3.8125rem;

    summary {
        --chevron-size: 0.6875rem;
        --chevron-padding-left: 0.75rem;
        --chevron-padding-right: 1.25rem;
        align-items: center;
        cursor: pointer;
        display: flex;
        flex-wrap: wrap;
        gap: .5rem;
        justify-content: space-between;
        padding: 1rem 0;
        padding-right: calc(var(--chevron-padding-left) + var(--chevron-size) + var(--chevron-padding-right));
        position: relative;
    }

    [part="icon"] {
        --width: 2.3125rem;
        background-image: var(--baseline-img);
        background-position: 50%;
        background-repeat: no-repeat;
        background-size: contain;
        display: block;
        height: 2.25rem;
        left: calc(-.5rem - var(--width));
        position: absolute;
        top: 1rem;
        width: var(--width);
    }

    [part="title"] {
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0;
        line-height: 1.5;
        margin: 0;
        padding: .375rem 0;
    }

    [part="compatibility"] {
        display: flex;
        flex-wrap: wrap;
        gap: .5rem;
    }

    [part="tools"] {
        background: var(--baseline-engine-bg);
        border-radius: 2rem;
        display: flex;
        flex-wrap: wrap;
        gap: .5rem;
        padding: .5rem .625rem;

        [data-tool] {
            display: flex;
            --baseline-tool-image: none;
        }
        [data-tool="bun"] {
            --baseline-tool-image: var(--baseline-logo-bun);
        }
        [data-tool="node"] {
            --baseline-tool-image: var(--baseline-logo-node);
        }
        [data-tool="npm"] {
            --baseline-tool-image: var(--baseline-logo-npm);
        }
        [data-tool="pnpm"] {
            --baseline-tool-image: url(${pnpmUrl});
        }

        [data-tool]::before {
            background-repeat: no-repeat;
            background-size: contain;
            content: "";
            display: block;
            height: 1.25rem;
            width: 1.25rem;
            background-image: var(--baseline-tool-image);
        }

        [data-tool]::after {
            background-color: var(--baseline-check);
            mask-image: url(${checkUrl});
            -webkit-mask-image: url(${checkUrl});

            content: "";
            display: block;
            height: 1.25rem;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-size: contain;
            mask-size: contain;
            width: 1rem;
        }
    }

`;