import React, { } from "react";
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
    className?: string
}

export function withCodeTabs(PreComponent) {
    return function CodeTabs(props: CodeTabsProps) {
        const isSingle = props.highlighted.length === 1 && !props.description

        if (props.highlighted.length === 0) { // TODO: suspense?
            return null
        }

        return (
            <TabsPrimitive.Root
                data-element="xyd-code-tabs"
                data-single={isSingle}
                className={`${cn.CodeTabsHost} ${props.className || ""}`}
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
                            data-part="pre"
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
    const isSingle = props.highlighted.length === 1 && !props.description

    return <div
        data-element="xyd-code-tabs-languages"
        data-single={isSingle}
        className={`
        ${cn.CodeTabsLanguagesHost}
    `}>
        <div data-part="description">
            <div data-part="description-item">
                {props.description}
            </div>
        </div>

        <TabsPrimitive.List data-part="languages-list">
            {props.highlighted?.map(({ meta }, i) => {
                if (isSingle) {
                    return null
                }
                return <TabsPrimitive.Trigger
                    data-part="language-trigger"
                    value={meta!}
                    key={i}
                >
                    {meta}
                </TabsPrimitive.Trigger>
            })}
        </TabsPrimitive.List>

        <div data-part="copy">
            {props.highlighted?.map((codeblock, i) => (
                <TabsPrimitive.Content value={codeblock.meta!} asChild key={i}>
                    <CodeCopy text={codeblock.value} />
                </TabsPrimitive.Content>
            ))}
        </div>
    </div>
}
