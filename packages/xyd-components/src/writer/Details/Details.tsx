import React from "react"

import * as cn from "./Details.styles";

interface BaseDetailsProps {
    children: React.ReactNode;
    label: string;
    icon?: React.ReactElement;
}

interface TertiaryDetailsProps extends BaseDetailsProps {
    kind: "tertiary";
    title: string | React.ReactNode;
}

interface SecondaryDetailsProps extends BaseDetailsProps {
    kind: "secondary";
    title: string | React.ReactNode;
}

interface PrimaryDetailsProps extends BaseDetailsProps {
    kind?: "primary";
}

export type DetailsProps = PrimaryDetailsProps | SecondaryDetailsProps | TertiaryDetailsProps

export function Details(props: DetailsProps) {
    const {children, label} = props;

    let title

    const isDeepKind = ["secondary", "tertiary"].includes(props.kind || "");

    if (isDeepKind && "title" in props) {
        title = props.title;
    }

    const kind = props.kind || "primary";

    return <details className={`
        ${cn.DetailsHost} 
        ${isDeepKind && cn.DetailsHostSecondary}
   `}>
        <summary className={`
        ${cn.DetailsSummary} 
        ${isDeepKind && cn.DetailsSummarySecondary}
        ${kind === "tertiary" ? cn.DetailsSummaryTertiary : ""}
   `}>
            {kind === "primary" && (
                <>
                    {props.icon || <Icon/>}
                    <Label>
                        {label}
                    </Label>
                </>
            )}
            {isDeepKind && (
                <div>
                    <div className={cn.DetailsSummaryDeep}>
                        {props.icon || <IconDeep/>}
                        <div className={`
                            ${cn.DetailsSummaryDeepText}
                            ${cn.DetailsSummaryDeepTextTertiary}
                        `}>
                            {title}
                        </div>
                    </div>
                    <Label>
                        {label}
                    </Label>
                </div>
            )}
            {isDeepKind && <Icon/>}
        </summary>

        <div className={`
            ${cn.DetailsContent}
            ${isDeepKind && cn.DetailsContentSecondary}
            ${kind === "tertiary" && cn.DetailsContentTertiary}
        `}>
            {children}
        </div>
    </details>
}

function Icon() {
    return <div className={cn.DetailsIcon}>
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

function IconDeep() {
    return <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        stroke="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <g clipPath="url(#clip0_1689_2180)">
            <path
                d="M4.3 4.3L7.1 7.1M10.6 5.7V1.5M14.8 7.8L17.6 5M5.7 11.3H1.5M7.1 14.8L4.3 17.6M15.5 22.5L9.9 9.9L22.5 14.8L16.9 16.2L15.5 22.5Z"
                stroke="black"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_1689_2180">
                <rect width={24} height={24} fill="white"/>
            </clipPath>
        </defs>
    </svg>
}

function Label({children}: {
    children?: React.ReactNode
}) {
    return <div className={cn.DetailsLabel}>
        {children}
    </div>
}