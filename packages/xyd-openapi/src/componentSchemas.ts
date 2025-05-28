import {OpenAPIV3} from "openapi-types";

import {Reference, Definition, DefinitionProperty, ReferenceType, OpenAPIReferenceContext, DefinitionVariant} from "@xyd-js/uniform";

import {oapSchemaToReferencesOptions} from "./types";

export function processComponentSchemas(
    openapi: OpenAPIV3.Document,
    options?: oapSchemaToReferencesOptions
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
            continue; // Skip reference objects
        }

        const definition: Definition = {
            title: componentSchemaName,
            properties: [],
            meta: [
                {
                    name: "contentType",
                    value: "application/json"
                }
            ]
        };

        // Process schema properties
        if ('allOf' in componentSchema && componentSchema.allOf) {
            // Handle allOf by merging properties from all schemas
            for (const schema of componentSchema.allOf) {

                if ('$ref' in schema) {
                    continue; // Skip reference objects
                }

                if ('properties' in schema && schema.properties) {
                    for (const [propName, propSchema] of Object.entries(schema.properties)) {
                        if ('$ref' in propSchema) {
                            continue; // Skip reference objects
                        }

                        const property = processSchemaProperty(propName, propSchema, schema.required?.includes(propName));

                        if (property) {
                            // Check if property already exists and merge if needed
                            const existingPropertyIndex = definition.properties.findIndex(p => p.name === propName);
                            if (existingPropertyIndex >= 0) {
                                // Merge properties if they exist in multiple schemas
                                const existingProperty = definition.properties[existingPropertyIndex];
                                definition.properties[existingPropertyIndex] = {
                                    ...existingProperty,
                                    ...property,
                                    meta: [...(existingProperty.meta || []), ...(property.meta || [])]
                                };
                            } else {
                                definition.properties.push(property);
                            }

                            // if (property?.type === "union") {
                            //     // If it's a union, just take the first property
                            //     definition.properties.push(...property.properties || []);
                            // } else {
                            //
                            // }
                        }
                    }
                }
            }
        } else if ('properties' in componentSchema && componentSchema.properties) {
            for (const [propName, propSchema] of Object.entries(componentSchema.properties)) {
                if ('$ref' in propSchema) {
                    continue; // Skip reference objects
                }

                const property = processSchemaProperty(propName, propSchema, componentSchema.required?.includes(propName));
                if (property) {
                    definition.properties.push(property);
                    // if (property?.type === "union") {
                    //     definition.properties.push(...property.properties || []); // If it's a union, just take the first property
                    // } else {
                    // }
                }
            }
        }

        // Create reference
        const reference: Reference = {
            title: componentSchemaName,
            description: componentSchema.description || "",
            canonical: `objects/${componentSchemaName}`,
            definitions: [definition],
            examples: {
                groups: []
            },
            type: ReferenceType.GRAPHQL_OBJECT,
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

function processSchemaProperty(
    name: string,
    schema: OpenAPIV3.SchemaObject,
    required: boolean = false
): DefinitionProperty | null {
    if (!schema) return null;

    // Handle anyOf case
    if ('anyOf' in schema && schema.anyOf) {
        const properties: DefinitionProperty[] = [];

        for (const variantSchema of schema.anyOf) {
            if ('$ref' in variantSchema) {
                continue; // Skip reference objects
            }

            const property = processSchemaProperty(name, variantSchema, required);
            if (property) {
                if (property.type === "union") {
                    // If it's a union, just take the first property
                    properties.push(...property.properties || []);
                } else {
                    properties.push({
                        ...property,
                        name: variantSchema.title || property.name || ""
                    });
                }
            }
        }

        // Return the first property if there's only one, otherwise create a union type
        if (properties.length === 1) {
            return properties[0];
        }

        // TODO: configurable - return union or flat
        return {
            name,
            type: "union",
            description: schema.description || "",
            // meta: [
            //     {
            //         name: "flat",
            //         value: true
            //     }
            // ],
            properties
        };
    }

    // Handle oneOf case
    if ('oneOf' in schema && schema.oneOf) {
        const properties: DefinitionProperty[] = [];

        for (const variantSchema of schema.oneOf) {
            if ('$ref' in variantSchema) {
                continue; // Skip reference objects
            }

            const property = processSchemaProperty(name, variantSchema, required);
            if (property) {
                if (property.type === "union") {
                    // If it's a union, just take the first property
                    properties.push(...property.properties || []);
                } else {
                    properties.push({
                        ...property,
                        name: variantSchema.title || property.name || ""
                    });
                }
            }
        }

        // Return the first property if there's only one, otherwise create a union type
        if (properties.length === 1) {
            return properties[0];
        }

        return {
            name,
            type: "union",
            description: schema.description || "",
            // meta: [
            //     {
            //         name: "flat",
            //         value: true
            //     }
            // ],
            properties
        };
    }

    const property: DefinitionProperty = {
        name,
        type: schema.type || "object",
        description: schema.description || "",
        meta: []
    };

    if (required) {
        property.meta?.push({
            name: "required",
            value: true
        });
    }

    if (schema.nullable) {
        property.meta?.push({
            name: "nullable",
            value: true
        });
    }

    if (schema.enum) {
        property.meta?.push({
            name: "enum",
            value: schema.enum
        });
    }

    if (schema.default !== undefined) {
        property.meta?.push({
            name: "defaults",
            value: schema.default
        });
    }

    if (schema.deprecated) {
        property.meta?.push({
            name: "deprecated",
            value: true
        });
    }

    // Handle nested properties for object types
    if ('properties' in schema && schema.properties) {
        property.properties = [];
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            if ('$ref' in propSchema) {
                continue; // Skip reference objects
            }

            const nestedProperty = processSchemaProperty(
                propName,
                propSchema,
                schema.required?.includes(propName)
            );
            if (nestedProperty) {
                if (nestedProperty.type === "union") {
                    // If it's a union, just take the first property
                    property.properties.push(...nestedProperty.properties || []);
                } else {
                    property.properties.push(nestedProperty);
                }
            }
        }
    }

    // Handle array items
    if (schema.type === "array" && schema.items && !('$ref' in schema.items)) {
        const itemsProperty = processSchemaProperty("items", schema.items);
        if (itemsProperty) {
            if (itemsProperty.type === "union") {
                // If it's a union, just take the first property
                property.properties = itemsProperty.properties || [];
            } else {
                property.properties = [itemsProperty];
            }
        }
    }

    return property;
}
