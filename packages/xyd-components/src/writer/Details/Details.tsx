import React from "react"

import * as cn from "./Details.styles";

/**
 * Base interface for all Details component variants
 */
export interface BaseDetailsProps {
    /** Content to be displayed inside the details element */
    children: React.ReactNode;

    /** Label text displayed in the summary */
    label: string;

    /** Optional icon element to be displayed in the summary */
    icon?: React.ReactElement;

    /** Optional CSS class name for custom styling */
    className?: string;
}

/**
 * Props for the tertiary variant of the Details component
 */
export interface TertiaryDetailsProps extends BaseDetailsProps {
    /** Specifies the tertiary variant */
    kind: "tertiary";

    /** Title text or element displayed in the summary */
    title: string | React.ReactNode;
}

/**
 * Props for the secondary variant of the Details component
 */
export interface SecondaryDetailsProps extends BaseDetailsProps {
    /** Specifies the secondary variant */
    kind: "secondary";

    /** Title text or element displayed in the summary */
    title: string | React.ReactNode;
}

/**
 * Props for the primary variant of the Details component
 */
export interface PrimaryDetailsProps extends BaseDetailsProps {
    /** Specifies the primary variant (default) */
    kind?: "primary";
}

/** Union type of all possible Details component variants */
export type DetailsProps = PrimaryDetailsProps | SecondaryDetailsProps | TertiaryDetailsProps

/**
 * A collapsible details component that supports three variants: primary, secondary, and tertiary.
 * Each variant has a different visual style and structure.
 * 
 * @param props - The component props
 * @returns A details element with collapsible content
 * 
 * @category Component
 */
export function Details(props: DetailsProps): React.ReactElement {
    const { children, label } = props;

    let title

    const isDeepKind = ["secondary", "tertiary"].includes(props.kind || "");

    if (isDeepKind && "title" in props) {
        title = props.title;
    }

    const kind = props.kind || "primary";

    return <details
        part="details"
        className={`${cn.DetailsHost} ${props.className || ""}`}
        data-kind={props.kind}
    >
        <summary part="summary">
            {kind === "primary" && (
                <>
                    {props.icon || <$Icon />}
                    <div part="summary-deep-label">
                        {label}
                    </div>
                </>
            )}

            {isDeepKind && (
                <div>
                    <div part="summary-deep">
                        {props.icon || <$IconDeep />}
                        <div part="summary-deep-text">
                            {title}
                        </div>
                    </div>
                    <div part="summary-deep-label">
                        {label}
                    </div>
                </div> 
            )}
            {isDeepKind && <$Icon />}
        </summary>

        <div part="content">
            {children}
        </div>
    </details>
}

function $Icon() {
    return <div part="icon">
        <svg
            // TODO: bad solution
            data-icon="true"
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                fillRule="evenodd"
                d="M8.293 4.293a1 1 0 0 1 1.414 0l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414-1.414L14.586 12 8.293 5.707a1 1 0 0 1 0-1.414Z"
                clipRule="evenodd"
            />
        </svg>
    </div>
}

function $IconDeep() {
    return <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        stroke="none"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g clipPath="url(#clip0_1689_2180)">
            <path
                d="M4.3 4.3L7.1 7.1M10.6 5.7V1.5M14.8 7.8L17.6 5M5.7 11.3H1.5M7.1 14.8L4.3 17.6M15.5 22.5L9.9 9.9L22.5 14.8L16.9 16.2L15.5 22.5Z"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_1689_2180">
                <rect width={24} height={24} fill="white" />
            </clipPath>
        </defs>
    </svg>
}

