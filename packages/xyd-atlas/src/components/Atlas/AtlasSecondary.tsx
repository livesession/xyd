import * as React from "react"

import {
    Heading,
    Table,
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
                                <Table key={index}>
                                    <Table.Head>
                                        <Table.Tr>
                                            <Table.Th>Name</Table.Th>
                                            <Table.Th>Type</Table.Th>
                                            <Table.Th>Description</Table.Th>
                                        </Table.Tr>
                                    </Table.Head>
                                    <Table.Body>
                                        {definition.properties?.map((property, propIndex) => (
                                            <Table.Tr key={propIndex}>
                                                <Table.Td>
                                                    <Code>{parseValue(property.name)}</Code>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Code>{parseValue(property.type)}</Code>
                                                </Table.Td>
                                                <Table.Td muted>
                                                    {parseChild(property.description)}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </>
                        })
                    }
                </>
            })
        }
    </>
}