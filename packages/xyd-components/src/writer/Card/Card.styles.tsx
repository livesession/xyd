import { css } from "@linaria/core"

export const CardHost = css`
    --card-shadow-atom-color: color-mix(
        in srgb,
        var(--black) 10%,
        transparent 90%
    );
    --card-shadow: 0 1px 3px 0 var(--card-shadow-atom-color), 0 1px 2px -1px var(--card-shadow-atom-color);
    --card-ring-offset-shadow: 0 0 var(--black);
    --card-ring-shadow: 0 0 var(--black);

    box-shadow: var(--card-ring-offset-shadow, 0 0 var(--black)), var(--card-ring-shadow, 0 0 var(--black)), var(--card-shadow);
    /* box-shadow: 0 1px 2px 0 var(--xyd-card-shadow-color); */
    
    border-radius: 8px;
    background-color: var(--xyd-card-bgcolor);
    flex-direction: column;
    display: flex;
    overflow: hidden;
    position: relative;
    height: 100%;

    /* &[data-shadow="md"] {
        box-shadow: 0 5px 40px var(--xyd-card-shadow-color);
    } */

    &:hover {
        --card-shadow: 0 10px 15px -3px var(--card-shadow-atom-color), 0 4px 6px -4px var(--card-shadow-atom-color);
        box-shadow: var(--card-ring-offset-shadow, 0 0 var(--black)), var(--card-ring-shadow, 0 0 var(--black)), var(--card-shadow);
    }

    [part="image-container"] {
        border-bottom: 2px solid var(--xyd-card-border-color);
        height: 200px;
        /* overflow: hidden; */
        position: relative;
        transition: transform 0.1s ease-in;

        &:hover {
            transform: scale(1.02);
        }

        [part="bg"] {
            background-size: cover;
            background-repeat: no-repeat;
            position: relative;
            height: 100%;
        }

        [part="bg-shadow"] {
            --card-gradient-from: hsla(0, 0%, 4%, 0) var(--xyd-gradient-from-position);
            --card-gradient-to: hsla(0, 0%, 4%, .2) var(--xyd-gradient-to-position);
            --card-gradient-stops: var(--card-gradient-from), hsla(0, 0%, 4%, .1) var(--xyd-gradient-via-position), var(--card-gradient-to);
            background-repeat: no-repeat;
            background-size: cover;
            height: 100%;
            position: absolute;
            top: 0;
            width: 100%;
            background-image: linear-gradient(to bottom, var(--card-gradient-stops));
            pointer-events: none;
        }
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            margin-bottom: -4px;
        }
    }

    [part="author-link"] {
        --card-shadow: 0 4px 6px -1px var(--card-shadow-atom-color), 0 2px 4px -2px var(--card-shadow-atom-color);
        --card-bg-opacity: 1;

        box-shadow: var(--card-ring-offset-shadow, 0 0 var(--black)), var(--card-ring-shadow, 0 0 var(--black)), var(--card-shadow);
        background-color: rgb(245 245 245 / var(--card-bg-opacity));
        border-width: 1px;
        border-color: var(--dark8);
        border-radius: 9999px;
        overflow: hidden;
        width: 4rem;
        height: 4rem;
        z-index: 2;
        left: 1.25rem;
        bottom: -2rem;
        position: absolute;

        img {
            width: 100%;
            height: 100%;
            display: block;
            max-width: 100%;
        }
    }

    [part="body"] {
        /* padding: 16px; */

        padding: 50px 1.25rem;

        [part="header"] {
            margin-right: 4px;
            align-items: center;
            justify-content: space-between;
            /* margin-bottom: 12px; */
            display: flex;
        }
    }
`