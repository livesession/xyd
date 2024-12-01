import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty} from "@xyd/uniform";

// schemaObjectToDefinitionProperties converts OpenAPI schema object to uniform DefinitionProperty[]
export function schemaObjectToDefinitionProperties(v: OpenAPIV3.SchemaObject): DefinitionProperty[] {
    return Object.entries(v.properties || {}).map(([name, prop]) => {
        let objProp = prop as OpenAPIV3.SchemaObject

        return {
            name: name,
            type: objProp.type || "",
            description: objProp.description || "",
            properties: objProp.properties ? schemaObjectToDefinitionProperties(objProp) : []
        }
    })
}