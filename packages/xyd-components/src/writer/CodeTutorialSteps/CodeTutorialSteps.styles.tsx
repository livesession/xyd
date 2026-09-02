import { css } from "@linaria/core";

const markerPx = 28;
const railWidth = 1;

// the badge sits centred on the title's first line, not on the whole title box,
// so multi-line titles keep the badge next to the words they number
const markerOffset = `calc((var(--xyd-line-height-large) - ${markerPx}px) / 2)`;

// prose and code side by side need the full content measure - below the tablet
// breakpoint the layout already uses, both columns would be too narrow to read
const stackBreakpoint = "1024px";

export const CodeTutorialStepsHost = css`
    display: block;

    @layer defaults {
        ol {
            padding-left: 0;
            list-style: none;

            display: flex;
            flex-direction: column;
        }
    }
`;

export const CodeTutorialStepsItem = css`
    @layer defaults {
        position: relative;
        display: grid;
        align-items: start;
        column-gap: var(--xyd-padding-xlarge);
        row-gap: var(--xyd-padding-medium);
        /* the title spans both columns: an aside that spanned the title row instead
           would push the prose down, since a spanning item grows the tracks it covers */
        grid-template-columns: ${markerPx}px minmax(0, 1fr) minmax(0, 1fr);
        grid-template-areas:
            "marker title title"
            ".      body  aside";
        padding-bottom: var(--xyd-padding-xxlarge);

        &:last-child {
            padding-bottom: 0;
        }

        /* the rail joins one badge to the next, so the last step never draws it */
        &:not(:last-child)::before {
            content: "";
            position: absolute;
            top: calc(${markerOffset} + ${markerPx}px + var(--xyd-padding-small));
            left: calc(${markerPx}px / 2 - (${railWidth}px / 2));
            width: ${railWidth}px;
            height: calc(100% - ${markerOffset} - ${markerPx}px - var(--xyd-padding-small));
            background: var(--dark32);
        }

        /* direct children only - a Callout or a GuideCard in the body has its own [part] */
        > [part="marker"] {
            grid-area: marker;
            margin-top: ${markerOffset};

            background: var(--xyd-steps-marker-bgcolor);
            color: var(--xyd-steps-marker-color);
            font-size: var(--xyd-font-size-xsmall);
            line-height: var(--xyd-line-height-xsmall);
            font-weight: var(--xyd-font-weight-medium);
            height: ${markerPx}px;
            width: ${markerPx}px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        > [part="title"] {
            grid-area: title;

            color: var(--xyd-text-color--default);
            font-size: var(--xyd-font-size-xlarge);
            line-height: var(--xyd-line-height-large);
            font-weight: var(--xyd-font-weight-semibold);
        }

        > [part="body"] {
            grid-area: body;
            min-width: 0;
        }

        > [part="aside"] {
            grid-area: aside;
            min-width: 0;

            display: flex;
            flex-direction: column;
            gap: var(--xyd-padding-large);
        }

        /* no right column authored - give the prose the whole measure */
        &:not(:has(> [part="aside"])) {
            grid-template-columns: ${markerPx}px minmax(0, 1fr);
            grid-template-areas:
                "marker title"
                ".      body";
        }

        @media (max-width: ${stackBreakpoint}) {
            grid-template-columns: ${markerPx}px minmax(0, 1fr);
            grid-template-areas:
                "marker title"
                ".      body"
                ".      aside";
        }
    }
`;
