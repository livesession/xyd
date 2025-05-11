import { OpenAPIV3 } from "openapi-types";
import { DefinitionProperty, DefinitionPropertyMeta } from "@xyd-js/uniform";
import { objectPropMeta } from "./utils";

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

        if (objProp.type === "array") {
            const items = objProp.items as OpenAPIV3.SchemaObject

            merged = schemaObjectToDefinitionProperties(items)
        }

        const meta = [
            ...(objectPropMeta(objProp, name) || []),
            ...(objectPropMeta(v, name) || [])
        ]

        let nestedProps = objProp.properties ? schemaObjectToDefinitionProperties(objProp) : []
        if (objProp.enum) {
            nestedProps = schemaObjectToDefinitionProperties({
                properties: objProp.enum.reduce((acc, enumName) => ({
                    ...acc,
                    [enumName]: {
                        type: objProp.type,
                    }
                }), {})
            })

            meta.push({
                name: "enum",
                value: "true"
            })
        }

        return {
            name: name,
            type: objProp.type || "",
            description: objProp.description || "",
            properties: (
                merged?.length
                    ? merged
                    : nestedProps
            ),
            meta
        }
    })
}