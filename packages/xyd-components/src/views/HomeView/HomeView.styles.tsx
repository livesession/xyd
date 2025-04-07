import {css} from "@linaria/core";

export const HomeViewHost = css`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
`;

export const HomeViewBodyHost = css`
    background: radial-gradient(circle, hsl(0 0% 9% / .3) 1px, transparent 1px);
    backdrop-filter: sepia(10%);
    background-size: 30px 30px;
    padding: 60px;
    flex: 1;
`;

export const HomeViewBodyHostSecondary = css`
    background: repeating-linear-gradient(to right, hsl(0 0% 9% / .1), hsl(0 0% 9% / .1) 1px, transparent 1px, transparent 50px), repeating-linear-gradient(to bottom, hsl(0 0% 9% / .1), hsl(0 0% 9% / .1) 1px, transparent 1px, transparent 50px);
`;

export const HomeViewBodyContent = css`
    width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 80px;

    @media (max-width: 1200px) {
        width: 100%;
        padding: 0 20px;
    }

    @media (max-width: 768px) {
        width: 100%;
        padding: 0 10px;
    }
`; 