import * as React from "react"

import {type Theme} from "@code-hike/lighter";

import {
    Heading,
    Table,
    Details,
    Code,
} from "@xyd-js/components/writer";
import {CodeSample} from "@xyd-js/components/coder";

import {MDXCommonAtlasProps} from "@/components/Atlas/types";
import {useSyntaxHighlight} from "./AtlasContext";
import {IconQuote} from "@/components/Icon";

// TODO: interface should be imported from somewhere
interface CodeSourceContext {
    fileName: string;
    fileFullPath: string;
    sourcecode: string;
}

const MAX_REFERENCES = 2;

interface ReferenceItemProps {
    reference: any;
    index: number;
    syntaxHighlight: Theme | null;
}


export function AtlasSecondary<T>({references}: MDXCommonAtlasProps<T>) {
    const syntaxHighlight = useSyntaxHighlight()

    if (!references) return null;

    const initialReferences = references.slice(0, MAX_REFERENCES);
    const remainingReferences = references.slice(MAX_REFERENCES);

    const showMoreText = remainingReferences.length > 0 ?
        `Show more (${remainingReferences.length}) reference${remainingReferences.length === 1 ? '' : 's'}` :
        '';

    return (
        <>
            {initialReferences.map((reference, i) => (
                <$ReferenceItem
                    key={i}
                    reference={reference}
                    index={i}
                    syntaxHighlight={syntaxHighlight}
                />
            ))}

            {remainingReferences.length > 0 && (
                <Details
                    label={showMoreText}
                >
                    {remainingReferences.map((reference, i) => (
                        <$ReferenceItem
                            key={i + MAX_REFERENCES}
                            reference={reference}
                            index={i + MAX_REFERENCES}
                            syntaxHighlight={syntaxHighlight}
                        />
                    ))}
                </Details>
            )}
        </>
    )
}

function $ReferenceItem({reference, index, syntaxHighlight}: ReferenceItemProps) {
    return (
        <React.Fragment key={index}>
            <Heading size={3}>
                {reference.title}
            </Heading>

            {/*<p>*/}
            {/*    {uniformChild(reference.description)}*/}
            {/*</p>*/}

            {
                reference.context?.fileName && <Details
                    label=""
                    kind="tertiary"
                    title={<>
                        Source code in <Code>{reference.context.fileFullPath}</Code>
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
                reference.definitions.map((definition: any, index: number) => {
                    return (
                        <React.Fragment key={index}>
                            <Heading size={4}>
                                {definition.title}
                            </Heading>
                            <Table>
                                <Table.Head>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Type</Table.Th>
                                        <Table.Th>Description</Table.Th>
                                    </Table.Tr>
                                </Table.Head>
                                <Table.Body>
                                    {definition.properties?.map((property: any, propIndex: number) => (
                                        <Table.Tr key={propIndex}>
                                            <Table.Td>
                                                <Code>{property.name}</Code>
                                            </Table.Td>
                                            <Table.Td>
                                                <Code>{property.type}</Code>
                                            </Table.Td>
                                            <Table.Td muted>
                                                {property.description}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Body>
                            </Table>
                        </React.Fragment>
                    )
                })
            }

            <br/>
        </React.Fragment>
    )
}
