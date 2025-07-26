import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty, DEFINED_DEFINITION_PROPERTY_TYPE} from "@xyd-js/uniform";

import {schemaObjectToUniformDefinitionProperties} from "../oas-core";

export function oasResponseToDefinitionProperties(
    responses: OpenAPIV3.ResponsesObject,
    code: string,
    contentType: string,
): {
    properties: DefinitionProperty | DefinitionProperty[],
    description?: string,
} | null {
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
        return {
            properties: [
                {
                    description: responseObject?.description || "",
                    name: "",
                    type: ""
                }
            ],
        }
    }

    let array = false

    switch (schemaObject.type) {
        case 'array':
            const arrSchema = schemaObject as OpenAPIV3.ArraySchemaObject
            const items = arrSchema.items as OpenAPIV3.SchemaObject

            schemaObject = items
            array = true
        default:
            break
    }

    const properties = schemaObjectToUniformDefinitionProperties(schemaObject, true)

    let description = ""

    if (schemaObject.allOf) {
        for (const item of schemaObject.allOf) {
           if ("description" in item) {
               description += item.description + "\n";
           }
        }
    }

    if (array) {
        return {
            properties: {
                type: DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY,
                properties,
            } as DefinitionProperty
        }
    }

    return {
        properties: properties || [],
        description: description || "",
    }
}