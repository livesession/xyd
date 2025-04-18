import * as React from "react"

import {
    Heading,
    Table,
    Details,
    Code,

    IconQuote
} from "@xyd-js/components/writer";

import {CommonAtlasProps} from "@/components/Atlas/types";
import {uniformValue, uniformChild} from "@/utils/mdx";
import {CodeSample} from "@xyd-js/components/coder";
import {useSyntaxHighlight} from "./AtlasContext";

// TODO: interface should be imported from somewhere
interface CodeSourceContext {
    fileName: string;
    fileFullPath: string;
    sourcecode: string;
}

export function AtlasSecondary({references}: CommonAtlasProps<CodeSourceContext>) {
    const syntaxHighlight = useSyntaxHighlight()

    return <>
        {
            references?.map((reference, i) => {
                return <>
                    <Heading size={1}>
                        {uniformValue(reference.title)}
                    </Heading>

                    {/*<p>*/}
                    {/*    {uniformChild(reference.description)}*/}
                    {/*</p>*/}

                    {
                        uniformValue(reference.context?.fileName) && <Details
                            label=""
                            kind="tertiary"
                            title={<>
                                Source code in <Code>{uniformValue(reference.context.fileFullPath)}</Code>
                            </>}
                            icon={<IconQuote/>}>
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
                                    {uniformValue(definition.title)}
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
                                                    <Code>{uniformValue(property.name)}</Code>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Code>{uniformValue(property.type)}</Code>
                                                </Table.Td>
                                                <Table.Td muted>
                                                    {uniformChild(property.description)}
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