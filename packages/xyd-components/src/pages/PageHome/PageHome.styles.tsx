import { css } from "@linaria/core";

export const globals = css`
    :global() {
        :root {
            --page-home-hero-font-size: 50px;
        }
    }
`;

export const PageHome = css`
    [part="hero"] {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 80px 50px;
        background: var(--page-home-hero-background);

        h1 {
            font-size: var(--page-home-hero-font-size, 50px);
            text-align: center;
        }
        h1, h2, h3, h4, h5, h6 {
            font-weight: 400;
        }

        img {
            width: auto;
            max-height: 60px;
            padding-bottom: 18px;
        }

        [data-button="true"] {
            margin-top: var(--xyd-padding-xlarge);
        }
    }

    [part="sections"] {
        max-width: var(--page-home-container-width, 1300px);
        margin: 0 auto;
        padding: 30px 100px;
    }

    @media (max-width: 1024px) {
        [part="sections"] {
            padding: 25px;
            padding-inline: var(--theme-sidebar-padding-total, 25px);
        }
    }
`; 