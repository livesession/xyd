import { css } from "@linaria/core"

export const CardHost = css`
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 #0000001a;
    flex-direction: column;
    display: flex;
    overflow: hidden;

    &[data-shadow="md"] {
        box-shadow: 0 5px 40px #0003;
    }

    [part="image-container"] {
        border-bottom: 2px solid #ebedf0;
        height: 200px;
        overflow: hidden;
        position: relative;

        [part="bg"] {
            background-size: cover;
            background-repeat: no-repeat;
            position: relative;
            height: 100%;
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            margin-bottom: -4px;
        }
    }

    [part="body"] {
        padding: 16px;

        [part="header"] {
            margin-right: 4px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            display: flex;
        }
    }
`