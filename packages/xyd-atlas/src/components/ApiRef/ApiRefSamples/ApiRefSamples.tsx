import React, { useState } from "react";

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
            examples.groups?.map(({ description, examples }, i) => {
                const [activeExample, setActiveExample] = useState<MDXReference<Example> | null>(examples?.[0])

                const codeblocks = activeExample?.codeblock?.tabs?.map(tab => {
                    return { // TODO: FIX TYPES !!!!
                        value: tab.code || "",
                        lang: tab.language || "",
                        meta: tab.context || "",

                        // @ts-ignore
                        highlighted: tab.highlighted
                    } as unknown as CodeThemeBlockProps // TODO: !!! FIX !!!
                })

                return <div key={i} className={cn.ApiRefSamplesGroupHost}>
                    {
                        examples?.length > 1
                            ? <CodeExampleButtons
                                activeExample={activeExample}
                                examples={examples}
                                onClick={(example) => {
                                    setActiveExample(example)
                                }}
                            />
                            : null
                    }
                    <CodeSample
                        name={String(i)}
                        description={description?.title || ""}
                        codeblocks={codeblocks || []}
                        theme={syntaxHighlight || undefined}
                    />
                </div>
            })
        }
    </atlas-apiref-samples>
}