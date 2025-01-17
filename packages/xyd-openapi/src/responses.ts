import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty} from "@xyd-js/uniform";

import {schemaObjectToDefinitionProperties} from "./properties";

export function oapResponseToDefinitionProperties(
    responses: OpenAPIV3.ResponsesObject
): DefinitionProperty[] | null {
    let schemaObject: OpenAPIV3.SchemaObject | undefined
    // TODO: support another statuses
    if (responses["default"]) {
        const w = responses["default"] as OpenAPIV3.ResponseObject

        schemaObject = w?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
    } else if (responses["200"]) {
        const w = responses["200"] as OpenAPIV3.ResponseObject

        schemaObject = w?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject
    }

    if (!schemaObject) {
        return null
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

    return schemaObjectToDefinitionProperties(schemaObject)
}