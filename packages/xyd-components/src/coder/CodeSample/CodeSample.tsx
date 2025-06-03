import React from "react";
import { Theme } from "@code-hike/lighter";

import type { CodeThemeBlockProps } from "../CodeTheme";

import {
    Code,
    annotations,
} from "../Code"
import {
    withCodeTabs
} from "../CodeTabs";
import { useCodeTheme } from "../CodeTheme";

export interface CodeSampleProps {
    name: string;
    description: string;
    codeblocks?: CodeThemeBlockProps[];
    theme?: Theme
    size?: "full"
    kind?: "secondary"
    controlByMeta?: boolean // TODO: BETTER IN THE FUTURE
}

export function CodeSample(props: CodeSampleProps) {
    return <Code
        codeblocks={props.codeblocks}
        theme={props.theme}
    >
        <$ThemedCodeSample {...props} />
    </Code>
}

function $ThemedCodeSample(props: CodeSampleProps) {
    const { highlighted } = useCodeTheme()

    if (props.kind === "secondary") {
        return <Code.Pre
            codeblock={highlighted[0]}
            handlers={[
                annotations.mark,
                annotations.bg,
                annotations.lineNumbers
            ]}
        />
    }

    return <$CodeSampleTabs
        description={props.description}
        highlighted={highlighted}
        size={props.size}
        controlByMeta={props.controlByMeta}
    />
}

const $CodeSampleTabs = withCodeTabs((props) => <Code.Pre
    {...props}
    handlers={[
        annotations.mark,
        annotations.bg,
        annotations.lineNumbers,
        annotations.diff
    ]}
/>)

