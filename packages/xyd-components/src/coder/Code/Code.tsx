import React, { Suspense } from "react";
import type { HighlightedCode, AnnotationHandler } from "codehike/code";
import { InnerLine, Pre } from "codehike/code";
import { Theme } from "@code-hike/lighter";

import { CodeTheme, type CodeThemeBlockProps } from "../CodeTheme";
import * as cn from "./Code.styles";
import { CodeLoader } from "./CodeLoader";

export interface CodeProps {
    codeblocks?: CodeThemeBlockProps[];
    theme?: Theme
    children: React.ReactNode
}

export function Code(props: CodeProps) {
    return <Suspense fallback={<CodeLoader />}>
        <CodeTheme
            codeblocks={props.codeblocks}
            theme={props.theme}
        >
            {props.children}
        </CodeTheme>
    </Suspense>
}

// TODO: fix any
Code.LineNumber = function CodeLineNumber(props: any) {
    if (!props.children || !props.children.length) {
        return null
    }
    return (
        <div
            data-element="xyd-code-linenumber"
            className={cn.LineNumberHost}
            style={{ minWidth: `${props.width}ch` }}
        >
            <span
                data-part="line-number"
            >
                {props.lineNumber}
            </span>
            <InnerLine merge={props} />
        </div>
    )
}

// TODO: fix any
Code.Mark = function CodeMark(props: any) {
    return <div
        data-element="xyd-code-mark"
        data-annotated={!!props.annotation}
        className={`${cn.MarkHost}`}
    >
        <InnerLine
            data-part="line"
            merge={props}
        />
    </div>
}

// TODO: fix any
Code.Bg = function CodeLine(props: any) {
    return <span
        data-element="xyd-code-bg"
        data-annotated={!!props.annotation}
        className={`${cn.Bg}`}
    >
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
    const {
        size,
        className,
        codeblock,
        handlers,
        ...rest
    } = props;

    // TODO: support import { getThemeColors } from "@code-hike/lighter";
    return <Pre
        data-element="xyd-code-pre"
        data-size={size}
        style={codeblock?.style || codeblock?.style}
        className={`${cn.CodeHost} ${className || ""}`}
        code={codeblock}
        handlers={handlers}
        {...rest}
    />
}