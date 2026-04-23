import type {
    Reference,
    Definition,
} from '@xyd-js/uniform';

import {
    schemaObjectToUniformDefinitionProperties,
} from '@xyd-js/openapi';

/**
 * JSON Schema structure as produced by typia.json.schemas<[T]>().
 */
interface JsonSchemaOutput {
    version?: string;
    components?: {
        schemas?: Record<string, any>;
    };
    schemas?: Array<{$ref?: string} | any>;
}

/**
 * Converts a typia JSON Schema output into an xyd uniform Reference,
 * reusing xyd-openapi's battle-tested schema → uniform converter.
 */
export function jsonSchemaToUniformReference(
    componentName: string,
    schema: JsonSchemaOutput,
): Reference {
    const ref: Reference = {
        title: componentName,
        canonical: '',
        description: '',
        definitions: [],
        examples: {groups: []},
    };

    // Resolve the root schema (follows $ref to components.schemas)
    const rootSchema = resolveRootSchema(schema);
    if (!rootSchema) return ref;

    // Inline all $ref pointers so xyd-openapi doesn't encounter unresolved refs
    const schemas = schema.components?.schemas || {};
    const inlined = inlineRefs(rootSchema, schemas);

    // Use xyd-openapi's converter
    const result = schemaObjectToUniformDefinitionProperties(inlined as any);

    const propsDef: Definition = {
        title: 'Props',
        properties: [],
        meta: [{name: 'type' as any, value: 'parameters'}],
    };

    if (Array.isArray(result)) {
        propsDef.properties = result;
    } else if (result) {
        propsDef.rootProperty = result;
    }

    if (propsDef.properties.length > 0 || propsDef.rootProperty) {
        ref.definitions.push(propsDef);
    }

    return ref;
}

function resolveRootSchema(output: JsonSchemaOutput): any | null {
    const rootRef = output.schemas?.[0];
    if (!rootRef) return null;

    if ('$ref' in rootRef && rootRef.$ref) {
        const refPath = rootRef.$ref.replace('#/components/schemas/', '');
        return output.components?.schemas?.[refPath] || null;
    }

    return rootRef;
}

/**
 * Recursively inlines all $ref pointers so the schema is self-contained
 * for xyd-openapi's converter (which warns on unresolved $ref).
 */
function inlineRefs(schema: any, schemas: Record<string, any>, visited = new Set<string>()): any {
    if (!schema || typeof schema !== 'object') return schema;

    if (schema.$ref) {
        const refPath = schema.$ref.replace('#/components/schemas/', '');
        if (visited.has(refPath)) {
            return {type: 'object', description: `(circular: ${refPath})`};
        }
        const resolved = schemas[refPath];
        if (!resolved) return schema;
        visited.add(refPath);
        const result = inlineRefs({...resolved}, schemas, visited);
        visited.delete(refPath);
        return result;
    }

    if (Array.isArray(schema)) {
        return schema.map((item) => inlineRefs(item, schemas, visited));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(schema)) {
        result[key] = inlineRefs(value, schemas, visited);
    }
    return result;
}
