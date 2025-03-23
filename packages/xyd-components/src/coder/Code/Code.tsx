import React, {Suspense} from "react";
import type {HighlightedCode, AnnotationHandler} from "codehike/code";
import {InnerLine, Pre} from "codehike/code";
import {Theme} from "@code-hike/lighter";

import {CodeTheme, type CodeThemeBlockProps} from "../CodeTheme";
import {$lineNumber, $mark, $code} from "./Code.styles.tsx";

export interface CodeProps {
    codeblocks: CodeThemeBlockProps[];
    theme?: Theme
    children: React.ReactNode
}

export function Code(props: CodeProps) {
    return <Suspense fallback={<$Loading/>}>
        <CodeTheme codeblocks={props.codeblocks} theme={props.theme}>
            {props.children}
        </CodeTheme>
    </Suspense>
}

function $Loading() {
    return <>
        loading...
    </>
}

// TODO: fix any
Code.LineNumber = function LineNumber(props: any) {
    if (!props.children || !props.children.length) {
        return null
    }
    return (
        <>
        <span
            style={{minWidth: `${props.width}ch`}}
            className={$lineNumber.host}
        >
          {props.lineNumber}
        </span>
            <InnerLine merge={props}/>
        </>
    )
}

// TODO: fix any
Code.Mark = function Mark(props: any) {
    return <div className={`${$mark.host} ${props.annotation && $mark.$$annotated}`}>
        <InnerLine
            merge={props}
            className={$mark.line}
        />
    </div>
}

// TODO: fix any
Code.Bg = function CodeLine(props: any) {
    return <span className={`${props.annotation && $mark.$$annotated}`}>
        {props.children}
    </span>
}

Code.Pre = function CodePre(props: {
                                codeblock: HighlightedCode,
                                size?: "full",
                                handlers: AnnotationHandler[]
                            }
) {
    return <Pre
        className={`
            ${$code.host}
            ${props?.size === "full" && $code.host$$full}
        `}
        style={props.codeblock?.style || props.codeblock?.style}
        code={props.codeblock}
        handlers={props.handlers}
    />
}