import React from "react";
import { AnnotationHandler, BlockAnnotation, InnerLine } from "codehike/code";

import { Code } from "./Code";

const markAnnotation: AnnotationHandler = {
    name: "mark",
    Line: (props) => {
        return <Code.Mark {...props} />
    },
    Inline: (props) => {
        return <Code.MarkInline {...props} />
    },
}

const bgAnnotation: AnnotationHandler = {
    name: "bg",
    Inline: (props) => {
        return <Code.Bg {...props} />
    }
}

const lineNumberAnnotation: AnnotationHandler = {
    name: "line-numbers",
    Line: ({ annotation, ...props }) => {
        return <Code.LineNumber {...props} />
    },
}

export const diffAnnotation: AnnotationHandler = {
    name: "diff",
    onlyIfAnnotated: true,
    transform: (annotation: BlockAnnotation) => {
        return [annotation, { ...annotation, name: "mark", query: annotation.query, diff: true }]
    },
    Line: ({ annotation, ...props }) => (
        <>
            <div>
                {annotation?.query}
            </div>
            <InnerLine merge={props} />
        </>
    ),
}

export const annotations = {
    mark: markAnnotation,
    bg: bgAnnotation,
    lineNumbers: lineNumberAnnotation,
    diff: diffAnnotation
}