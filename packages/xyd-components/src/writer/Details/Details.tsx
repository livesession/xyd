import React from "react"

import {$details} from "./Details.styles";

interface BaseDetailsProps {
    children: React.ReactNode;
    label: string;
}

interface SecondaryDetailsProps extends BaseDetailsProps {
    kind: "secondary";
    title: string;
}

interface PrimaryDetailsProps extends BaseDetailsProps {
    kind?: "primary";
}

export type DetailsProps = PrimaryDetailsProps | SecondaryDetailsProps;

export function Details(props: DetailsProps) {
    let title = "";
    const {children, label} = props;

    if (props.kind === "secondary") {
        title = props.title;
    }

    const kind = props.kind || "primary";

    return <details className={`
        ${$details.host} 
        ${kind === "secondary" && $details.host$$secondary}
   `}>
        <summary className={`
        ${$details.summary} 
        ${kind === "secondary" && $details.summary$$secondary}
   `}>
            {kind === "primary" && <>
                <$Icon/>
                <$Label>
                    {label}
                </$Label>
            </>}
            {kind === "secondary" && <>
                <div>
                    <div className={$details.summaryDeep}>
                        <$IconDeep/>
                        <div className={$details.summaryDeep$text}>
                            {title}
                        </div>
                    </div>
                    <$Label>
                        {label}
                    </$Label>
                </div>
                <$Icon/>
            </>}
        </summary>

        <div className={`
            ${$details.content}
            ${kind === "secondary" && $details.content$$secondary}
        `}>
            {children}
        </div>
    </details>
}

function $Icon() {
    return <div className={$details.icon}>
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

function $Label({children}: {
    children?: React.ReactNode
}) {
    return <div className={$details.label}>
        {children}
    </div>
}