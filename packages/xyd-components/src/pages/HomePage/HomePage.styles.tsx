import {css} from "@linaria/core";

export const HomePageCardsHost = css`
    display: grid;
    grid-template-columns: repeat(2, 500px);
    justify-content: center;
    gap: 30px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`; 