import {css} from "@linaria/core";

export const CTABannerHost = css`
    padding: 20px;
`;

export const CTABannerContainer = css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 80px;
`;

export const CTABannerHero = css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 40px;
`;

export const CTABannerHeadingEffect = css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    background: -webkit-linear-gradient(
            120deg,
            var(--headingEffect-color-tertiary) 20%,
            var(--headingEffect-color-tertiary) 30%,
            var(--headingEffect-color-secondary) 60%,
            var(--headingEffect-color-primary) 75%,
            var(--headingEffect-color-primary) 85%
    );
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: wave 5s infinite;
    background-size: 200% 200%;
    background-position: 50% 50%; // Start with all colors visible

    @keyframes wave {
        0% {
            background-position: 50% 50%;
        }
        50% {
            background-position: 0% 50%;
        }
        100% {
            background-position: 50% 50%;
        }
    }
`;

export const CTABannerHeadingHost = css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`;

export const CTABannerHeadingTitle = css`
    font-size: 76px;
    font-weight: 900;
    text-align: center;
    letter-spacing: 3px;
    margin: 0;
`;

export const CTABannerHeadingSubtitle = css`
    color: #3c3c43;
    font-size: 46px;
    font-weight: 600;
    text-align: center;
`;

export const CTABannerButtonGroupHost = css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
`; 