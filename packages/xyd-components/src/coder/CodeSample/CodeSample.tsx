import React, {useEffect, useState} from "react";
import {Theme} from "@code-hike/lighter";

import type {CodeThemeBlockProps} from "../CodeTheme";

import {
    Code,
    annotations,
} from "../Code"
import {
    withCodeTabs
} from "../CodeTabs";
import {useCodeTheme} from "../CodeTheme";
import {useCoder} from "../CoderProvider";
import {CodeSampleAnalytics} from "./CodeSampleAnalytics";

export interface CodeSampleProps {
    name: string;
    description: string;
    codeblocks?: CodeThemeBlockProps[];
    theme?: Theme
    size?: "full"
    lineNumbers?: boolean
    descriptionHead?: string
    descriptionContent?: string | React.ReactNode
    descriptionIcon?: string
    markdownFormat?: boolean
    kind?: "secondary"
    controlByMeta?: boolean // TODO: BETTER IN THE FUTURE
}

export const CodeContext = React.createContext<{
    size?: "full"
    lineNumbers?: boolean
    descriptionHead?: string
    descriptionContent?: string | React.ReactNode
    descriptionIcon?: string
    markdownFormat?: boolean
}>({})

export function CodeSample(props: CodeSampleProps) {
    return <CodeSampleAnalytics>
        <Code
            codeblocks={props.codeblocks}
            theme={props.theme}
        >
            <$ThemedCodeSample {...props} />
        </Code>
    </CodeSampleAnalytics>
}

function $ThemedCodeSample(props: CodeSampleProps) {
    const {highlighted} = useCodeTheme()
    const coder = useCoder()

    if (props.kind === "secondary") {
        return <CodeContext value={{
            size: props.size,
            lineNumbers: props.lineNumbers,
            descriptionHead: props.descriptionHead,
            descriptionContent: props.descriptionContent,
            descriptionIcon: props.descriptionIcon,
            markdownFormat: props.markdownFormat,
        }}>
            <Code.Pre
                codeblock={highlighted[0]}
                handlers={[
                    annotations.mark,
                    annotations.bg,
                    annotations.lineNumbers
                ]}
            />
        </CodeContext>
    }

    let size: "full" | undefined = undefined
    if (typeof props.size === "string") {
        size = props.size
    } else if (typeof coder.scroll === "boolean" && !coder.scroll) {
        size = "full"
    }

    const lineNumbers = props.lineNumbers ?? coder.lines

    return <CodeContext value={{
        size,
        lineNumbers,
        descriptionHead: props.descriptionHead,
        descriptionContent: props.descriptionContent,
        descriptionIcon: props.descriptionIcon,
        markdownFormat: props.markdownFormat,
    }}>
        <$CodeSampleTabs
            description={props.description}
            highlighted={highlighted}
            controlByMeta={props.controlByMeta}
        />
    </CodeContext>
}

const $CodeSampleTabs = withCodeTabs((props) => {
    const {lineNumbers, size, descriptionHead, descriptionContent, descriptionIcon} = React.useContext(CodeContext)
    const handlers = [
        annotations.mark,
        annotations.bg,
        annotations.diff
    ]

    if (lineNumbers) {
        handlers.push(annotations.lineNumbers)
    }

    return <Code.Pre
        {...props}
        descriptionHead={descriptionHead}
        descriptionContent={descriptionContent}
        descriptionIcon={descriptionIcon}
        size={size}
        handlers={handlers}
    />
})

