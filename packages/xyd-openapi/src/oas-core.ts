import {OpenAPIV3} from "openapi-types";

import {
    DEFINED_DEFINITION_PROPERTY_TYPE,
    DefinitionProperty,
    DefinitionPropertyMeta
} from "@xyd-js/uniform";

import {OasJSONSchema} from "./types";

export function schemaObjectToUniformDefinitionProperties(
    schemaObject: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
): DefinitionProperty[] | null {
    if ('$ref' in schemaObject) {
        console.warn("Reference objects are not supported in schemaObjectToUniformDefinitionProperties");

        return null
    }
    const properties: DefinitionProperty[] = [];

    // Process schema properties
    if ('anyOf' in schemaObject && schemaObject.anyOf) {
        // Handle anyOf by merging properties from all schemas
        for (const schema of schemaObject.anyOf) {
            if ('$ref' in schema) {
                console.warn("$ref is not supported in anyOf schemas");
                continue;
            }

            const schemaProperties = schemaObjectToUniformDefinitionProperties(schema);
            if (schemaProperties) {
                properties.push(...schemaProperties);
            }
        }
    } else if ('oneOf' in schemaObject && schemaObject.oneOf) {
        const property = schemaObjectToUniformDefinitionProperty("", schemaObject, false)

        if (property) {
            properties.push(property);
        }
        // // Handle oneOf by merging properties from all schemas
        // for (const schema of schemaObject.oneOf) {
        //     if ('$ref' in schema) {
        //         console.warn("$ref is not supported in oneOf schemas");
        //         continue;
        //     }
        //
        //     const schemaProperties = schemaObjectToUniformDefinitionProperties(schema);
        //     if (schemaProperties) {
        //         properties.push(...schemaProperties);
        //     }
        // }
    } else if ('allOf' in schemaObject && schemaObject.allOf) {
        const componentPaths: string[] = []

        // Handle allOf by merging properties from all schemas
        for (const schema of schemaObject.allOf) {
            if ('$ref' in schema) {
                console.warn("$ref is not supported in allOf schemas");

                continue; // Skip reference objects
            }

            const oasSchema = schema as OasJSONSchema;

            if (oasSchema.__internal_getRefPath) {
                const refPath = oasSchema.__internal_getRefPath();
                if (typeof refPath === 'string') {
                    componentPaths.push(refPath);
                } else {
                    console.warn("Invalid refPath type in allOf schema", oasSchema);
                }
            }

            if ('properties' in schema && schema.properties) {
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    if ('$ref' in propSchema) {
                        console.warn("$ref is not supported in allOf properties");

                        continue; // Skip reference objects
                    }

                    const property = schemaObjectToUniformDefinitionProperty(propName, propSchema, schema.required?.includes(propName));

                    if (property) {
                        // Check if property already exists and merge if needed
                        const existingPropertyIndex = properties.findIndex(p => p.name === propName);
                        if (existingPropertyIndex >= 0) {
                            // Merge properties if they exist in multiple schemas
                            const existingProperty = properties[existingPropertyIndex];
                            properties[existingPropertyIndex] = {
                                ...existingProperty,
                                ...property,
                                meta: [...(existingProperty.meta || []), ...(property.meta || [])]
                            };
                        } else {
                            properties.push(property);
                        }
                    }
                }
            }
        }

        const oasSchema = schemaObject as OasJSONSchema;
        oasSchema.__internal_getRefPath = () => componentPaths

    } else if ('properties' in schemaObject && schemaObject.properties) {
        for (const [propName, propSchema] of Object.entries(schemaObject.properties)) {
            if ('$ref' in propSchema) {
                console.warn("$ref is not supported in properties");

                continue; // Skip reference objects
            }

            const property = schemaObjectToUniformDefinitionProperty(propName, propSchema, schemaObject.required?.includes(propName));
            if (property) {
                properties.push(property);
            }
        }
    }

    return properties
}

