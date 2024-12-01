import {OpenAPIV3} from "openapi-types";
import {Definition, ExampleGroup, Reference, ReferenceCategory} from "@xyd/uniform";

import {oapParametersToDefinitionProperties} from "./parameters";
import {oapRequestBodyToDefinitionProperties} from "./requestBody";
import {oapResponseToDefinitionProperties} from "./responses";
import {
    httpMethodToUniformMethod,
    toPascalCase
} from "./utils";

// oapPathToReference converts an OpenAPI path to a uniform Reference
export function oapPathToReference(
    httpMethod: "get" | "put" | "post" | "delete", // TODO: ts type
    path: string,
    oapPath: OpenAPIV3.PathItemObject,
): Reference | null {
    const mType = httpMethodToUniformMethod(httpMethod)

    if (!mType) {
        console.error(`Unsupported method: ${httpMethod}`)
        return null
    }

    const definitions: Definition[] = []
    const exampleGroups: ExampleGroup[] = []

    const oapMethod = oapPath?.[httpMethod] as OpenAPIV3.OperationObject

    if (!oapMethod) {
        return null
    }

    const endpointRef: Reference = {
        title: oapMethod?.summary || "",
        canonical: toPascalCase(oapMethod?.summary || ""),
        description: oapMethod?.description || "",

        category: ReferenceCategory.REST,
        type: mType,

        context: {
            method: httpMethod,

            path
        },

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

            // TODO: add context to definition
            switch (key) {
                case 'path':
                    title = "Paths"
                    break
                case 'query':
                    title = "Query"
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

    return endpointRef
}
