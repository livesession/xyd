import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty} from "@xyd/uniform";

// schemaObjectToDefinitionProperties converts OpenAPI schema object to uniform DefinitionProperty[]
export function schemaObjectToDefinitionProperties(v: OpenAPIV3.SchemaObject): DefinitionProperty[] {
    return Object.entries(v.properties || {}).map(([name, prop]) => {
        let objProp = prop as OpenAPIV3.SchemaObject

        let merged: DefinitionProperty[] = []

        if (objProp.allOf) {
            merged = objProp.allOf.reduce((acc, of) => {
                return [
                    ...acc,
                    ...schemaObjectToDefinitionProperties(of as OpenAPIV3.SchemaObject)
                ]
            }, [] as DefinitionProperty[])
        }

        return {
            name: name,
            type: objProp.type || "",
            description: objProp.description || "",
            properties: (
                merged?.length
                    ? merged
                    : objProp.properties ? schemaObjectToDefinitionProperties(objProp) : []
            )
        }
    })
}