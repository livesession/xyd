import {OpenAPIV3} from "openapi-types";

import {
    Definition,
    ExampleGroup,
    Reference,
    ReferenceCategory,
    OpenAPIReferenceContext,
    DefinitionVariantOpenAPIMeta,
    DefinitionVariant,
    DefinitionOpenAPIMeta,
    SymbolDef,
    DefinitionProperty
} from "@xyd-js/uniform";

import {oapParametersToDefinitionProperties} from "./oas-parameters";
import {oapRequestBodyToDefinitionProperties} from "./oas-requestBody";
import {oasResponseToDefinitionProperties} from "./oas-responses";
import {
    httpMethodToUniformMethod,
    slug
} from "../utils";
import {OasJSONSchema} from "../types";

// oapPathToReference converts an OpenAPI path to a uniform Reference
export function oapPathToReference(
    schema: OpenAPIV3.Document,
    httpMethod: string,
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

    const oapMethod = oapPath?.[httpMethod as keyof OpenAPIV3.PathItemObject] as OpenAPIV3.OperationObject
    // if (oapMethod?.operationId !== "createChatCompletion") { // TODO: REMOVE
    //     return null
    // }
    if (!oapMethod) {
        return null
    }

    const tag = getFirstTag(oapMethod)
    const group = [tag]

    const endpointRef: Reference = {
        title: oapMethod?.summary || oapMethod.operationId || "",
        canonical: oapMethod.operationId || slug(oapMethod?.summary || ""),
        description: oapMethod?.description || oapMethod?.summary,
        type: mType,
        category: ReferenceCategory.REST,

        context: {
            method: httpMethod,
            path: `${encodeURIComponent(path)}`,
            fullPath: path,
            group,
        } as OpenAPIReferenceContext,

        examples: {
            groups: exampleGroups,
        },
        definitions: definitions,
    }

    if (oapMethod.parameters) {
        const parameters = oapMethod.parameters as OpenAPIV3.ParameterObject[]

        const paramtersMap = oapParametersToDefinitionProperties(parameters)

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

        if (reqBody.required) {
            meta.push({
                name: "required",
                value: "true",
            })
        }

        let properties: DefinitionProperty[] = []
        let rootProperty: DefinitionProperty | undefined
        let propertiesResp = oapRequestBodyToDefinitionProperties(reqBody, findSupportedContent) || []

        if (Array.isArray(propertiesResp)) {
            properties = propertiesResp
        } else {
            rootProperty = propertiesResp
        }
        definitions.push({
            title: 'Request body',
            properties,
            rootProperty,
            meta,
            symbolDef: definitionPropertyTypeDef(schema),
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

        for (const contentType of contentTypes) {
            let properties: DefinitionProperty[] = []
            let rootProperty: DefinitionProperty | undefined
            const schema = responseObject.content[contentType]?.schema as OpenAPIV3.SchemaObject
            const respProperties = oasResponseToDefinitionProperties(responses, code, contentType) || []

            if (Array.isArray(respProperties)) {
                properties = respProperties
            } else {
                rootProperty = respProperties
            }

            variants.push({
                title: code,
                description: responseObject.description || "",
                properties,
                rootProperty,
                meta: [
                    {
                        name: "status",
                        value: code || "",
                    },
                    {
                        name: "contentType",
                        value: contentType || "",
                    }
                ],
                symbolDef: definitionPropertyTypeDef(schema),
            })
        }

    })

    return {
        title: 'Response',
        variants,
        properties: []
    }
}

function definitionPropertyTypeDef(
    schema: OpenAPIV3.SchemaObject | undefined,
) {
    if (!schema) {
        return
    }

    let typeDef: SymbolDef | undefined
    let oasSchema = schema as OasJSONSchema
    if (oasSchema.type === "array") {
        oasSchema = oasSchema.items as OasJSONSchema
    }
    if (oasSchema?.__internal_getRefPath) {
        const symbolId = oasSchema.__internal_getRefPath()

        typeDef = {
            id: symbolId,
        }
    }

    return typeDef
}

function getFirstTag(oapMethod: OpenAPIV3.OperationObject) {
    for (const tag of oapMethod?.tags || []) {
        return tag
    }

    return ""
}