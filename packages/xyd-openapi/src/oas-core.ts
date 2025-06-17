import {OpenAPIV3} from "openapi-types";

import {
    DEFINED_DEFINITION_PROPERTY_TYPE,
    DefinitionProperty,
    DefinitionPropertyMeta
} from "@xyd-js/uniform";

import {OasJSONSchema} from "./types";
import {BUILT_IN_PROPERTIES} from "./const";

export function schemaObjectToUniformDefinitionProperties(
    schemaObject: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
    rootProperty?: boolean,
    visitedRefs?: Map<string, DefinitionProperty>
): DefinitionProperty[] | DefinitionProperty | null {
    if ('$ref' in schemaObject) {
        console.warn("Reference objects are not supported in schemaObjectToUniformDefinitionProperties");

        return null
    }

    const properties: DefinitionProperty[] = [];

    // Process schema properties
    if ('anyOf' in schemaObject && schemaObject.anyOf) {
        const property = schemaObjectToUniformDefinitionProperty("", schemaObject, false, false, visitedRefs)

        if (property) {
            if (rootProperty) {
                return property
            }

            properties.push(property);
        }
    } else if ('oneOf' in schemaObject && schemaObject.oneOf) {
        const property = schemaObjectToUniformDefinitionProperty("", schemaObject, false, false, visitedRefs)

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

                    const property = schemaObjectToUniformDefinitionProperty(
                        propName,
                        propSchema,
                        schema.required?.includes(propName),
                        propSchema?.type === "array" ? true : false,
                        visitedRefs
                    );

                    if (property) {
                        // Check if property already exists and merge if needed
                        const existingPropertyIndex = properties.findIndex(p => p.name === propName);
                        if (existingPropertyIndex >= 0) {
                            // Merge properties if they exist in multiple schemas
                            const existingProperty = properties[existingPropertyIndex];
                            properties[existingPropertyIndex] = {
                                ...existingProperty,
                                ...property,
                                description: property.description || existingProperty.description || "",
                                meta: [...(existingProperty.meta || []), ...(property.meta || [])],
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

            const property = schemaObjectToUniformDefinitionProperty(
                propName,
                propSchema,
                schemaObject.required?.includes(propName),
                propSchema?.type === "array" ? true : false,
                visitedRefs
            );
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
    arrayOf?: boolean,
    visitedRefs?: Map<string, DefinitionProperty>,
    parentProperty?: DefinitionProperty
): DefinitionProperty | null {
    if (name === "__UNSAFE_refPath") {
        return null
    }
    if (!schema) return null;

    if (!visitedRefs) {
        visitedRefs = new Map();
    }
    let refPath = ""
    if ("__UNSAFE_refPath" in schema && typeof schema.__UNSAFE_refPath === 'function') {
        refPath = schema.__UNSAFE_refPath();
        const defProp = visitedRefs.get(refPath);
        if (defProp) {
            return JSON.parse(JSON.stringify(defProp)); // Return a deep copy circular json
        }
    }

    if (parentProperty) {
        visitedRefs.set(refPath, parentProperty);
    }

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

            const property = schemaObjectToUniformDefinitionProperty(name, variantSchema, required, false, visitedRefs);

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

        if (refPath) {
            visitedRefs.set(refPath, prop);
        }
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

            const property = schemaObjectToUniformDefinitionProperty(name, variantSchema, required, false, visitedRefs);
            if (property) {
                // if (isOfType(property.type)) { TODO: in the future?
                // }
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

        if (refPath) {
            visitedRefs.set(refPath, prop);
        }

        return prop
    }

    // Handle allOf case
    if ('allOf' in schema && schema.allOf) {
        const componentPaths: string[] = []
        const mergedProperty: DefinitionProperty = {
            name,
            type: schema.type || "",
            description: schema.description || "",
            properties: [],
            meta
        };

        for (const variantSchema of schema.allOf) {
            if ('$ref' in variantSchema) {
                console.warn("$ref is not supported in allOf schemas");
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


            if (!mergedProperty.type) {
                if (typeof variantSchema.type === 'string') {
                    mergedProperty.type = variantSchema.type || ""
                }
            }

            if ('properties' in variantSchema && variantSchema.properties) {
                for (const [propName, propSchema] of Object.entries(variantSchema.properties)) {
                    if (BUILT_IN_PROPERTIES[propName]) {
                        continue;
                    }
                    if ('$ref' in propSchema) {
                        console.warn("$ref is not supported in allOf properties");
                        continue; // Skip reference objects
                    }

                    const property = schemaObjectToUniformDefinitionProperty(
                        propName,
                        propSchema,
                        variantSchema.required?.includes(propName),
                        false,
                        visitedRefs
                    );

                    if (property && mergedProperty.properties) {
                        // Check if property already exists and merge if needed
                        const existingPropertyIndex = mergedProperty.properties.findIndex(p => p.name === propName);
                        if (existingPropertyIndex >= 0) {
                            // Merge properties if they exist in multiple schemas
                            const existingProperty = mergedProperty.properties[existingPropertyIndex];
                            mergedProperty.properties[existingPropertyIndex] = {
                                ...existingProperty,
                                ...property,
                                description: property.description || existingProperty.description || "",
                                meta: [...(existingProperty.meta || []), ...(property.meta || [])],
                            };
                        } else {
                            mergedProperty.properties.push(property);
                        }
                    }
                }
            } else {
                const property = schemaObjectToUniformDefinitionProperty(
                    "",
                    variantSchema,
                    false,
                    false,
                    visitedRefs
                );
                if (property) {
                    if (isOfType(property.type)) {
                        mergedProperty.ofProperty = property
                    } else {
                        if (!mergedProperty.properties?.length) {
                            mergedProperty.properties = []
                        }

                        if (mergedProperty.ofProperty) {
                            mergedProperty.description = property.description || mergedProperty.ofProperty.description || ""
                        } else {
                            mergedProperty.properties.push(property);
                        }
                    }
                }
            }
        }

        const oasSchema = schema as OasJSONSchema;
        oasSchema.__internal_getRefPath = () => componentPaths;

        if (refPath) {
            visitedRefs.set(refPath, mergedProperty);
        }
        return mergedProperty;
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

        if (refPath) {
            visitedRefs.set(refPath, enumProperty);
        }

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
                    schema.required?.includes(propName),
                    propSchema?.type === "array" ? true : false,
                    visitedRefs,
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

            const itemsProperty = schemaObjectToUniformDefinitionProperty("", schema.items, required, true, visitedRefs, arrayProperty);

            if (itemsProperty) {
                if (arrayOf || isOfType(itemsProperty.type) || itemsProperty.ofProperty?.type) {
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
            if (refPath) {
                visitedRefs.set(refPath, arrayProperty);
            }

            return arrayProperty
        }
    }

    if (arrayOf) {
        const prop = {
            type: property.type,
            name: "",
            description: "",
            ofProperty: property
        }
        if (refPath) {
            visitedRefs.set(refPath, prop);
        }
    }


    if (refPath) {
        visitedRefs.set(refPath, property);
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
    if ("example" in objProp) {
        const example = typeof objProp.example === "object" ? JSON.stringify(objProp.example) : objProp.example;
        meta.push({
            name: "example",
            value: example
        })
    }
    if ("examples" in objProp) {
        meta.push({
            name: "examples",
            value: objProp.examples
        })
    }
    if ("maximum" in objProp) {
        meta.push({
            name: "maximum",
            value: objProp.maximum
        })
    }
    if ("minimum" in objProp) {
        meta.push({
            name: "minimum",
            value: objProp.minimum
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
        || type === DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY
}