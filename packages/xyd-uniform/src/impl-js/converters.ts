import {DEFINED_DEFINITION_PROPERTY_TYPE, DefinitionProperty, Reference} from "./types";
import {JSONSchema7, JSONSchema7TypeName} from "json-schema";

export function uniformToInputJsonSchema(reference: Reference): JSONSchema7 | null {
    if (!reference?.definitions?.length) {
        return null;
    }

    const inputDefinitions: JSONSchema7[] = [];

    for (const def of reference.definitions) {
        if (def?.type === "return") {
            continue;
        }

        // Process each definition
        const definitionSchemas: JSONSchema7[] = [];

        // Add main properties if they exist
        if (def?.properties?.length) {
            const result = uniformPropertiesToJsonSchema(def.properties, def.type);
            if (result) {
                definitionSchemas.push(result as JSONSchema7);
            }
        }

        // Add variant properties if they exist
        if (def?.variants?.length) {
            const variantSchemas: JSONSchema7[] = [];
            
            for (const variant of def.variants) {
                if (variant?.properties?.length) {
                    const result = uniformPropertiesToJsonSchema(variant.properties, def.type);
                    if (result) {
                        variantSchemas.push(result as JSONSchema7);
                    }
                }
            }

            // If there are variants, use oneOf
            if (variantSchemas.length > 0) {
                if (variantSchemas.length === 1) {
                    definitionSchemas.push(variantSchemas[0]);
                } else {
                    definitionSchemas.push({
                        oneOf: variantSchemas
                    });
                }
            }
        }

        // Add this definition's schema(s) to the input definitions
        if (definitionSchemas.length === 1) {
            inputDefinitions.push(definitionSchemas[0]);
        } else if (definitionSchemas.length > 1) {
            inputDefinitions.push({
                allOf: definitionSchemas
            });
        }
    }

    // Return the final schema
    if (inputDefinitions.length === 0) {
        return null;
    } else if (inputDefinitions.length === 1) {
        return inputDefinitions[0];
    } else {
        // Multiple definitions use allOf
        return {
            allOf: inputDefinitions
        };
    }
}

export function uniformPropertiesToJsonSchema(
    properties: DefinitionProperty[] | DefinitionProperty,
    id?: string
): JSONSchema7 | null {
    if (Array.isArray(properties)) {
        let jsonSchemaProps: { [key: string]: JSONSchema7 } = {};
        let requiredFields: string[] = [];

        if (properties.length) {
            for (const property of properties) {
                const v = uniformPropertiesToJsonSchema(property);
                if (v) {
                    jsonSchemaProps[property.name] = v;
                }

                // Check if property is required
                const isRequired = property.meta?.some(
                    (meta) => meta.name === "required" && meta.value === "true"
                );
                if (isRequired) {
                    requiredFields.push(property.name);
                }
            }
        }

        const schema: JSONSchema7 = {
            $id: id || undefined,
            type: "object",
            properties: jsonSchemaProps,
        };

        // Only add required array if there are required fields
        if (requiredFields.length > 0) {
            schema.required = requiredFields;
        }

        return schema;
    }

    // Handle enum types
    if (properties.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM) {
        const schema: JSONSchema7 = {
            description: properties.description as string,
        };

        // Get the base type from ofProperty or meta
        const enumType: string =
            (properties.ofProperty && (properties.ofProperty as any).type) ||
            (properties.meta?.find((meta) => meta.name === "enum-type")
                ?.value as string) ||
            "string";

        schema.type = enumType as JSONSchema7TypeName;

        // Extract enum values from properties array
        if (properties.properties && properties.properties.length > 0) {
            schema.enum = properties.properties.map((prop) => prop.name);
        }

        return schema;
    }

    // Handle array types
    if (properties.type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY) {
        const schema: JSONSchema7 = {
            type: "array",
            description: properties.description as string,
        };

        // Set items schema from ofProperty
        if (properties.ofProperty) {
            const itemsSchema = uniformPropertiesToJsonSchema(properties.ofProperty);
            if (itemsSchema) {
                schema.items = itemsSchema;
            }
        }

        return schema;
    }

    // Handle XOR (oneOf) types
    if (properties.type === DEFINED_DEFINITION_PROPERTY_TYPE.XOR) {
        const schema: JSONSchema7 = {
            description: properties.description as string,
        };

        // Convert properties array to oneOf schemas
        if (properties.properties && properties.properties.length > 0) {
            schema.oneOf = properties.properties
                .map((prop) => {
                    const propSchema = uniformPropertiesToJsonSchema(prop);
                    return propSchema || {};
                })
                .filter((schema) => Object.keys(schema).length > 0);
        }

        return schema;
    }

    // Handle UNION (anyOf) types
    if (properties.type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION) {
        const schema: JSONSchema7 = {
            description: properties.description as string,
        };

        // Convert properties array to anyOf schemas
        if (properties.properties && properties.properties.length > 0) {
            schema.anyOf = properties.properties
                .map((prop) => {
                    const propSchema = uniformPropertiesToJsonSchema(prop);
                    return propSchema || {};
                })
                .filter((schema) => Object.keys(schema).length > 0);
        }

        return schema;
    }

    if (properties.ofProperty) {
        return uniformPropertiesToJsonSchema(properties.ofProperty);
    }

    // Build the schema for single property
    const schema: JSONSchema7 = {
        type: properties.type as JSONSchema7TypeName,
        description: properties.description as string,
    };

    // Handle object types with nested properties
    if (properties.type === "object" && properties.properties && properties.properties.length > 0) {
        const nestedSchema = uniformPropertiesToJsonSchema(properties.properties);
        if (nestedSchema && nestedSchema.properties) {
            schema.properties = nestedSchema.properties;
            if (nestedSchema.required) {
                schema.required = nestedSchema.required;
            }
        }
    }

    return schema;
}
