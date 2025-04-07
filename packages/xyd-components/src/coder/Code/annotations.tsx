import React from "react";
import {AnnotationHandler} from "codehike/code";

import {Code} from "./Code";

const markAnnotation: AnnotationHandler = {
    name: "mark",
    Line: (props) => {
        return <Code.Mark {...props}/>
    }
}

const bgAnnotation: AnnotationHandler = {
    name: "bg",
    Inline: (props) => {
        return <Code.Bg {...props}/>
    }
}

const lineNumberAnnotation: AnnotationHandler = {
    name: "line-numbers",
    Line: ({annotation, ...props}) => {
        return <Code.LineNumber {...props}/>
    },
}

export const annotations = {
    mark: markAnnotation,
    bg: bgAnnotation,
    lineNumbers: lineNumberAnnotation
}