import React, {} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
    HighlightedCode,
} from "codehike/code"

import {
    CodeCopy,
} from "../CodeCopy";
import * as cn from "./CodeTabs.styles"; // TODO: style by highlighted?

export interface CodeTabsProps {
    description: string;
    highlighted: HighlightedCode[]
    size?: "full"
}

export function withCodeTabs(PreComponent) {
    return function CodeTabs(props: CodeTabsProps) {
        const isSingle = props.highlighted.length === 1 && !props.description

        return (
            <TabsPrimitive.Root
                className={cn.CodeTabsHost}
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
                            className={`
                                ${isSingle && cn.CodeTabsPreSingle}
                            `}
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
    const isSingle = props.highlighted.length === 1 && !props.description

    return <div className={`
        ${cn.CodeTabsLanguagesHost}
        ${isSingle && cn.CodeTabsLanguagesHostSingle}
    `}>
        <$Description description={props.description}/>

        <TabsPrimitive.List className={cn.CodeTabsLanguagesList}>
            {props.highlighted?.map(({meta}, i) => {
                if (isSingle) {
                    return null
                }
                return <TabsPrimitive.Trigger value={meta!} key={i} className={cn.CodeTabsLanguagesButton}>
                    {meta}
                </TabsPrimitive.Trigger>
            })}
        </TabsPrimitive.List>

        <div className={`
            ${cn.CodeTabsLanguagesCopy}
            ${isSingle && cn.CodeTabsLanguagesCopySingle}
        `}>
            {props.highlighted?.map((codeblock, i) => (
                <TabsPrimitive.Content value={codeblock.meta!} asChild key={i}>
                    <CodeCopy text={codeblock.value}/>
                </TabsPrimitive.Content>
            ))}
        </div>
    </div>
}

function $Description(props: { description: string }) {
    return <div className={cn.CodeTabsLanguagesDescription}>
        <div className={cn.CodeTabsLanguagesDescriptionItem}>
            {props.description}
        </div>
    </div>
}


