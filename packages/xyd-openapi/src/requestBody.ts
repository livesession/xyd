import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty} from "@xyd-js/uniform";

import {schemaObjectToDefinitionProperties} from "./properties";

// oapRequestBodyToDefinitionProperties converts OpenAPI request body to uniform DefinitionProperties
export function oapRequestBodyToDefinitionProperties(
    reqBody: OpenAPIV3.RequestBodyObject
): DefinitionProperty[] | null {
    // TODO: support other content types ???
    const schema = reqBody.content['application/json'].schema as OpenAPIV3.SchemaObject

    let schemaObject: OpenAPIV3.SchemaObject | undefined

    if (schema.allOf) {
        return schema.allOf.reduce((acc, of) => {
            const fakeBody: OpenAPIV3.RequestBodyObject = {
                content: {
                    'application/json': {
                        schema: of
                    }
                }
            }

            return [
                ...acc,
                ...oapRequestBodyToDefinitionProperties(fakeBody) || []
            ]
        }, [] as DefinitionProperty[])
    }

    switch (schema.type) {
        case 'object': {
            schemaObject = schema
            break
        }
        case 'array': {
            const arrSchema = schema as OpenAPIV3.ArraySchemaObject

            const items = arrSchema.items as OpenAPIV3.SchemaObject

            schemaObject = items
            break
        }
        default:
            // TODO: primitive types ???
            break
    }

    if (!schemaObject) {
        return null
    }

    return schemaObjectToDefinitionProperties(schemaObject)
}