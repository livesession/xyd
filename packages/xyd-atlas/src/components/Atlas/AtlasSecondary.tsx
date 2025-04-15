import * as React from "react"

import {
    Heading,
    TableV2,
    Details,
    Code,

    IconQuote
} from "@xyd-js/components/writer";

import { CommonAtlasProps } from "@/components/Atlas/types";
import { MDXReferenceWrapper, mdxValue } from "@/utils/mdx";
import { CodeSample } from "@xyd-js/components/coder";
import { useSyntaxHighlight } from "./AtlasContext";

// TODO: interface should be imported from somewhere
interface CodeSourceContext {
    fileName: string;
    fileFullPath: string;
    sourcecode: string;
}

export function AtlasSecondary({ references, mdx }: CommonAtlasProps<CodeSourceContext>) {
    if (references && typeof references === "string") { // TODO: DO IT BETTER
        try {
            references = JSON.parse(references)
        } catch (error) {
            console.error("Error parsing references", error)
        }
    }

    // TODO: DO IT BETTER
    function parseValue<T extends MDXReferenceWrapper<T>>(v: T) {
        if (mdx) {
            return v
        }

        return mdxValue(v)
    }

    // TODO: DO IT BETTER
    function parseChild<V extends MDXReferenceWrapper<V>>(v: V) {
        if (mdx) {
            return v
        }

        return v?.children || v
    }

    const syntaxHighlight = useSyntaxHighlight()

    return <>
        {
            references?.map((reference, i) => {
                return <>
                    <Heading size={1}>
                        {parseValue(reference.title)}
                    </Heading>

                    {/* <p>
                        {parseChild(reference.description)}
                    </p> */}

                    {
                        parseValue(reference.context?.fileName) && <Details
                            label=""
                            kind="tertiary"
                            title={<>
                                Source code in <Code>{parseValue(reference.context.fileFullPath)}</Code>
                            </>}
                            icon={<IconQuote />}>
                            <CodeSample
                                name={reference.context.fileName}
                                description={reference.context.sourcecode.description}
                                theme={syntaxHighlight || undefined}
                                codeblocks={[
                                    {
                                        lang: reference.context.sourcecode.lang,
                                        meta: "",
                                        value: reference.context.sourcecode.code
                                    }
                                ]}
                            />
                            {/* {parseChild(reference.context.sourcecode)} */}
                        </Details>
                    }

                    {
                        reference.definitions.map((definition, index) => {
                            return <>
                                <Heading size={2}>
                                    {parseValue(definition.title)}
                                </Heading>
                                <TableV2 key={index}>
                                    <TableV2.Head>
                                        <TableV2.Tr>
                                            <TableV2.Th>Name</TableV2.Th>
                                            <TableV2.Th>Type</TableV2.Th>
                                            <TableV2.Th>Description</TableV2.Th>
                                        </TableV2.Tr>
                                    </TableV2.Head>
                                    <TableV2.Body>
                                        {definition.properties?.map((property, propIndex) => (
                                            <TableV2.Tr key={propIndex}>
                                                <TableV2.Td>
                                                    <Code>{parseValue(property.name)}</Code>
                                                </TableV2.Td>
                                                <TableV2.Td>
                                                    <Code>{parseValue(property.type)}</Code>
                                                </TableV2.Td>
                                                <TableV2.Td muted>
                                                    {parseChild(property.description)}
                                                </TableV2.Td>
                                            </TableV2.Tr>
                                        ))}
                                    </TableV2.Body>
                                </TableV2>
                            </>
                        })
                    }
                </>
            })
        }
    </>
}