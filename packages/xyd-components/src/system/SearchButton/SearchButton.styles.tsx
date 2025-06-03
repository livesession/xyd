import { css } from "@linaria/core";

export const SearchButton = css`
    @layer defaults {
        background-color: transparent;
        border-radius: 8px;
        border: 1px solid var(--dark32);
        color: var(--text-primary);
        background: var(--dark16);
        font-size: var(--xyd-font-size-small);
        font-weight: var(--xyd-font-weight-semibold);
        height: 36px;
        justify-content: space-between;
        display: flex;
        align-items: center;
        flex: 1;

        padding: 0 8px;
        margin: 12px 0 0;
        user-select: none;
        width: 100%;
        transition: border-color .15s ease;

        
        max-width: 300px;
        margin: 0;

        cursor: pointer;

        &:hover {
            background: var(--dark16);
            box-shadow: none;
            color: var(--dark48);
            outline: none;

            box-shadow: none;
            border-color: var(--dark48);
        }
        
        [part="container"] {
            align-items: center;
            display: flex;
        }

        [part="placeholder"] {
            display: block !important;
            font-size: var(--xyd-font-size-small);
            color: var(--dark48);
            font-weight: var(--xyd-font-weight-normal);
        }

        [part="icon"] {
            stroke-width: 1.4;
            color: var(--dark48) !important;
            height: 15px;
            transition: color .15s var(--cubic-enter);
        }
        

        [part="keys"] {
            display: flex;
            gap: 4px;
            min-width: auto;
        }

        [part="key"] {
            align-items: center;
            background: var(--dark16);
            border-radius: 3px;
            box-shadow: none;
            color: var(--dark48);
            display: flex;
            height: 18px;
            line-height: 18px;
            justify-content: center;
            font-size: 12px;
            letter-spacing: 1px;
            position: relative;
            padding: 0;
            margin: 0;
            border: 0px;
            top: 0;
            width: 20px;
        }
    }
`
