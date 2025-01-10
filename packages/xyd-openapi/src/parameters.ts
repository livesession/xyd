import {OpenAPIV3} from "openapi-types";
import {DefinitionProperty} from "@xyd-js/uniform";

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

        const property: DefinitionProperty = {
            name: param.name,
            type: schema.type || "",
            description: param.description || ""
        }

        parameterIn[param.in].push(property)
    })

    return parameterIn
}
