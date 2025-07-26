import {OpenAPIV3} from "openapi-types";

import {DefinitionProperty} from "@xyd-js/uniform";

import { schemaObjectToUniformDefinitionPropertyMeta } from "../oas-core";

// oapParametersToDefinitionProperties converts OpenAPI parameters to uniform DefinitionProperties
export function oapParametersToDefinitionProperties(
    parameters: OpenAPIV3.ParameterObject[]
): { [key: string]: DefinitionProperty[] } {
    const parameterIn: { [key: string]: DefinitionProperty[] } = {}

    parameters.forEach((param) => {
        if (!parameterIn[param.in]) {
            parameterIn[param.in] = []
        }

        const schema = param.schema as OpenAPIV3.SchemaObject

        const meta = [
            ...(schemaObjectToUniformDefinitionPropertyMeta(schema, param.name) || []),
            ...(schemaObjectToUniformDefinitionPropertyMeta(param, param.name) || []),
        ]

        let oapV2Type = ""
        if ("type" in param) {
            oapV2Type = param.type as string
        }
        
        const property: DefinitionProperty = {
            name: param.name,
            type: schema?.type || oapV2Type || "",
            description: param.description || "",
            meta
        }
    
        parameterIn[param.in].push(property)
    })

    return parameterIn
}
