import React from "react";
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

export interface CodeSampleProps {
    name: string;
    description: string;
    codeblocks: CodeThemeBlockProps[];
    size?: "full"
    theme?: Theme
}

export function CodeSample(props: CodeSampleProps) {
    return <Code codeblocks={props.codeblocks} theme={props.theme}>
        <$ThemedCodeSample {...props}/>
    </Code>
}

function $ThemedCodeSample(props: CodeSampleProps) {
    const {highlighted} = useCodeTheme()

    return <$CodeSampleTabs
        description={props.description}
        highlighted={highlighted}
        size={props.size}
    />
}

const $CodeSampleTabs = withCodeTabs((props) => <Code.Pre
    {...props}
    handlers={[
        annotations.mark,
        annotations.bg,
        annotations.lineNumbers
    ]}
/>)

