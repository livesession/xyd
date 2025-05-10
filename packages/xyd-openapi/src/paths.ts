import { OpenAPIV3 } from "openapi-types";
import matter from 'gray-matter'

import { Metadata } from "@xyd-js/core";
import { Definition, ExampleGroup, Reference, ReferenceCategory, OpenAPIReferenceContext } from "@xyd-js/uniform";

import { oapParametersToDefinitionProperties } from "./parameters";
import { oapRequestBodyToDefinitionProperties } from "./requestBody";
import { oapResponseToDefinitionProperties } from "./responses";
import {
    httpMethodToUniformMethod,
    slug
} from "./utils";

// oapPathToReference converts an OpenAPI path to a uniform Reference
export function oapPathToReference(
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

    const description = matter.stringify({ content: metaDescription.content }, meta || {});

    const endpointRef: Reference = {
        title: oapMethod?.summary || "",
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
                    title = "Header"
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

        definitions.push({
            title: 'Request body',
            properties: oapRequestBodyToDefinitionProperties(reqBody) || []
        })
    }

    if (oapMethod.responses) {
        const responses = oapMethod.responses as OpenAPIV3.ResponsesObject

        definitions.push({
            title: 'Response',
            properties: oapResponseToDefinitionProperties(responses) || []
        })
    }

    // @ts-ignore
    endpointRef.__UNSAFE_selector = {
        // @ts-ignore
        ...endpointRef.__UNSAFE_selector || {},
        "[method] [path]": oapMethod
    }

    return endpointRef
}


function getFirstTag(oapMethod: OpenAPIV3.OperationObject) {
    for (const tag of oapMethod?.tags || []) {
        return tag
    }

    return ""
}