export function schemaObjectToUniformDefinitionProperty(
    name: string,
    schema: OpenAPIV3.SchemaObject,
    required?: boolean
): DefinitionProperty | null {
    if (!schema) return null;

    // Handle anyOf case
    if ('anyOf' in schema && schema.anyOf) {
        const properties: DefinitionProperty[] = [];

        for (const variantSchema of schema.anyOf) {
            if ('$ref' in variantSchema) {
                console.warn("$ref is not supported in anyOf schemas");

                continue; // Skip reference objects
            }

            const property = schemaObjectToUniformDefinitionProperty(name, variantSchema, required);
            if (property) {
                if (isMergeType(property.type)) {
                    addDefinitionPropertyUnion(property, property);
                    // If it's a union, just take the first property
                    properties.push(...property.properties || []);
                } else {
                    properties.push({
                        ...property,
                        name: variantSchema.title || property.name || "",
                    });
                }
            }
        }

        return {
            name,
            type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
            description: schema.description || "",
            properties
        };
    }

    // Handle oneOf case
    if ('oneOf' in schema && schema.oneOf) {
        const properties: DefinitionProperty[] = [];

        for (const variantSchema of schema.oneOf) {
            if ('$ref' in variantSchema) {
                console.warn("$ref is not supported in oneOf schemas");

                continue; // Skip reference objects
            }

            const property = schemaObjectToUniformDefinitionProperty(name, variantSchema, required);
            if (property) {
                if (isMergeType(property.type)) {
                    addDefinitionPropertyUnion(property, property);
                    // If it's a union, just take the first property
                    properties.push(...property.properties || []);
                } else {
                    properties.push({
                        ...property,
                        name: variantSchema.title || property.name || "",
                    });
                }
            }
        }

        return {
            name,
            type: DEFINED_DEFINITION_PROPERTY_TYPE.XOR,
            description: schema.description || "",
            properties
        };
    }

    const meta = schemaObjectToUniformDefinitionPropertyMeta({
        ...schema,
        required: required ? [name] : undefined,
    }, name);

    const property: DefinitionProperty = {
        name,
        type: schema.type || "object",
        description: schema.description || "",
        meta,
    };

    if (schema.enum) {
        const enumProperties = schemaObjectToUniformDefinitionProperties({
            properties: schema.enum.reduce((acc, enumName) => ({
                ...acc,
                [enumName]: {
                    type: schema.type,
                }
            }), {})
        })

        if (enumProperties && enumProperties.length) {
            meta.push({
                name: "enum",
                value: "true"
            })
        }

        property.properties = enumProperties || [];
    } else {
        if ('properties' in schema && schema.properties) {
            property.properties = [];
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                if ('$ref' in propSchema) {
                    console.warn("$ref is not supported in properties");

                    continue; // Skip reference objects
                }

                const nestedProperty = schemaObjectToUniformDefinitionProperty(
                    propName,
                    propSchema,
                    schema.required?.includes(propName)
                );
                if (nestedProperty) {
                    if (isMergeType(nestedProperty.type)) {
                        addDefinitionPropertyUnion(property, nestedProperty);

                        property.properties.push(...nestedProperty.properties || []);
                    } else {
                        property.properties.push(nestedProperty);
                    }
                }
            }
        }

        // Handle array items
        if (schema.type === "array" && schema.items && !('$ref' in schema.items)) {
            const itemsProperty = schemaObjectToUniformDefinitionProperty("items", schema.items);
            if (itemsProperty) {
                if (isMergeType(itemsProperty.type)) {
                    addDefinitionPropertyUnion(property, itemsProperty);
                    // If it's a union, just take the first property
                    property.properties = itemsProperty.properties || [];
                } else {
                    property.properties = [itemsProperty];
                }
            }
        }
    }

    return property;
}

export function schemaObjectToUniformDefinitionPropertyMeta(objProp: OpenAPIV3.SchemaObject | OpenAPIV3.ParameterObject, name: string) {
    const meta: DefinitionPropertyMeta[] = []
    if (!objProp) {
        return meta
    }

    if (typeof objProp.required === "boolean" && objProp.required) {
        meta.push({
            name: "required",
            value: "true"
        })
    } else if (Array.isArray(objProp.required)) {
        for (const req of objProp.required) {
            if (req === name) {
                meta.push({
                    name: "required",
                    value: "true"
                })
            }
        }
    }

    if (objProp.deprecated) {
        meta.push({
            name: "deprecated",
            value: "true"
        })
    }

    if ("default" in objProp) {
        meta.push({
            name: "defaults",
            value: objProp.default
        })
    }

    if ("nullable" in objProp) {
        meta.push({
            name: "nullable",
            value: "true"
        })
    }

    return meta
}

function addDefinitionPropertyUnion(
    property: DefinitionProperty,
    nestedProperty: DefinitionProperty
) {
    if (!property.typeDef) {
        property.typeDef = {}
    }
    if (!property.typeDef.union) {
        property.typeDef.union = []
    }
    for (const unionProperty of nestedProperty.properties || []) {
        property.typeDef.union.push({
            symbolId: unionProperty.name,
        })
    }
}

function isMergeType(type: string) {
    return type === DEFINED_DEFINITION_PROPERTY_TYPE.XOR
        || type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION
}