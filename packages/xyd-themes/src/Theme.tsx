import React from "react"

import { useMetadata } from "@xyd-js/framework/react";
import { type AtlasProps } from "@xyd-js/atlas";

import { VarCode } from "@xyd-js/content";
import { ExampleRoot } from "@xyd-js/uniform";
import { Callout } from "@xyd-js/components/writer";

import { metaComponent } from './decorators';

interface AtlasVars {
    examples?: VarCode
}

// TODO: get object from atlas
// Define the type for an example object
interface ExampleObject {
    codeblock: {
        title: string;
        tabs: {
            title: string;
            language: string;
            code: string;
            highlighted: any; // TODO: fix
        }[];
    };
}

// Define the type for an example group
interface ExampleGroup {
    examples: ExampleObject[];
}

export abstract class Theme {
    protected useHideToc() {
        const meta = useMetadata()

        if (!meta) {
            return false
        }

        switch (meta.layout) {
            case "wide":
                return true
            case "center":
                return true
            default:
                return false
        }
    }

    protected useLayoutSize() {
        const meta = useMetadata()

        if (!meta) {
            return undefined
        }

        switch (meta.layout) {
            case "wide":
                return "large"
            default:
                return undefined
        }
    }

    @metaComponent<AtlasProps, AtlasVars>("atlas", "Atlas")
    private atlasMetaComponent(
        props: AtlasProps,
        vars: AtlasVars
    ) {
        const examples: ExampleRoot = {
            groups: []
        }

        // console.log(vars, 9933)
        const oneExample = vars.examples?.length === 1 && !Array.isArray(vars.examples[0])

        // Helper function to create an example object
        function createExampleObject(example: any): ExampleObject {
            // Extract the highlighted property correctly
            const highlighted = example.highlighted || example;
            
            return {
                codeblock: {
                    title: example.meta,
                    tabs: [
                        {
                            title: example.meta,
                            language: example.lang,
                            code: example.code,
                            highlighted: highlighted
                        }
                    ]
                }
            };
        }

        if (oneExample) {
            const example = vars.examples?.[0]
            if (Array.isArray(example) || !example) {
                return
            }
            
            examples.groups.push({
                examples: [createExampleObject(example)]
            })
        } else {
            // Process each example or group of examples
            vars.examples?.forEach((item) => {
                if (Array.isArray(item)) {
                    // This is a group with a title as the first element
                    const groupTitle = item[0];
                    const groupExamples = item.slice(1);
                    
                    const exampleGroup: ExampleGroup = {
                        examples: []
                    };
                    
                    // Process each example in the group
                    groupExamples.forEach((example) => {
                        if (example && typeof example === 'object') {
                            exampleGroup.examples.push(createExampleObject(example));
                        }
                    });
                    
                    if (exampleGroup.examples.length > 0) {
                        examples.groups.push(exampleGroup);
                    }
                } else if (item && typeof item === 'object') {
                    // This is a single example
                    const exampleGroup: ExampleGroup = {
                        examples: [createExampleObject(item)]
                    };
                    
                    examples.groups.push(exampleGroup);
                }
            });
        }

        // const exampleDom2 = <Callout>hello hello im cool xD</Callout>
        // // @ts-ignore
        // props.references[0].description = JSON.stringify(exampleDom2)

        // // Assign the examples to the references
        // @ts-ignore
        props.references[0].description = {
            children: <div><h1>Heading 1</h1></div>
        }
        props.references[0].examples = examples;
        return props
        // TODO: in the future return a component directly here but we need good mechanism for transpiling?
    }

    public components() {
        return {
            Atlas2: Atlas
        }
    }
}

function Atlas(props) {
    console.log("IM INSIDE COMPONENT33", props)

    return <div>
        Hello World
    </div>
}
