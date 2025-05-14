import { css } from "@linaria/core";

export const ApiRefPropertiesUlHost = css`
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;

    list-style: none;
    border: none;
`;

export const ApiRefPropertiesLiHost = css`
    margin: 0;
    padding: 20px 0px;
    border-bottom: 1px solid var(--dark32);

    &:first-child {
        padding-top: 0;
    }

    &:last-child {
        padding-bottom: 0;
        border-bottom: none;
    }
`;

export const ApiRefPropertiesDescriptionHost = css`
    color: var(--XydAtlas-Component-ApiRef-Properties__color-description);

    p {
        color: var(--XydAtlas-Component-ApiRef-Properties__color-description);
    }
`;

export const ApiRefPropertiesDlHost = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px;

    margin: 4px 0;

    dd {
        margin-inline-start: 0px;
    }
`;

export const ApiRefPropertiesPropNameCodeHost = css`
    display: inline-flex;
    padding: 4px 0;
    font-weight: var(--xyd-font-weight-semibold);
    color: var(--XydAtlas-Component-ApiRef-Properties__color-propName);
`;

export const ApiRefPropertiesPropTypeCodeHost = css`
    display: inline-flex;
    padding: 4px 0;
    border-radius: 4px;
    color: var(--XydAtlas-Component-ApiRef-Properties__color-propType);
`;

export const ApiRefPropertiesPropTypeCodeLink = css`
    color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
    text-decoration: underline;
    
    &:hover {
        text-decoration: none;
        color: var(--XydAtlas-Sys-Color-Primary--hover);
    }
`;

export const ApiRefPropertiesSubPropsHost = css`
    padding: 8px;
    border-style: none;
    display: none;
`;

export const ApiRefPropertiesSubPropsHostExpanded = css`
    display: unset;
`;

export const ApiRefPropertiesSubPropsBox = css`
`;

export const ApiRefPropertiesSubPropsUl = css`
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    gap: 16px;

    padding: 0;
    margin: 0;

    list-style: none;

    border: none;
    border-left: 1px solid var(--XydAtlas-Component-ApiRef-Properties__color-border);
`;

export const ApiRefPropertiesSubPropsLi = css`
    padding: 0 16px;
`;

export const ApiRefPropertiesPropToggleHost = css`
    display: flex;
    align-items: center;
    padding: 0;
    margin-top: 16px;

    background: none;
    outline: inherit;
    border: none;

    cursor: pointer;
    color: inherit;

    svg {
        font-size: var(--xyd-font-size-small);
    }

    &:hover {
        svg {
            transition: all ease-in .1s;
            color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
        }
    }
`;

export const ApiRefPropertiesPropToggleLink = css`
    text-decoration: none;
    cursor: pointer;
    margin-left: 4px;

    &:hover {
        transition: all ease-in .1s;
        color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
    }
`;

export const globals = css`
  :global() {
    atlas-apiref-propmeta { // TODO: !!! BETTER API !!! - FOR CUSTOM COMPONENTS
        font-size: var(--xyd-font-size-xsmall);
        line-height: var(--xyd-line-height-xsmall);


        code {
            display: inline-flex;
            padding: 4px 0;
            border-radius: 4px;
            color: var(--XydAtlas-Component-ApiRef-Properties__color-propType);
        }
        &[data-name="required"] {
            code {
                color: var(--xyd-text-color--error);
            }
        }

        a {
            color: var(--XydAtlas-Component-ApiRef-Properties__color--active);
            text-decoration: underline;
            
            &:hover {
                text-decoration: none;
                color: var(--XydAtlas-Sys-Color-Primary--hover);
            }
        }
    }
  }
`;