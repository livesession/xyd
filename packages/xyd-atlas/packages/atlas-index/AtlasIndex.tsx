import * as React from "react"

import type {Reference} from "@xyd-js/uniform";
import {
    Heading,
    TableV2,
    Details,
    Code,

    IconQuote
} from "@xyd-js/components/writer";
import {
    helperContent
} from "@xyd-js/components/content";

import {MDXReference, mdxValue} from "@/utils/mdx";

const {Content} = helperContent()

// TODO: interface should be imported from somewhere
interface CodeSourceContext {
    fileName: string;
    fileFullPath: string;
    sourcecode: string;
}

interface AtlasIndexProps {
    data: MDXReference<Reference<CodeSourceContext>>
}

export function AtlasIndex({data}: AtlasIndexProps) {
    return <Content>
        <Heading size={1}>
            {mdxValue(data.title)}
        </Heading>

        <p>
            {data.description.children}
        </p>

        {
            mdxValue(data.context?.fileName) && <Details
                label=""
                kind="tertiary"
                title={<>
                    Source code in <Code>{mdxValue(data.context.fileFullPath)}</Code>
                </>}
                icon={<IconQuote/>}>
                {data.context.sourcecode.children}
            </Details>
        }

        {
            data.definitions.map((definition, index) => {
                return <>
                    <Heading size={2}>
                        {mdxValue(definition.title)}
                    </Heading>
                    <TableV2 key={index}>
                        <TableV2.Head>
                            <TableV2.Tr>
                                <TableV2.Th>Type</TableV2.Th>
                                <TableV2.Th>Description</TableV2.Th>
                            </TableV2.Tr>
                        </TableV2.Head>
                        {definition.properties?.map((property, propIndex) => (
                            <TableV2.Tr key={propIndex}>
                                <TableV2.Td>
                                    <Code>{mdxValue(property.name) || mdxValue(property.type)}</Code>
                                </TableV2.Td>
                                <TableV2.Td muted>{property?.children}</TableV2.Td>
                            </TableV2.Tr>
                        ))}
                    </TableV2>
                </>
            })
        }
    </Content>
}