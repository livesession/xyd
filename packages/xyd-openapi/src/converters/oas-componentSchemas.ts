import {OpenAPIV3} from "openapi-types";

import {
    Reference,
    Definition,
    DefinitionProperty,
    ReferenceType,
    OpenAPIReferenceContext, SymbolDef,
    ExampleGroup,
    Example,
    CodeBlockTab,
} from "@xyd-js/uniform";

import {OasJSONSchema, uniformOasOptions} from "../types";
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
        if (options?.regions && options.regions.length > 0) {
            if (!options.regions.some(region => region === "/components/schemas/" + componentSchemaName)) {
                continue
            }
        }

        if ('$ref' in componentSchema) {
            console.warn(`Skipping reference object: ${componentSchemaName}`);
            continue; // Skip reference objects
        }

        let properties: DefinitionProperty[] = [];
        let rootProperty: DefinitionProperty | undefined = undefined;
        const respProperties = schemaObjectToUniformDefinitionProperties(componentSchema) || [];
        if (Array.isArray(respProperties)) {
            properties = respProperties
        } else {
            rootProperty = respProperties
        }

        const symbolDef = definitionPropertyTypeDef(componentSchema)

        const definition: Definition = {
            title: componentSchemaName,
            properties,
            rootProperty,
            meta: [],
            symbolDef,
        };

        // Create reference
        const reference: Reference = {
            title: componentSchemaName,
            description: componentSchema.description || "",
            canonical: `objects/${componentSchemaName}`,
            definitions: [definition],
            examples: {
                // groups: [],
                groups: createSchemaExampleGroup(componentSchema as OpenAPIV3.SchemaObject)
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

function createSchemaExampleGroup(schema: OpenAPIV3.SchemaObject): ExampleGroup[] {
    const example = generateSchemaExample(schema);
    if (!example) {
        return [];
    }

    const tabs: CodeBlockTab[] = [{
        title: 'json',
        language: 'json',
        code: JSON.stringify(example, null, 2)
    }];

    return [{
        description: 'Example',
        examples: [{
            codeblock: {
                tabs
            }
        }]
    }];
}

function definitionPropertyTypeDef(
    schema: OpenAPIV3.SchemaObject | undefined,
) {
    if (!schema) {
        return
    }

    let typeDef: SymbolDef | undefined
    let oasSchema = schema as OasJSONSchema
    if (oasSchema.type === "array") {
        oasSchema = oasSchema.items as OasJSONSchema
    }
    if (oasSchema?.__internal_getRefPath) {
        const symbolId = oasSchema.__internal_getRefPath()

        typeDef = {
            id: symbolId,
        }
    }

    return typeDef
}

function generateSchemaExample(schema: OpenAPIV3.SchemaObject): any {
    if (!schema) {
        return null;
    }

    // Handle examples array
    if ('examples' in schema && Array.isArray(schema.examples)) {
        return schema.examples[0];
    }

    // Handle single example
    if ('example' in schema && schema.example !== undefined) {
        return schema.example;
    }

    // Handle object type with properties
    if (schema.type === 'object' && schema.properties) {
        const result: Record<string, any> = {};
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            result[propName] = generateSchemaExample(propSchema as OpenAPIV3.SchemaObject);
        }
        return result;
    }

    // Handle array type
    if (schema.type === 'array' && schema.items) {
        const itemExample = generateSchemaExample(schema.items as OpenAPIV3.SchemaObject);
        return itemExample ? [itemExample] : [];
    }

    // Handle primitive types with default values
    switch (schema.type) {
        case 'string':
            return '';
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return false;
        default:
            return null;
    }
}
