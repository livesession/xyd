import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty} from "@xyd-js/uniform";

import {schemaObjectToDefinitionProperties} from "./properties";

// TODO: add support for other statuses
const supportedResponses = [
    "default",
    "200",
    "201",
]
export function oapResponseToDefinitionProperties(
    responses: OpenAPIV3.ResponsesObject
): DefinitionProperty[] | null {
    let schemaObject: OpenAPIV3.SchemaObject | undefined
    let responseObject: OpenAPIV3.ResponseObject | undefined

    // TODO: support another statuses
    for (const status of supportedResponses) {
        if (responses[status]) {
            responseObject = responses[status] as OpenAPIV3.ResponseObject

            schemaObject = responseObject?.content?.['application/json']?.schema as OpenAPIV3.SchemaObject

            break
        }
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

    return schemaObjectToDefinitionProperties(schemaObject)
}