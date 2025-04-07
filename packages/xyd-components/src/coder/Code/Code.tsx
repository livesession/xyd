import React, {Suspense} from "react";
import type {HighlightedCode, AnnotationHandler} from "codehike/code";
import {InnerLine, Pre} from "codehike/code";
import {Theme} from "@code-hike/lighter";

import {CodeTheme, type CodeThemeBlockProps} from "../CodeTheme";
import * as cn from "./Code.styles";
import {CodeLoader} from "./CodeLoader";

export interface CodeProps {
    codeblocks: CodeThemeBlockProps[];
    theme?: Theme
    children: React.ReactNode
}

export function Code(props: CodeProps) {
    return <Suspense fallback={<CodeLoader/>}>
        <CodeTheme codeblocks={props.codeblocks} theme={props.theme}>
            {props.children}
        </CodeTheme>
    </Suspense>
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
            className={cn.LineNumberHost}
        >
          {props.lineNumber}
        </span>
            <InnerLine merge={props}/>
        </>
    )
}

// TODO: fix any
Code.Mark = function Mark(props: any) {
    return <div className={`${cn.MarkHost} ${props.annotation && cn.MarkAnnotated}`}>
        <InnerLine
            merge={props}
            className={cn.MarkLine}
        />
    </div>
}

// TODO: fix any
Code.Bg = function CodeLine(props: any) {
    return <span className={`${props.annotation && cn.MarkAnnotated}`}>
        {props.children}
    </span>
}

Code.Pre = function CodePre(props: {
                                codeblock: HighlightedCode,
                                size?: "full",
                                handlers: AnnotationHandler[],
                                className?: string,
                            }
) {
    return <Pre
        className={`
            ${cn.CodeHost}
            ${props?.size === "full" && cn.CodeHostFull}
            ${props.className}
        `}
        style={props.codeblock?.style || props.codeblock?.style}
        code={props.codeblock}
        handlers={props.handlers}
    />
}