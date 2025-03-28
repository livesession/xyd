import React, {useState, useEffect} from 'react';
import type {Meta} from '@storybook/react';

import {Reference} from '@xyd-js/uniform';
import {
    CodeSample,
} from '@xyd-js/components/coder';
import {
    TableV2
} from "@xyd-js/components/writer";
import {LayoutPrimary} from "@xyd-js/components/layouts";
import getContentComponents from "@xyd-js/components/content"
import {AtlasIndex} from "@xyd-js/atlas/atlas-index"

import AtlasIndexContent from "../../content/atlas-index.mdx"
import PackageIndexContent from "../../content/atlas-index/package-index.mdx"
import PackageIndexWip1Content from "../../content/atlas-index/wip1.mdx"

import {
    DemoNavbar,
    DemoSubNav,
    DemoSidebar,
    DemoContent,
    DemoTOC
} from "../../components/DemoWireframe";

export default {
    title: 'Atlas/AtlasIndex',
    component: AtlasIndex,
} as Meta;

const contentComponents = getContentComponents()

const Content = {
    Text: contentComponents.p,
    Details: contentComponents.Details,
    IconQuote: contentComponents.IconQuote,
    Code: contentComponents.code,
    Heading2: contentComponents.h2,
    Container: contentComponents.Content,
    CodeSample: contentComponents.CodeSample
}

export const Default = () => {
    return <LayoutPrimary
        header={<DemoNavbar/>}
        subheader={<DemoSubNav/>}
        aside={<DemoSidebar/>}
        content={
            // <FakeContent/>
            <UniformToAtlasIndex data={exampleUniform}/>
        }
        contentNav={<DemoTOC/>}
        layoutSize="large"
    />
}

function FakeContent() {
    return <DemoContent breadcrumbs={false}>
        {<PackageIndexWip1Content components={{
            ...contentComponents,
            pre: Pre,
            TableV2
        }}/>}
    </DemoContent>
}

function UniformToAtlasIndex({data}: { data: Reference }) {
    return <Content.Container>
        <Content.Text>
            {data.description}
        </Content.Text>

        {
            data.context?.fileName && <Content.Details
                label=""
                kind="tertiary"
                title={<>
                    Souce code in <Content.Code>{data.context.fileFullPath}</Content.Code>
                </>}
                icon={<Content.IconQuote/>}>
                <Content.CodeSample
                    name={data.context.fileFullPath}
                    description={""}
                    codeblocks={[
                        {
                            value: data.context.sourcecode, 
                            lang: data.context.fileFullPath.split(".").pop() || "",
                            meta: ""
                        }
                    ]}
                />
            </Content.Details>
        }

        {/* TODO: see also table*/}

        {
            data.definitions.map((definition, index) => {
                return <>
                    <Content.Heading2>
                        {definition.title}
                    </Content.Heading2>
                    <TableV2 key={index}>
                        <TableV2.Head>
                            <TableV2.Tr>
                                <TableV2.Th>Type</TableV2.Th>
                                <TableV2.Th>Description</TableV2.Th>
                            </TableV2.Tr>
                        </TableV2.Head>
                        {definition.properties.map((property, propIndex) => (
                            <TableV2.Tr key={propIndex}>
                                <TableV2.Td>
                                    <Content.Code>{property.name || property.type}</Content.Code>
                                </TableV2.Td>
                                <TableV2.Td muted>{property.description}</TableV2.Td>
                            </TableV2.Tr>
                        ))}
                    </TableV2>
                </>
            })
        }
    </Content.Container>
}

function Pre({children, ...rest}: { children: React.ReactNode }) {
    const codeElement = children as any
    if (!children) {
        return null
    }

    const {className, children: codeChildren} = codeElement.props;
    const language = className?.replace('language-', '') || '';
    const codeContent = codeChildren || '';

    return <CodeSample
        name={language}
        description={""}
        codeblocks={[
            {
                value: codeContent,
                lang: language,
                meta: language,
            }
        ]}
        size="full"
        kind="secondary"
    />
}

const exampleUniform =   {
    "title": "Function gqlSchemaToReferences",
    "canonical": "fn-gqlSchemaToReferences",
    "description": "Converts a GraphQL schema file to references.\n",
    "context": {
      "fileName": "index.ts",
      "fileFullPath": "src/index.ts",
      "line": 48,
      "col": 16,
      "signatureText": "export function gqlSchemaToReferences(schemaLocation: string): Promise<[\n]>;",
      "sourcecode": "export function gqlSchemaToReferences(\n    schemaLocation: string\n): Promise<[]> {\n    if (schemaLocation.endsWith(\".graphql\")) {\n        return Promise.resolve([])\n    }\n\n    return Promise.resolve([])\n}",
      "package": "@xyd-sources-examples/package-a"
    },
    "examples": {
      "groups": []
    },
    "definitions": [
      {
        "title": "Returns",
        "properties": [
          {
            "name": "",
            "type": "<Promise>",
            "description": "references\n"
          }
        ]
      },
      {
        "title": "Parameters",
        "properties": [
          {
            "name": "schemaLocation",
            "type": "string",
            "description": "The location of the schema file.\n"
          }
        ]
      }
    ]
  } as Reference