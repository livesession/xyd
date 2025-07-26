import {OpenAPIV3} from "openapi-types";

import {DefinitionProperty, DEFINED_DEFINITION_PROPERTY_TYPE} from "@xyd-js/uniform";

import {schemaObjectToUniformDefinitionProperties} from "../oas-core";

// oapRequestBodyToDefinitionProperties converts OpenAPI request body to uniform DefinitionProperties
export function oapRequestBodyToDefinitionProperties(
    reqBody: OpenAPIV3.RequestBodyObject,
    contentType: string
): DefinitionProperty[] | DefinitionProperty | null {
    const schema = reqBody.content[contentType].schema as OpenAPIV3.SchemaObject
    if (!schema) {
        return null
    }

    let schemaObject: OpenAPIV3.SchemaObject | undefined

    if (schema.allOf || schema.anyOf || schema.oneOf) {
        return schemaObjectToUniformDefinitionProperties(schema)
    }

    let array = false

    switch (schema.type) {
        case 'object': {
            schemaObject = schema
            break
        }
        case 'array': {
            const arrSchema = schema as OpenAPIV3.ArraySchemaObject
            const items = arrSchema.items as OpenAPIV3.SchemaObject

            schemaObject = items
            array = true

            break
        }
        default:
            // TODO: primitive types ???
            break
    }

    if (!schemaObject) {
        return null
    }

    const properties = schemaObjectToUniformDefinitionProperties(schemaObject)
    if (array) {
        return {
            type: DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY,
            properties,
        } as DefinitionProperty
    }

    return properties
}