import React, { useState } from "react";

import { Example, ExampleRoot } from "@xyd-js/uniform";
import { CodeSample } from "@xyd-js/components/coder";

import { MDXReference } from "@/utils/mdx"
import { CodeExampleButtons } from "@/components/Code";
import type { MDXCodeSampleBlock } from "@/components/Code/CodeSample/CodeSample";
import { useSyntaxHighlight } from "@/components/Atlas/AtlasContext";

import * as cn from "./ApiRefSamples.styles";

export interface ApiRefSamplesProps {
    examples: MDXReference<ExampleRoot>
}

export function ApiRefSamples({ examples }: ApiRefSamplesProps) {
    const syntaxHighlight = useSyntaxHighlight()

    return <div className={cn.ApiRefSamplesContainerHost}>
        {
            examples.groups?.map(({ description, examples }, i) => {
                const [activeExample, setActiveExample] = useState<MDXReference<Example> | null>(examples?.[0])

                const codeblocks = activeExample?.codeblock?.tabs?.map(tab => {
                    return tab as any // TODO: !!! FIX !!!
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
    </div>
}