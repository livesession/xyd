import React, {} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
    HighlightedCode,
} from "codehike/code"

import {
    CodeCopy,
} from "../CodeCopy";
import {
    $sample,
    $languages,
} from "./CodeTabs.styles.tsx"; // TODO: style by highlighted?

export interface CodeTabsProps {
    description: string;
    highlighted: HighlightedCode[]
    size?: "full"
}

export function withCodeTabs(PreComponent) {
    return function CodeTabs(props: CodeTabsProps) {
        return (
            <TabsPrimitive.Root
                className={$sample.host}
                style={props.highlighted[0]?.style}
                defaultValue={props.highlighted[0]?.meta}
            >
                <$LanguageTabSwitcher
                    description={props.description}
                    highlighted={props.highlighted}
                />

                {props.highlighted?.map((codeblock, i) => (
                    <TabsPrimitive.Content value={codeblock.meta} key={i}>
                        <PreComponent
                            style={codeblock?.style || codeblock?.style}
                            codeblock={codeblock}
                        />
                    </TabsPrimitive.Content>
                ))}
            </TabsPrimitive.Root>
        )
    }
}

interface LanguageTabSwitcherProps {
    description: string;
    highlighted: HighlightedCode[]
}

function $LanguageTabSwitcher(props: LanguageTabSwitcherProps) {
    return <div className={$languages.host}>
        <$Description description={props.description}/>

        <TabsPrimitive.List className={$languages.list}>
            {props.highlighted?.map(({meta}, i) => (
                <TabsPrimitive.Trigger value={meta!} key={i} className={$languages.button}>
                    {meta}
                </TabsPrimitive.Trigger>
            ))}
        </TabsPrimitive.List>

        <div className={$languages.copy}>
            {props.highlighted?.map((codeblock, i) => (
                <TabsPrimitive.Content value={codeblock.meta!} asChild key={i}>
                    <CodeCopy text={codeblock.value}/>
                </TabsPrimitive.Content>
            ))}
        </div>
    </div>
}

function $Description(props: { description: string }) {
    return <div className={$languages.description}>
        <div className={$languages.description$item}>
            {props.description}
        </div>
    </div>
}


