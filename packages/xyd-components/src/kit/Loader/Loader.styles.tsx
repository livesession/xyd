import {css} from "@linaria/core";

export const LoaderHost = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
`;

export const LoaderDots = css`
    display: flex;
    gap: 4px;
`;

export const LoaderDot = css`
    width: 8px;
    height: 8px;
    background-color: currentColor;
    border-radius: 50%;
    animation: pulse 1.4s infinite ease-in-out;
    opacity: 0.6;

    &:nth-of-type(2) {
        animation-delay: 0.2s;
    }

    &:nth-of-type(3) {
        animation-delay: 0.4s;
    }

    @keyframes pulse {
        0%, 80%, 100% { 
            transform: scale(0.6);
            opacity: 0.4;
        }
        40% { 
            transform: scale(1);
            opacity: 1;
        }
    }
`;

export const LoaderSmall = css`
    .${LoaderDot} {
        width: 6px;
        height: 6px;
    }
`;

export const LoaderLarge = css`
    .${LoaderDot} {
        width: 12px;
        height: 12px;
    }
`; 