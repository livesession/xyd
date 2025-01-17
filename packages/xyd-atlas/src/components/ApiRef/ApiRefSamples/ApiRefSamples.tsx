import {Example, ExampleRoot} from "@xyd-js/uniform";
import React, {useState} from "react";

import {MDXReference} from "@/utils/mdx"
import {CodeExampleButtons, CodeSample} from "@/components/Code";
import type {MDXCodeSampleBlock} from "@/components/Code/CodeSample/CodeSample";

import {
    $container,
    $group
} from "./ApiRefSamples.styles";

export interface ApiRefSamplesProps {
    examples: MDXReference<ExampleRoot>
}

export function ApiRefSamples({examples}: ApiRefSamplesProps) {
    return <div className={$container.host}>
        {
            examples.groups.map(({description, examples}, i) => {
                const [activeExample, setActiveExample] = useState<MDXReference<Example> | null>(examples?.[0])

                const codeblocks = activeExample?.codeblock?.tabs?.map(tab => {
                    return tab.code as unknown as MDXCodeSampleBlock // TODO: because atlas use mdx uniform reference - we need to unify it !!!
                })

                return <div key={i} className={$group.host}>
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
                    />
                </div>
            })
        }
    </div>
}