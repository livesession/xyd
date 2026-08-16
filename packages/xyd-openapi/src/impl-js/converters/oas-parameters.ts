import { OpenAPIV3 } from "openapi-types";

import { DefinitionProperty } from "@xyd-js/uniform";

import { schemaObjectToUniformDefinitionProperties, schemaObjectToUniformDefinitionProperty, schemaObjectToUniformDefinitionPropertyMeta } from "../oas-core";

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

        const property = schemaObjectToUniformDefinitionProperty(
            param.name,
            schema,
            param.required,
            schema?.type === "array" ? true : false,
        )

        if (property) {
            parameterIn[param.in].push({
                ...property,
                description: param.description || "",
            })
        }

    })

    return parameterIn
}
