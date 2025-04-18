import path from 'path';

import {
    builtinHandlers as docgenHandlers,
    builtinResolvers as docgenResolver,
    parse,
} from 'react-docgen'

import { Reference, Definition, DefinitionProperty } from '@xyd-js/uniform';

const defaultHandlers = Object.values(docgenHandlers).map((handler) => handler);
const defaultResolver = new docgenResolver.FindExportedDefinitionsResolver();
const handlers = [...defaultHandlers];

export function reactDocgenToUniform(code: string, filename: string): Reference[] {
    const docs = parse(code, {
        resolver: defaultResolver,
        handlers,
        filename
    });

    const refs: Reference[] = [];
    const definitions: Definition[] = [];

    for (const doc of docs) {
        // Create the base reference
        const ref: Reference = {
            title: doc.displayName || 'Component',
            canonical: `component-${doc.displayName || 'unnamed'}`,
            description: doc.description || '',
            examples: {
                groups: []
            },
            definitions
        };

        ref.description = doc.description || '';

        if (!doc.props) {
            continue;
        }

        // Handle props
        const propsDef: Definition = {
            title: 'Props',
            properties: []
        };

        for (const [propName, prop] of Object.entries(doc.props)) {
            const propType = prop.tsType || prop.flowType || prop.type;
            if (!propType) {
                console.warn('(reactDocgenToUniform): Property type not found', propName);
                continue;
            }

            const definitionProperty: DefinitionProperty = {
                name: propName,
                type: propTypeToUniformType(propType),
                description: prop.description || ''
            };

            propsDef.properties.push(definitionProperty);
        }

        definitions.push(propsDef);

        refs.push(ref);
    }

    return refs;
}

function propTypeToUniformType(type: any): string {
    if (!type) return 'any';

    switch (type.name) {
        case 'string':
            return 'string';
        case 'number':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'func':
            return 'function';
        case 'array':
            return 'array';
        case 'object':
            return 'object';
        case 'node':
            return 'ReactNode';
        case 'element':
            return 'ReactElement';
        case 'elementType':
            return 'ReactElementType';
        case 'union':
            return type.elements.map((t: any) => propTypeToUniformType(t)).join(' | ');
        case 'literal':
            return `"${type.value}"`;
        default:
            if (type.raw) {
                return type.raw;
            }
            return type.name || 'any';
    }
} 