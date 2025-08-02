import React, { useState, useEffect } from "react";
import {Tabs as TabsPrimitive} from "radix-ui"; // TODO: remove and use separation
import {
    HighlightedCode,
} from "codehike/code"

import {
    CodeCopy,
} from "../CodeCopy";
import * as cn from "./CodeTabs.styles"; // TODO: style by highlighted?
import { SyntaxHighlightedCode } from "../CodeTheme/CodeTheme";
import { useCodeSampleAnalytics } from "../CodeSample/CodeSampleAnalytics";
import { useUXEvents } from "src/uxEvents";

export interface CodeTabsProps {
    description: string;
    highlighted: SyntaxHighlightedCode[]
    className?: string
    controlByMeta?: boolean // TODO: BETTER IN THE FUTURE
}

export function withCodeTabs(PreComponent) {
    return function CodeTabs(props: CodeTabsProps) {
        const isSingle = props?.highlighted?.length === 1 && !props.description
        const defaultValue = props.highlighted[0]?.meta || props.highlighted[0]?.lang
        const [activeTab, setActiveTab] = useState(defaultValue)

        const codeSampleAnalytics = useCodeSampleAnalytics()
        const ux = useUXEvents()

        // Reset active tab when highlighted prop changes
        useEffect(() => {
            setActiveTab(defaultValue)
        }, [defaultValue])

        useEffect(() => {
            codeSampleAnalytics.setActiveTab(activeTab)
        }, [])

        function changeTab(value: string) {
            setActiveTab(value)
            codeSampleAnalytics.setActiveTab(value)
            ux.CodeTabChange({ tab: value })
        }

        if (props?.highlighted?.length === 0) { 
            return null
        }

        return (
            <xyd-codetabs className={`${cn.CodeTabsHost} ${props.className || ""}`}>
                <TabsPrimitive.Root
                    part="root"
                    data-single={String(isSingle)}
                    data-nodescription={!props.description ? "true" : undefined}
                    className={`${cn.CodeTabsRoot}`}
                    style={props.highlighted[0]?.style}
                    value={activeTab}
                    onValueChange={changeTab}
                >
                    <$LanguageTabSwitcher
                        description={props.description}
                        highlighted={props.highlighted}
                    />

                    {props.highlighted?.map((codeblock, i) => (
                        <TabsPrimitive.Content value={codeblock.meta || codeblock.lang} key={i}>
                            <PreComponent
                                style={codeblock?.style || codeblock?.style}
                                codeblock={codeblock}
                            />
                        </TabsPrimitive.Content>
                    ))}
                </TabsPrimitive.Root>
            </xyd-codetabs>
        )
    }
}

interface LanguageTabSwitcherProps {
    description: string;
    highlighted: HighlightedCode[]
}

function $LanguageTabSwitcher(props: LanguageTabSwitcherProps) {
    const isSingle = props?.highlighted?.length === 1 && !props.description

    const highlighted = props.highlighted.filter((item, index, self) =>
        index === self.findIndex((t) => (t.meta || t.lang) === (item.meta || item.lang))
    );
    return <xyd-codetabs-languages
        data-single={String(isSingle)}
        className={`
        ${cn.CodeTabsLanguagesHost}
    `}>

        {
            props.description && <div part="description">
                <div part="description-item">
                    {props.description}
                </div>
            </div>
        }

        <TabsPrimitive.List part="languages-list">
            {highlighted?.map(({ meta, lang }, i) => {
                if (isSingle) {
                    return null
                }
                return <TabsPrimitive.Trigger
                    part="language-trigger"
                    value={meta || lang}
                    key={i}
                >
                    {meta || lang}
                </TabsPrimitive.Trigger>
            })}
        </TabsPrimitive.List>

        <div part="copy">
            {highlighted?.map((codeblock, i) => (
                <TabsPrimitive.Content value={codeblock.meta || codeblock.lang} asChild key={i}>
                    <CodeCopy text={codeblock.value} />
                </TabsPrimitive.Content>
            ))}
        </div>
    </xyd-codetabs-languages>
}
