import {join} from "node:path";
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
import path from "node:path";
import {DefinitionTypeREST} from "@xyd-js/uniform/dist";

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
    if (!oapMethod) {
        return null
    }

    const tag = getFirstTag(oapMethod)
    const group = [tag]

    const ctx: OpenAPIReferenceContext = {
        method: httpMethod,
        path: `${encodeURIComponent(path)}`,
        group,
    }
    const endpointRef: Reference = {
        title: title(oapMethod, httpMethod, path),
        canonical: canonical(oapMethod, httpMethod, path),
        description: oapMethod?.description || oapMethod?.summary,
        type: mType,
        category: ReferenceCategory.REST,

        context: ctx,

        examples: {
            groups: exampleGroups,
        },
        definitions: definitions,
    }

    if (oapPath.servers?.length) {
        const defaultServerUrl = oapPath.servers[0]?.url
        ctx.servers =  oapPath.servers.map(server => server.url)
        if (defaultServerUrl) {
            const u = new URL(defaultServerUrl)
            u.pathname = join(u.pathname, path)
            ctx.fullPath = decodeURIComponent(u.toString())
        }
    }

    if (oapMethod.parameters) {
        const parameters = oapMethod.parameters as OpenAPIV3.ParameterObject[]

        const paramtersMap = oapParametersToDefinitionProperties(parameters)

        Object.entries(paramtersMap).forEach(([key, definitionProperties]) => {
            let title: string
            let definitionType: DefinitionTypeREST
            switch (key) {
                case 'path':
                    title = "Path parameters"
                    definitionType = "$rest.param.path"
                    break
                case 'query':
                    title = "Query parameters"
                    definitionType = "$rest.param.query"
                    break
                case 'header':
                    title = "Headers"
                    definitionType = "$rest.param.header"
                    break
                case 'cookies':
                    title = "Cookies"
                    definitionType = "$rest.param.cookie"
                    break
                default:
                    console.error(`Unsupported parameter type: ${key} for ${httpMethod} ${path}`)
                    return
            }

            definitions.push({
                title,
                properties: definitionProperties,
                type: definitionType || undefined
            })
        })
    }

    definitions.push(...oapOperationToDefinitions(oapMethod))

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

function oapOperationToDefinitions(
    oapMethod: OpenAPIV3.OperationObject,
): Definition[] {
    const definitions: Definition[] = []

    if (oapMethod.requestBody) {
        const definition = oapRequestOperationToUniformDefinition(oapMethod)
        definitions.push(definition)
    }

    if (oapMethod.responses) {
        const definition = oapResponseOperationToUniformDefinition(oapMethod)
        definitions.push(definition)
    }

    return definitions
}

function oapRequestOperationToUniformDefinition(
    oapOperation: OpenAPIV3.OperationObject,
): Definition {
    const reqBody = oapOperation.requestBody as OpenAPIV3.RequestBodyObject
    const variants: DefinitionVariant<DefinitionVariantOpenAPIMeta>[] = []

    for (const contentType of Object.keys(reqBody.content)) {
        const schema = reqBody.content[contentType]?.schema as OpenAPIV3.SchemaObject

        let properties: DefinitionProperty[] = []
        let rootProperty: DefinitionProperty | undefined
        let propertiesResp = oapRequestBodyToDefinitionProperties(reqBody, contentType) || []

        if (Array.isArray(propertiesResp)) {
            properties = propertiesResp
        } else {
            rootProperty = propertiesResp
        }

        const meta: DefinitionVariantOpenAPIMeta[] = [
            {
                name: "contentType",
                value: contentType || "",
            },
        ]

        if (schema?.required) {
            meta.push({
                name: "required",
                value: schema.required ? "true" : "false",
            })
        }

        variants.push({
            title: contentType,
            description: schema.description || "",
            properties,
            rootProperty,
            meta,
            symbolDef: definitionPropertyTypeDef(schema),
        })
    }

    const meta: DefinitionOpenAPIMeta[] = []

    if (reqBody.required) {
        meta.push({
            name: "required",
            value: "true",
        })
    }

    return {
        title: 'Request body',
        variants,
        properties: [],
        meta,
        type: "$rest.request.body"
    }
}

export function oapResponseOperationToUniformDefinition(
    oapOperation: OpenAPIV3.OperationObject,
): Definition {

    const responses = oapOperation.responses as OpenAPIV3.ResponsesObject

    const variants: DefinitionVariant<DefinitionVariantOpenAPIMeta>[] = []

    Object.keys(responses).forEach((code) => {
        const responseObject = responses[code] as OpenAPIV3.ResponseObject
        if (!responseObject?.content) {
            variants.push({
                title: code,
                description: responseObject.description,
                properties: [],
                meta: [
                    {
                        name: "status",
                        value: code || "",
                    },
                ],
            })
            return null
        }

        const contentTypes = Object.keys(responseObject.content)

        for (const contentType of contentTypes) {
            let properties: DefinitionProperty[] = []
            let rootProperty: DefinitionProperty | undefined
            const schema = responseObject.content[contentType]?.schema as OpenAPIV3.SchemaObject
            const respProperties = oasResponseToDefinitionProperties(responses, code, contentType) || []

            if (respProperties && "properties" in respProperties && respProperties?.properties) {
                if (Array.isArray(respProperties.properties)) {
                    properties = respProperties.properties
                } else {
                    rootProperty = respProperties.properties
                }
            }

            let definitionDescription = ""
            if ("description" in respProperties) {
                definitionDescription = respProperties.description || ""
            }

            variants.push({
                title: code,
                description: responseObject.description,
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
                    },
                    {
                        name: "definitionDescription",
                        value: definitionDescription
                    }
                ],
                symbolDef: definitionPropertyTypeDef(schema),
            })
        }

    })

    return {
        title: "Response",
        type: "return",
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


function title(
    oapMethod: OpenAPIV3.OperationObject,
    httpMethod: string,
    httpPath: string,
) {
    const tit = oapMethod?.summary || oapMethod.operationId || ""
    if (tit) {
        return tit
    }

    if (!httpMethod || !httpPath) {
        throw new Error("httpMethod and path are required to generate title")
    }

    return path.join(httpMethod, cleanPath(httpPath))
}

function canonical(
    oapMethod: OpenAPIV3.OperationObject,
    httpMethod: string,
    httpPath: string,
) {
    let canon = oapMethod.operationId || slug(oapMethod?.summary || "")

    if (canon) {
        return canon
    }

    if (!httpMethod || !httpPath) {
        throw new Error("httpMethod and path are required to generate canonical")
    }

    return path.join(httpMethod, cleanPath(httpPath))
}

function getFirstTag(oapMethod: OpenAPIV3.OperationObject) {
    for (const tag of oapMethod?.tags || []) {
        return tag
    }

    return ""
}

// Helper function to remove curly braces from path parameters
function cleanPath(httpPath: string): string {
    return httpPath.replace(/\{([^}]+)\}/g, '$1')
}