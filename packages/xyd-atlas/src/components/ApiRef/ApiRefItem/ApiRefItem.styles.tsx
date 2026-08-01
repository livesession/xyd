import { css } from "@linaria/core";

export const ApiRefItemTitleHost = css`
    font-weight: var(--xyd-font-weight-normal);
`;

/** The opt-in "Run request" trigger next to an operation (host provides a playground). */
export const ApiRefItemRunRequest = css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 12px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: var(--xyd-font-weight-medium, 500);
    line-height: 1.2;
    color: var(--XydAtlas-Component-ApiRef-Item__color-navbar, #1f2328);
    background: var(--XydAtlas-Component-ApiRef-Item__background-navbar, #eef1f5);
    border: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border, rgb(0 0 0 / 0.14));
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease;

    &:hover {
        background: var(--XydAtlas-Component-ApiRef-Item__background-navbar, #e1e6ee);
        border-color: var(--XydAtlas-Component-ApiRef-Item__color-border, rgb(0 0 0 / 0.24));
    }
`;

export const ApiRefItemTitleLink = css`
`;

export const ApiRefItemNavbarHost = css`
    margin: 20px 0px;
`;

/* A [method-badge · path] bar. Keeps the subtle background + rounded corners, but
   NO border — the border was what made it read as a box-around-a-chip (two borders,
   container-in-container) since the method <Badge> is already a chip. Compact padding
   so it doesn't feel oversized. */
export const ApiRefItemNavbarContainer = css`
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: auto;
    background: var(--XydAtlas-Component-ApiRef-Item__background-navbar);
    padding: 6px 10px;
    border-radius: 8px;
`;

export const ApiRefItemNavbarLabel = css`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--XydAtlas-Component-ApiRef-Item__color-navbar);
`;

export const ApiRefItemNavbarSubtitle = css`
    display: flex;
    align-items: center;
    min-width: 0;
    font-size: var(--xyd-font-size-small, 13px);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
`;

/* SDK-native operation header (opensdk \`sdkTypes\`): the method SIGNATURE row +
   the single language selector that drives the header + request/response types. */
export const ApiRefItemSdkHeader = css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 20px 0px;
`;

/* Just the signature row. NOT flex: it used to be a two-column flex layout
   (signature <Code> left, a language <select> right, justify-content:space-between)
   but the <select> was removed — the shared code-sample switcher drives the language
   now. Left as flex, the lone <code> flex item shrank to min-content and wrapped its
   text. Plain block flow + a nowrap, scrollable <code> keeps it on ONE line. */
export const ApiRefItemSdkSignature = css`
    & > code {
        display: block;
        font-size: var(--xyd-font-size-small, 13px);
        /* Keep the whole signature on ONE line. It contains a bolded <strong>
           method, whose inline boundaries would otherwise become break points
           (with wrapping the browser split it per piece: "client.Files." / "List"
           / "(ctx, query) …"). Scroll horizontally if it's too long. */
        white-space: nowrap;
        max-width: 100%;
        overflow-x: auto;
    }
`;

/* The called method inside the SDK signature — bold + the accent colour so the
   eye lands on what's being called (e.g. the `List` in `client.Widgets.List`). */
export const ApiRefItemSdkMethod = css`
    font-weight: var(--xyd-font-weight-bold, 700);
    color: var(--xyd-text-color--primary, var(--color-primary, inherit));
`;

/* A compact light chip matching the code-sample dropdown; theme-aware via the
   Atlas navbar tokens (so every xyd docs theme styles it, not just the editor). */
export const ApiRefItemSdkLangSelect = css`
    flex: none;
    background: var(--XydAtlas-Component-ApiRef-Item__background-navbar, #eef1f5);
    color: var(--XydAtlas-Component-ApiRef-Item__color-navbar, inherit);
    border: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border, rgb(0 0 0 / 0.14));
    border-radius: 6px;
    padding: 4px 8px;
    font-size: var(--xyd-font-size-xsmall, 11px);
    line-height: 1.4;
    cursor: pointer;
`;

export const ApiRefItemHost = css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 25px;

    &[data-has-examples="true"] {
        atlas-apiref-item-showcase {
            display: grid;
            gap: 100px;
            grid-template-columns: repeat(2, minmax(0, 1fr));

            @media (max-width: 768px) {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
        }
    }
`;

export const ApiRefItemGrid = css`
    align-items: normal;

    @media (max-width: 1280px) {
        xyd-grid-decorator {
            --cols: 1;
        }
    }
`;

export const ApiRefItemDefinitionsHost = css`
`;

export const ApiRefItemDefinitionsItem = css`
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin-bottom: 25px;

    margin-top: var(--space-xxlarge);

    [part="controls"] {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    > [part="header"] {
        h2, h3, h4, h5, h6 {
            margin: 0;
        }

        border-bottom: 1px solid var(--XydAtlas-Component-ApiRef-Item__color-border);

        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 16px;

        > :first-child {
            justify-self: start;
        }

        > :not(:first-child) {
            justify-self: end;
        }
    }
`;

export const DefinitionBody = css`
    display: flex;
    flex-direction: column;
    gap: 15px;
`