import {OpenAPIV3} from "openapi-types";

import {
    Reference,
    Definition,
    DefinitionProperty,
    ReferenceType,
    OpenAPIReferenceContext,
} from "@xyd-js/uniform";

import {uniformOasOptions} from "../types";
import {schemaObjectToUniformDefinitionProperties} from "../oas-core";

export function schemaComponentsToUniformReferences(
    openapi: OpenAPIV3.Document,
    options?: uniformOasOptions
): Reference[] {
    const references: Reference[] = [];

    if (!openapi.components?.schemas) {
        return references;
    }

    for (const [componentSchemaName, componentSchema] of Object.entries(openapi.components.schemas)) {
        if (componentSchemaName === "Response") {
            console.log(555)
        }
        if (options?.regions && options.regions.length > 0) {
            if (!options.regions.some(region => region === "/components/schemas/" + componentSchemaName)) {
                continue
            }
        }

        if ('$ref' in componentSchema) {
            console.warn(`Skipping reference object: ${componentSchemaName}`);

            continue; // Skip reference objects
        }

        const definition: Definition = {
            title: componentSchemaName,
            properties: schemaObjectToUniformDefinitionProperties(componentSchema) || [],
            meta: []
        };

        // Create reference
        const reference: Reference = {
            title: componentSchemaName,
            description: componentSchema.description || "",
            canonical: `objects/${componentSchemaName}`,
            definitions: [definition],
            examples: {
                groups: [] // TODO: json example
            },
            type: ReferenceType.REST_COMPONENT_SCHEMA,
            context: {
                componentSchema: componentSchemaName,
                group: ["Objects"]
            } as OpenAPIReferenceContext
        };

        // TODO: !!!! better api !!!!
        reference.__UNSAFE_selector = function __UNSAFE_selector(selector: string) {
            switch (selector) {
                case "[schema]": {
                    return openapi
                }

                case "[component]": {
                    return componentSchema
                }

                default:
                    return null
            }
        }

        references.push(reference);
    }

    return references;
}

