import {OpenAPIV3} from "openapi-types";
import matter from 'gray-matter'

import {Metadata} from "@xyd-js/core";
import {
    Definition,
    ExampleGroup,
    Reference,
    ReferenceCategory,
    OpenAPIReferenceContext,
    DefinitionVariantOpenAPIMeta,
    DefinitionVariant,
    DefinitionOpenAPIMeta,
} from "@xyd-js/uniform";

import {oapParametersToDefinitionProperties} from "./parameters";
import {oapRequestBodyToDefinitionProperties} from "./requestBody";
import {oapResponseToDefinitionProperties} from "./responses";
import {
    httpMethodToUniformMethod,
    slug
} from "./utils";

// oapPathToReference converts an OpenAPI path to a uniform Reference
export function oapPathToReference(
    schema: OpenAPIV3.Document,
    httpMethod: "get" | "put" | "post" | "delete" | "patch", // TODO: ts type
    path: string,
    oapPath: OpenAPIV3.PathItemObject,
): Reference | null {
    const mType = httpMethodToUniformMethod(httpMethod)

    if (!mType) {
        console.error(`Unsupported method v222: ${httpMethod}`)
        return null
    }

    const definitions: Definition[] = []
    const exampleGroups: ExampleGroup[] = []

    const oapMethod = oapPath?.[httpMethod] as OpenAPIV3.OperationObject
    if (!oapMethod) {
        return null
    }

    const metaDescription = matter(oapMethod?.description || "")
    const meta = metaDescription?.data as Metadata | undefined

    if (meta && !meta.group) {
        const tag = getFirstTag(oapMethod)

        if (tag) {
            meta.group = [tag]
        }
    }

    const description = matter.stringify({content: metaDescription.content || oapMethod.summary || ""}, meta || {})

    const endpointRef: Reference = {
        title: oapMethod?.summary || oapMethod.operationId || "",
        canonical: oapMethod.operationId || slug(oapMethod?.summary || ""),
        description,
        type: mType,
        category: ReferenceCategory.REST,

        context: {
            method: httpMethod,
            path: `${encodeURIComponent(path)}`,
            fullPath: path,
            group: meta?.group,
        } as OpenAPIReferenceContext,

        examples: {
            groups: exampleGroups,
        },
        definitions: definitions,
    }

    if (oapMethod.parameters) {
        const parameters = oapMethod.parameters as OpenAPIV3.ParameterObject[]

        const paramtersMap = oapParametersToDefinitionProperties(parameters) // TODO: finish

        Object.entries(paramtersMap).forEach(([key, definitionProperties]) => {
            let title: string

            switch (key) {
                case 'path':
                    title = "Path parameters"
                    break
                case 'query':
                    title = "Query parameters"
                    break
                case 'header':
                    title = "Headers"
                    break
                default:
                    console.error(`Unsupported parameter type: ${key} for ${httpMethod} ${path}`)
                    return
            }

            definitions.push({
                title,
                properties: definitionProperties
            })
        })
    }


    if (oapMethod.requestBody) {
        const reqBody = oapMethod.requestBody as OpenAPIV3.RequestBodyObject

        const contentTypes = Object.keys(reqBody.content)
        if (contentTypes.length > 1) {
            console.warn("Multiple content types are not supported yet")
        }

        const findSupportedContent = contentTypes[contentTypes.length - 1]
        if (!findSupportedContent) {
            return null
        }

        const meta: DefinitionOpenAPIMeta[] = [
            {
                name: "contentType",
                value: findSupportedContent,
            }
        ]

        definitions.push({
            title: 'Request body',
            properties: oapRequestBodyToDefinitionProperties(reqBody, findSupportedContent) || [],
            meta,
        })
    }

    if (oapMethod.responses) {
        const definition = oapOperationToUniformDefinition(oapMethod)
        definitions.push(definition)
    }

    // TODO: !!!! better api !!!!
    endpointRef.__UNSAFE_selector = function __UNSAFE_selector(selector: string) {
        switch (selector) {
            case "[schema]": {
                return schema
            }
            case "[method]": {
                return {
                    oapPath,
                    httpMethod,
                    path
                }
            }

            case "[method] [path]": {
                return oapMethod
            }
            default:
                return null
        }
    }

    return endpointRef
}

export function oapOperationToUniformDefinition(
    oapOperation: OpenAPIV3.OperationObject,
): Definition {
    const responses = oapOperation.responses as OpenAPIV3.ResponsesObject

    const variants: DefinitionVariant<DefinitionVariantOpenAPIMeta>[] = []

    Object.keys(responses).forEach((code) => {
        const responseObject = responses[code] as OpenAPIV3.ResponseObject
        if (!responseObject?.content) {
            return null
        }

        const contentTypes = Object.keys(responseObject.content)
        if (contentTypes.length > 1) {
            console.warn("Multiple content types are not supported yet for responses")
        }

        const findSupportedContent = contentTypes[contentTypes.length - 1]
        if (!findSupportedContent) {
            return null
        }

        const properties = oapResponseToDefinitionProperties(responses, code, findSupportedContent) || []

        variants.push({
            title: code,
            properties,
            meta: [
                {
                    name: "status",
                    value: code || "",
                },
                {
                    name: "contentType",
                    value: findSupportedContent || "",
                }
            ]
        })
    })

    return {
        title: 'Response',
        variants,
        properties: []
    }
}

function getFirstTag(oapMethod: OpenAPIV3.OperationObject) {
    for (const tag of oapMethod?.tags || []) {
        return tag
    }

    return ""
}