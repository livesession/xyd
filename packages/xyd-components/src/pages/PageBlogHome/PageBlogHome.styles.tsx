import { css } from "@linaria/core"

export const PageBlogHome = css`
    --page-blog-home-padding: calc(var(--xyd-nav-item-padding) + var(--xyd-nav-padding));
    max-width: var(--page-bloghome-max-width, 800px);
    margin: 0 auto;
    padding: 48px var(--page-blog-home-padding) 0 var(--page-blog-home-padding);
    display: flex;
    flex-direction: column;

    [part="posts"] {
        --spacing: .25rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--spacing) * 80), 1fr));
        grid-gap: calc(var(--spacing) * 12) calc(var(--spacing) * 8);
        min-height: 430px;
        
        margin-top: 24px;
        margin-bottom: 24px;
    }

    [part="pagination"] {
        margin-top: 32px;
    }

    [part="card-content"] {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    [part="card-image"] {
        width: 100%;
        height: 180px;
        overflow: hidden;
        border-radius: 8px;
        margin-bottom: 16px;
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }

    [part="card-author-row"] {
        display: flex;
        align-items: end;
        flex: 1;
        gap: 8px;
        margin-top: 8px;
    }

    [part="card-author-avatar"] {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
    }

    xyd-guidecard {
        [part="right"], [part="body"], [part="card-content"] {
            height: 100%;
        }
    }
`;