import React, { useState, useMemo } from "react";
import { UXNode } from "openux-js";

import { ExampleRoot } from "@xyd-js/uniform";
import { CodeSample, type CodeThemeBlockProps } from "@xyd-js/components/coder";

import { CodeExampleButtons } from "@/components/Code";
import { useSyntaxHighlight } from "@/components/Atlas/AtlasContext";

import * as cn from "./ApiRefSamples.styles";

export interface ApiRefSamplesProps {
    examples: ExampleRoot
}

export function ApiRefSamples({ examples }: ApiRefSamplesProps) {
    const syntaxHighlight = useSyntaxHighlight()
    const [activeExampleIndices, setActiveExampleIndices] = useState<Record<number, number>>({})

    const handleExampleChange = (groupIndex: number, exampleIndex: number) => {
        setActiveExampleIndices(prev => ({
            ...prev,
            [groupIndex]: exampleIndex
        }))
    }

    return <atlas-apiref-samples className={cn.ApiRefSamplesContainerHost}>
        {
            examples.groups?.map(({ description, examples: example }, i) => {
                const activeExampleIndex = activeExampleIndices[i] || 0
                const activeExample = example[activeExampleIndex]

                const codeblocks = activeExample?.codeblock?.tabs?.map(tab => ({
                    value: String(tab.code || ""),
                    lang: String(tab.language || ""),
                    meta: String(tab.context || ""),
                    highlighted: tab.highlighted
                } as CodeThemeBlockProps)) || []

                return <UXNode
                    name="APIRefSample"
                    props={activeExample}
                >
                    <div key={i} className={cn.ApiRefSamplesGroupHost}>
                        {
                            example?.length > 1
                                ? <CodeExampleButtons
                                    activeExample={activeExample}
                                    examples={example}
                                    onClick={(ex) => {
                                        const index = example.findIndex(e => e === ex)
                                        handleExampleChange(i, index)
                                    }}
                                />
                                : null
                        }
                        <CodeSample
                            name={String(i)}
                            description={description || ""}
                            codeblocks={codeblocks}
                            theme={syntaxHighlight || undefined}
                        // controlByMeta
                        />
                    </div>
                </UXNode>
            })
        }
    </atlas-apiref-samples>
}