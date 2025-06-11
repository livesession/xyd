import {OpenAPIV3} from "openapi-types";

import {
    DEFINED_DEFINITION_PROPERTY_TYPE,
    DefinitionProperty,
    DefinitionPropertyMeta
} from "@xyd-js/uniform";

import {OasJSONSchema} from "./types";
import { BUILT_IN_PROPERTIES } from "./const";

export function schemaObjectToUniformDefinitionProperties(
    schemaObject: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
    rootProperty?: boolean
): DefinitionProperty[] | DefinitionProperty | null {
    if ('$ref' in schemaObject) {
        console.warn("Reference objects are not supported in schemaObjectToUniformDefinitionProperties");

        return null
    }

    const properties: DefinitionProperty[] = [];

    // Process schema properties
    if ('anyOf' in schemaObject && schemaObject.anyOf) {
        const property = schemaObjectToUniformDefinitionProperty("", schemaObject, false)

        if (property) {
            if (rootProperty) {
                return property
            }

            properties.push(property);
        }
    } else if ('oneOf' in schemaObject && schemaObject.oneOf) {
        const property = schemaObjectToUniformDefinitionProperty("", schemaObject, false)

        if (property) {
            if (rootProperty) {
                return property
            }

            properties.push(property);
        }
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
                } else if (Array.isArray(refPath)) {
                    componentPaths.push(...refPath);
                } else {
                    console.warn("Invalid refPath type in allOf schema", oasSchema);
                }
            }

            if ('properties' in schema && schema.properties) {
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    if (BUILT_IN_PROPERTIES[propName]) {
                        continue;
                    }
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
            if (BUILT_IN_PROPERTIES[propName]) {
                continue;
            }
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
    required?: boolean,
    arrayOf?: boolean
): DefinitionProperty | null {
    if (!schema) return null;

    // Handle anyOf case
    if ('anyOf' in schema && schema.anyOf) {
        const componentPaths: string[] = []
        const properties: DefinitionProperty[] = [];

        for (const variantSchema of schema.anyOf) {
            if ('$ref' in variantSchema) {
                console.warn("$ref is not supported in anyOf schemas");

                continue; // Skip reference objects
            }

            const oasSchema = variantSchema as OasJSONSchema;
            if (oasSchema.__internal_getRefPath) {
                const refPath = oasSchema.__internal_getRefPath();
                if (typeof refPath === 'string') {
                    componentPaths.push(refPath);
                } else if (Array.isArray(refPath)) {
                    componentPaths.push(...refPath);
                } else {
                    console.warn("Invalid refPath type in anyOf schema", oasSchema);
                }
            }

            const property = schemaObjectToUniformDefinitionProperty(name, variantSchema, required);

            if (property) {
                if (isMergeType(property.type)) {
                    properties.push(...property.properties || []);
                } else {
                    properties.push({
                        ...property,
                        name: variantSchema.title || property.name || "",
                    });
                }
            }
        }

        const oasSchema = schema as OasJSONSchema;
        oasSchema.__internal_getRefPath = () => componentPaths

        const prop = {
            name,
            type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
            description: schema.description || "",
            properties
        };

        return prop
    }

    const meta = schemaObjectToUniformDefinitionPropertyMeta({
        ...schema,
        required: required ? [name] : undefined,
    }, name)

    // Handle oneOf case
    if ('oneOf' in schema && schema.oneOf) {
        const componentPaths: string[] = []
        const properties: DefinitionProperty[] = [];

        for (const variantSchema of schema.oneOf) {
            if ('$ref' in variantSchema) {
                console.warn("$ref is not supported in oneOf schemas");

                continue; // Skip reference objects
            }

            const oasSchema = variantSchema as OasJSONSchema;
            if (oasSchema.__internal_getRefPath) {
                const refPath = oasSchema.__internal_getRefPath();
                if (typeof refPath === 'string') {
                    componentPaths.push(refPath);
                } else if (Array.isArray(refPath)) {
                    componentPaths.push(...refPath);
                } else {
                    console.warn("Invalid refPath type in allOf schema", oasSchema);
                }
            }
          
            const property = schemaObjectToUniformDefinitionProperty(name, variantSchema, required);
            if (property) {
                properties.push({
                    ...property,
                    name: variantSchema.title || property.name || "",
                });
            }
        }

        const oasSchema = schema as OasJSONSchema;
        oasSchema.__internal_getRefPath = () => componentPaths

        const prop: DefinitionProperty = {
            name,
            type: DEFINED_DEFINITION_PROPERTY_TYPE.XOR,
            description: schema.description || "",
            properties,
            meta,
        };

        return prop
    }

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
        if (!Array.isArray(enumProperties)) {
            return property;
        }

        meta.push({
            name: "enum-type",
            value: schema.type
        })

        const enumProperty: DefinitionProperty = {
            name,
            type: DEFINED_DEFINITION_PROPERTY_TYPE.ENUM,
            description: schema.description || "",
            meta,
            properties: enumProperties || [],
        };

        return enumProperty
    } else {
        if ('properties' in schema && schema.properties) {
            property.properties = [];

            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                if (BUILT_IN_PROPERTIES[propName]) {
                    continue;
                }
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
                    property.properties.push(nestedProperty);
                }
            }
        }
        // Handle array items
        else if (schema.type === "array" && schema.items && !('$ref' in schema.items)) {
            const arrayProperty: DefinitionProperty = {
                name,
                type: DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY,
                description: schema.description || "",
                meta,
                properties: []
            };

            const itemsProperty = schemaObjectToUniformDefinitionProperty("", schema.items, required, true);
            
            if (itemsProperty) {
                if (isOfType(itemsProperty.type) || itemsProperty.ofProperty?.type) {
                    arrayProperty.ofProperty = {
                        name: "",
                        type: itemsProperty.type,
                        properties: itemsProperty.properties || [],
                        description: itemsProperty.description || "",
                        meta: itemsProperty.meta || [],
                        ofProperty: itemsProperty.ofProperty || undefined
                    }
                } else {
                    arrayProperty.properties = [itemsProperty];
                }
            }

            return arrayProperty
        }
    }

    if (arrayOf) {
        return {
            type: property.type,
            name: "",
            description: "",
            ofProperty: property
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

function isMergeType(type: string) {
    return type === DEFINED_DEFINITION_PROPERTY_TYPE.XOR
        || type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION
}

function isOfType(type: string) {
    return type === DEFINED_DEFINITION_PROPERTY_TYPE.XOR
        || type === DEFINED_DEFINITION_PROPERTY_TYPE.UNION
}