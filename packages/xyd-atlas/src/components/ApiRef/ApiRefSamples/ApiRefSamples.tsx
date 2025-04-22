import React, { useState, useMemo } from "react";

import { Example, ExampleRoot } from "@xyd-js/uniform";
import { CodeSample, type CodeThemeBlockProps } from "@xyd-js/components/coder";

import { MDXReference } from "@/utils/mdx"
import { CodeExampleButtons } from "@/components/Code";
import { useSyntaxHighlight } from "@/components/Atlas/AtlasContext";

import * as cn from "./ApiRefSamples.styles";

export interface ApiRefSamplesProps {
    examples: MDXReference<ExampleRoot>
}

export function ApiRefSamples({ examples }: ApiRefSamplesProps) {
    const syntaxHighlight = useSyntaxHighlight()

    return <atlas-apiref-samples className={cn.ApiRefSamplesContainerHost}>
        {
            examples.groups?.map(({ description, examples: example }, i) => {
                const [activeExampleIndex, setActiveExampleIndex] = useState(0)
                const activeExample = example[activeExampleIndex]

                const codeblocks = activeExample?.codeblock?.tabs?.map(tab => ({
                    value: String(tab.code || ""),
                    lang: String(tab.language || ""),
                    meta: String(tab.context || ""),
                    highlighted: tab.highlighted
                } as CodeThemeBlockProps)) || []

                return <div key={i} className={cn.ApiRefSamplesGroupHost}>
                    {
                        example?.length > 1
                            ? <CodeExampleButtons
                                activeExample={activeExample}
                                examples={example}
                                onClick={(ex) => {
                                    const index = example.findIndex(e => e === ex)
                                    setActiveExampleIndex(index)
                                }}
                            />
                            : null
                    }
                    <CodeSample
                        name={String(i)}
                        description={description?.title || ""}
                        codeblocks={codeblocks}
                        theme={syntaxHighlight || undefined}
                        controlByMeta
                    />
                </div>
            })
        }
    </atlas-apiref-samples>
}