import { OpenAPIV3 } from "openapi-types";
import { DefinitionProperty } from "@xyd-js/uniform";

import {schemaObjectToUniformDefinitionProperties} from "../oas-core";

export function oasResponseToDefinitionProperties(
    responses: OpenAPIV3.ResponsesObject,
    code: string,
    contentType: string,
): DefinitionProperty[] | null {
    let schemaObject: OpenAPIV3.SchemaObject | undefined
    let responseObject: OpenAPIV3.ResponseObject | undefined

    if (responses[code]) {
        responseObject = responses[code] as OpenAPIV3.ResponseObject
        if (!responseObject?.content) {
            return null
        }

        schemaObject = responseObject?.content[contentType]?.schema as OpenAPIV3.SchemaObject
    }

    if (!schemaObject) {
        return [
            {
                description: responseObject?.description || "",
                name: "",
                type: ""
            }
        ]
    }

    switch (schemaObject.type) {
        case 'array':
            const arrSchema = schemaObject as OpenAPIV3.ArraySchemaObject

            const items = arrSchema.items as OpenAPIV3.SchemaObject

            schemaObject = items
            break
        default:
            break
    }

    return schemaObjectToUniformDefinitionProperties(schemaObject)
}