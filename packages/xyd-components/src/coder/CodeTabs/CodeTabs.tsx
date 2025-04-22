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
    controlByMeta?: boolean // TODO: BETTER IN THE FUTURE
}

export function withCodeTabs(PreComponent) {
    return function CodeTabs(props: CodeTabsProps) {
        const isSingle = props.highlighted.length === 1 && !props.description

        if (props.highlighted.length === 0) { // TODO: suspense?
            return null
        }

        return (
            <xyd-codetabs className={`${cn.CodeTabsHost} ${props.className || ""}`}>
                <TabsPrimitive.Root
                    part="root"
                    data-single={String(isSingle)}
                    className={`${cn.CodeTabsRoot}`}
                    style={props.highlighted[0]?.style}
                    defaultValue={props.highlighted[0]?.meta}
                    value={props.controlByMeta ? props.highlighted[0]?.meta : undefined}
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
            </xyd-codetabs>
        )
    }
}

interface LanguageTabSwitcherProps {
    description: string;
    highlighted: HighlightedCode[]
}

function $LanguageTabSwitcher(props: LanguageTabSwitcherProps) {
    const isSingle = props.highlighted.length === 1 && !props.description

    return <xyd-codetabs-languages
        data-single={String(isSingle)}
        className={`
        ${cn.CodeTabsLanguagesHost}
    `}>
        <div part="description">
            <div part="description-item">
                {props.description}
            </div>
        </div>

        <TabsPrimitive.List part="languages-list">
            {props.highlighted?.map(({ meta }, i) => {
                if (isSingle) {
                    return null
                }
                return <TabsPrimitive.Trigger
                    part="language-trigger"
                    value={meta!}
                    key={i}
                >
                    {meta}
                </TabsPrimitive.Trigger>
            })}
        </TabsPrimitive.List>

        <div part="copy">
            {props.highlighted?.map((codeblock, i) => (
                <TabsPrimitive.Content value={codeblock.meta!} asChild key={i}>
                    <CodeCopy text={codeblock.value} />
                </TabsPrimitive.Content>
            ))}
        </div>
    </xyd-codetabs-languages>
}
